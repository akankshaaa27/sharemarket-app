import express from "express";
import ClientProfile from "../models/ClientProfile.js";

const router = express.Router();

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

// POST create
router.post("/", async (req, res) => {
  try {
    const created = await ClientProfile.create(req.body);
    res.status(201).json(created);
  } catch (e) {
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

export default router;
