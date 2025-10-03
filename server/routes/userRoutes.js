import express from "express";
import User from "../models/User.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().populate("clientId assignedClients").sort({ createdAt: -1 });
    
    const usersWithPlainPasswords = users.map((user) => {
      const obj = user.toObject();
      return obj;
    });

    res.json(usersWithPlainPasswords);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("clientId assignedClients");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.user.role !== "admin" && req.user.userId !== user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(user.toObject());
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    if (req.user.role !== "admin" && req.user.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const allowedUpdates = ["name", "email", "phoneNumber", "role", "isActive", "assignedClients"];
    const updateData = {};

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.toSafeObject());
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.post("/:id/reset-password", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = newPassword;
    user.plainPassword = newPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
