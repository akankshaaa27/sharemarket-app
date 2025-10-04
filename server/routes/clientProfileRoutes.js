import express from "express";
import ClientProfile from "../models/ClientProfile.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { sendMail } from "../utils/mailer.js";
import XLSX from "xlsx";

const router = express.Router();

function generateUsername(name) {
  const clean = (name || "client").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${clean}${Math.floor(1000 + Math.random() * 9000)}`;
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

// GET all (with search + pagination)
router.get("/", async (req, res) => {
  try {
    const pageNum = parseInt(req.query.page, 10);
    const limitNum = parseInt(req.query.limit, 10);
    const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const limit = Math.min(Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 20, 100);
    const skip = (page - 1) * limit;
    const q = (req.query.q || "").toString().trim();

    const filter = q
      ? {
          $or: [
            { "shareholderName.name1": { $regex: q, $options: "i" } },
            { panNumber: { $regex: q, $options: "i" } },
            { "companies.companyName": { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      ClientProfile.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ClientProfile.countDocuments(filter),
    ]);

    res.json({ data: items, page, limit, total });
  } catch (e) {
    console.error("GET /client-profiles error:", e);
    res.status(500).json({ error: e.message || "Internal Server Error" });
  }
});

// GET by ID
router.get("/:id", async (req, res) => {
  try {
    const item = await ClientProfile.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    console.error("GET /client-profiles/:id error:", e);
    res.status(500).json({ error: e.message || "Internal Server Error" });
  }
});

// POST create (also auto-create user)
router.post("/", async (req, res) => {
  try {
    const created = await ClientProfile.create(req.body);

    const baseName = created?.shareholderName?.name1 || "client";
    const email = created?.email || req.body?.email || null;
    const phone = created?.phone || req.body?.phone || null;

    // Create a user for this client
    const username = (req.body?.username || generateUsername(baseName)).slice(0, 24);
    const plain = req.body?.password || generatePassword();
    const passwordHash = await bcrypt.hash(plain, 10);

    await User.create({
      username,
      name: baseName,
      email,
      phone,
      role: "client",
      passwordHash,
      passwordPlain: plain,
      assignedClientIds: [created._id],
    });

    if (email) {
      await sendMail({
        to: email,
        subject: "Your Account Credentials",
        text: `Username: ${username}\nEmail: ${email}\nPassword: ${plain}`,
      });
    }

    res.status(201).json(created);
  } catch (e) {
    console.error("Create client profile error:", e);
    res.status(400).json({ error: e.message });
  }
});

// PUT update
router.put("/:id", async (req, res) => {
  try {
    const updated = await ClientProfile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE remove
router.delete("/:id", async (req, res) => {
  const deleted = await ClientProfile.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

// Export all to Excel
router.get("/export", async (_req, res) => {
  const items = await ClientProfile.find({}).lean();
  const sheet = XLSX.utils.json_to_sheet(
    items.map((i) => ({
      id: i._id?.toString(),
      name1: i.shareholderName?.name1,
      panNumber: i.panNumber,
      status: i.status,
      dematAccountNumber: i.dematAccountNumber,
    })),
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Clients");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", "attachment; filename=clients.xlsx");
  res.send(buf);
});

// Export single profile
router.get("/:id/export", async (req, res) => {
  const item = await ClientProfile.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: "Not found" });
  const rows = [item];
  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Profile");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=client-${item._id}.xlsx`,
  );
  res.send(buf);
});

export default router;
