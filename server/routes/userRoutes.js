import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(auth, requireRole("admin"));

router.get("/", async (_req, res) => {
  const users = await User.find({}).select(
    "username name email phone role createdAt passwordPlain",
  );
  res.json({ data: users });
});

router.put("/:id", async (req, res) => {
  const updates = (({ name, email, phone, role }) => ({
    name,
    email,
    phone,
    role,
  }))(req.body || {});
  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

router.post("/:id/reset-password", async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: "Password required" });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { passwordHash: hash, passwordPlain: password },
    { new: true },
  );
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

export default router;
