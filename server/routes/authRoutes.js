import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { issueToken, auth } from "../middleware/auth.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

// Login (supports username or email)
router.post("/login", async (req, res) => {
  const { username, email, emailOrUsername, password } = req.body || {};
  const query = emailOrUsername
    ? { $or: [{ username: emailOrUsername }, { email: emailOrUsername }] }
    : username
    ? { username }
    : { email };
  const user = await User.findOne(query);
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });
  const token = issueToken(user);
  res.json({ token, user: { id: user._id, username: user.username, role: user.role, name: user.name, email: user.email } });
});

// Minimal register endpoint (admin or system could use; for now open)
router.post("/register", async (req, res) => {
  try {
    const { username, name, email, phone, role = "client" } = req.body || {};
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(400).json({ error: "User already exists" });
    const plain = req.body?.password || Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(plain, 10);
    const created = await User.create({ username, name, email, phone, role, passwordHash, passwordPlain: plain });
    if (email) {
      await sendMail({ to: email, subject: "Your Account Credentials", text: `Username: ${username}\nEmail: ${email}\nPassword: ${plain}` });
    }
    res.status(201).json({ id: created._id, username: created.username });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Forgot password (email a temp password)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: true });
  const resetCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  user.passwordPlain = resetCode;
  user.passwordHash = await bcrypt.hash(resetCode, 10);
  await user.save();
  await sendMail({ to: email, subject: "Password Reset", text: `Your temporary password is: ${resetCode}` });
  res.json({ success: true });
});

// Change password (authenticated)
router.post("/change-password", auth, async (req, res) => {
  const { password, newPassword } = req.body || {};
  const nextPassword = newPassword || password;
  if (!nextPassword) return res.status(400).json({ error: "Password required" });
  req.user.passwordHash = await bcrypt.hash(nextPassword, 10);
  req.user.passwordPlain = nextPassword;
  await req.user.save();
  res.json({ success: true });
});

// Me
router.get("/me", auth, async (req, res) => {
  const u = req.user;
  res.json({ user: { id: u._id, username: u.username, role: u.role, name: u.name, email: u.email } });
});

export default router;
