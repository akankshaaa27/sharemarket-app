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

// import express from "express";
// import User from "../models/User.js";
// import { authenticate, requireRole } from "../middleware/auth.js";
// import { hashPassword, generateRandomPassword } from "../utils/password.js";
// import { sendCredentialsEmail } from "../utils/email.js";

// const router = express.Router();
// const allowedRoles = ["admin", "employee", "client"];

// router.use(authenticate, requireRole("admin"));

// router.get("/", async (_req, res) => {
//   const users = await User.find().select("+passwordPlain");
//   return res.json({
//     data: users.map((user) => user.toSafeObject(true)),
//   });
// });

// router.get("/:id", async (req, res) => {
//   const user = await User.findById(req.params.id).select("+passwordPlain");
//   if (!user) return res.status(404).json({ error: "User not found" });
//   return res.json({ user: user.toSafeObject(true) });
// });

// router.put("/:id", async (req, res) => {
//   const { name, email, phoneNumber, role, isActive } = req.body || {};
//   const user = await User.findById(req.params.id);
//   if (!user) return res.status(404).json({ error: "User not found" });

//   if (email && email.toLowerCase() !== user.email) {
//     const emailExists = await User.exists({ email: email.toLowerCase(), _id: { $ne: user._id } });
//     if (emailExists) {
//       return res.status(409).json({ error: "Email already in use" });
//     }
//     user.email = email.toLowerCase();
//   }

//   if (name) user.name = name;
//   if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
//   if (typeof isActive === "boolean") {
//     user.isActive = isActive;
//   }
//   if (role) {
//     if (!allowedRoles.includes(role)) {
//       return res.status(400).json({ error: "Invalid role" });
//     }
//     user.role = role;
//   }

//   await user.save();
//   return res.json({ user: user.toSafeObject(true) });
// });

// router.post("/:id/reset-password", async (req, res) => {
//   const { password } = req.body || {};
//   const user = await User.findById(req.params.id).select(
//     "+passwordHash +passwordPlain",
//   );
//   if (!user) return res.status(404).json({ error: "User not found" });

//   const newPassword = password || generateRandomPassword();
//   user.passwordHash = await hashPassword(newPassword);
//   user.passwordPlain = newPassword;
//   user.passwordAutoGenerated = !password;
//   await user.save();

//   await sendCredentialsEmail({
//     to: user.email,
//     name: user.name,
//     username: user.username,
//     password: newPassword,
//   });

//   return res.json({ success: true, password: newPassword });
// });

// router.delete("/:id", async (req, res) => {
//   if (req.params.id === req.user.id) {
//     return res.status(400).json({ error: "Admins cannot delete their own account" });
//   }
//   const user = await User.findById(req.params.id);
//   if (!user) return res.status(404).json({ error: "User not found" });
//   await user.deleteOne();
//   return res.json({ success: true });
// });

// export default router;
