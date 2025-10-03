import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { issueToken, auth } from "../middleware/auth.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, email, password } = req.body || {};
  const query = username ? { username } : { email };
  const user = await User.findOne(query);
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });
  const token = issueToken(user);
  res.json({ token, user: { id: user._id, username: user.username, role: user.role, name: user.name, email: user.email } });
});

router.post("/forgot", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: true });
  const resetCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  user.passwordPlain = resetCode; // temp
  user.passwordHash = await bcrypt.hash(resetCode, 10);
  await user.save();
  await sendMail({
    to: email,
    subject: "Password Reset",
    text: `Your temporary password is: ${resetCode}`,
  });
  res.json({ success: true });
});

router.post("/reset", auth, async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: "Password required" });
  req.user.passwordHash = await bcrypt.hash(password, 10);
  req.user.passwordPlain = password; // per spec (admin-visible)
  await req.user.save();
  res.json({ success: true });
});

router.get("/me", auth, async (req, res) => {
  const u = req.user;
  res.json({ id: u._id, username: u.username, role: u.role, name: u.name, email: u.email });
});

export default router;
