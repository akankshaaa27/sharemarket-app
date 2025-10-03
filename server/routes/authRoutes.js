import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import ClientProfile from "../models/ClientProfile.js";
import { sendEmail } from "../utils/email.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = "7d";

function generateUsername(name) {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${randomNum}`;
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: "Email/username and password are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() },
      ],
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email/username or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email/username or password" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, phoneNumber, password, username, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const generatedUsername = username || generateUsername(name);
    const generatedPassword = password || generatePassword();
    const plainPassword = generatedPassword;

    const usernameExists = await User.findOne({ username: generatedUsername });
    if (usernameExists) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const newUser = new User({
      username: generatedUsername,
      name,
      email: email.toLowerCase(),
      password: generatedPassword,
      plainPassword,
      phoneNumber,
      role: role || "client",
    });

    await newUser.save();

    try {
      await sendEmail({
        to: email,
        subject: "Welcome to ShareMarket Manager Pro - Your Login Credentials",
        html: `
          <h2>Welcome to ShareMarket Manager Pro!</h2>
          <p>Dear ${name},</p>
          <p>Your account has been successfully created. Here are your login credentials:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Username:</strong> ${generatedUsername}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${plainPassword}</p>
          </div>
          <p>Please keep these credentials secure and change your password after your first login.</p>
          <p>Best regards,<br>ShareMarket Manager Pro Team</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.toSafeObject(),
      credentials: { username: generatedUsername, password: plainPassword },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email} = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({ message: "If the email exists, a reset link will be sent" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5000"}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request - ShareMarket Manager Pro",
        html: `
          <h2>Password Reset Request</h2>
          <p>Dear ${user.name},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>ShareMarket Manager Pro Team</p>
        `,
      });

      res.json({ message: "Password reset link sent to your email" });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      res.status(500).json({ error: "Failed to send reset email" });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    user.password = password;
    user.plainPassword = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    user.plainPassword = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

export default router;
