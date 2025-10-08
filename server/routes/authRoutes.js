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
    const { email } = req.body;

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

// import express from "express";
// import User from "../models/User.js";
// import {
//   hashPassword,
//   verifyPassword,
//   generateRandomPassword,
//   generateUsernameFromName,
//   generateResetToken,
//   hashResetToken,
// } from "../utils/password.js";
// import {
//   createAccessToken,
//   authenticate,
//   optionalAuthenticate,
//   requireRole,
// } from "../middleware/auth.js";
// import {
//   sendCredentialsEmail,
//   sendPasswordResetEmail,
// } from "../utils/email.js";

// const router = express.Router();

// function buildUserResponse(user, { includePlain = false } = {}) {
//   return user.toSafeObject(includePlain);
// }

// router.post("/login", async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const user = await User.findOne({ username }).select("+passwordHash +passwordPlain");

//     if (!user) {
//       return res.status(401).json({ error: "Invalid username or password" });
//     }

//     const isValid = user.passwordPlain === password; // replace with bcrypt.compare if hashed
//     if (!isValid) {
//       return res.status(401).json({ error: "Invalid username or password" });
//     }

//     const token = createAccessToken(user);
//     return res.json({ token, user: user.toSafeObject(true) });

//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Internal server error", details: err.message });
//   }
// });

// router.post("/admin/login", async (req, res) => {
//   if (process.env.NODE_ENV === "production") {
//     return res.status(403).json({ error: "Admin debug login disabled in production" });
//   }

//   try {
//     const { identifier, password } = req.body || {};
//     if (!identifier || !password) {
//       return res.status(400).json({ error: "Identifier and password are required" });
//     }

//     const lowered = String(identifier).toLowerCase();
//     const user = await User.findOne({
//       $or: [{ username: lowered }, { email: lowered }],
//     }).select("+passwordPlain +passwordHash +role");

//     if (!user || user.role !== "admin") {
//       return res.status(403).json({ error: "Admin account not found" });
//     }

//     if (user.isActive === false) {
//       return res.status(403).json({ error: "Account is inactive. Contact an administrator." });
//     }

//     let match = false;
//     if (user.passwordPlain) {
//       match = user.passwordPlain === password;
//     }
//     if (!match) {
//       match = await verifyPassword(password, user.passwordHash);
//     }
//     if (!match) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     // TODO: Re-enable JWT authentication after debugging
//     // const token = createAccessToken(user);

//     return res.json({
//       token: "debug-admin-session",
//       user: buildUserResponse(user, true),
//       debugBypass: true,
//     });
//   } catch (err) {
//     console.error("Admin debug login error:", err);
//     res.status(500).json({ error: "Internal server error", details: err.message });
//   }
// });


// router.get("/me", authenticate, async (req, res) => {
//   return res.json({ user: buildUserResponse(req.user) });
// });

// router.post("/logout", (_req, res) => {
//   return res.json({ success: true });
// });

// router.post("/register", optionalAuthenticate, async (req, res) => {
//   const { username, email, name, password, phoneNumber, role = "client" } = req.body || {};
//   if (!email || !name) {
//     return res.status(400).json({ error: "Name and email are required" });
//   }

//   const totalUsers = await User.countDocuments();
//   const requester = req.user;

//   if (totalUsers > 0) {
//     if (!requester || requester.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can create new users" });
//     }
//   }

//   const existing = await User.findOne({
//     $or: [{ email: email.toLowerCase() }, { username: username?.toLowerCase() }],
//   });
//   if (existing) {
//     return res.status(409).json({ error: "User with provided email or username already exists" });
//   }

//   let finalUsername = username?.toLowerCase();
//   if (!finalUsername) {
//     finalUsername = generateUsernameFromName(name, "user");
//   }

//   let finalPassword = password;
//   let autoGenerated = false;
//   if (!finalPassword) {
//     finalPassword = generateRandomPassword();
//     autoGenerated = true;
//   }

//   const passwordHash = await hashPassword(finalPassword);
//   const newUser = await User.create({
//     username: finalUsername,
//     email: email.toLowerCase(),
//     name,
//     phoneNumber,
//     role: role === "admin" && totalUsers === 0 ? "admin" : role,
//     passwordHash,
//     passwordPlain: finalPassword,
//     passwordAutoGenerated: autoGenerated,
//   });

//   await sendCredentialsEmail({
//     to: newUser.email,
//     name: newUser.name,
//     username: newUser.username,
//     password: finalPassword,
//   });

//   return res.status(201).json({
//     user: buildUserResponse(newUser),
//     password: finalPassword,
//   });
// });

// router.post("/forgot-password", async (req, res) => {
//   const { email, resetUrlBase } = req.body || {};
//   if (!email) {
//     return res.status(400).json({ error: "Email is required" });
//   }

//   const user = await User.findOne({ email: email.toLowerCase() }).select(
//     "+resetTokenHash +resetTokenExpires",
//   );
//   if (!user) {
//     return res.json({ success: true });
//   }

//   const { token, tokenHash } = generateResetToken();
//   user.resetTokenHash = tokenHash;
//   user.resetTokenExpires = new Date(Date.now() + 1000 * 60 * 60);
//   await user.save();

//   const base =
//     resetUrlBase || process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
//   const urlBase = base.endsWith("/") ? base.slice(0, -1) : base;
//   const resetUrl = `${urlBase}/reset-password?token=${token}&email=${encodeURIComponent(
//     user.email,
//   )}`;

//   await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

//   return res.json({ success: true });
// });

// router.post("/reset-password", async (req, res) => {
//   const { email, token, password } = req.body || {};
//   if (!email || !token || !password) {
//     return res.status(400).json({ error: "Email, token, and new password are required" });
//   }

//   const user = await User.findOne({ email: email.toLowerCase() }).select(
//     "+resetTokenHash +resetTokenExpires +passwordHash +passwordPlain",
//   );
//   if (!user || !user.resetTokenHash || !user.resetTokenExpires) {
//     return res.status(400).json({ error: "Invalid token" });
//   }
//   if (user.resetTokenExpires.getTime() < Date.now()) {
//     return res.status(400).json({ error: "Reset token expired" });
//   }

//   const providedHash = hashResetToken(token);
//   if (providedHash !== user.resetTokenHash) {
//     return res.status(400).json({ error: "Invalid token" });
//   }

//   user.passwordHash = await hashPassword(password);
//   user.passwordPlain = password;
//   user.passwordAutoGenerated = false;
//   user.resetTokenHash = undefined;
//   user.resetTokenExpires = undefined;
//   await user.save();

//   await sendCredentialsEmail({
//     to: user.email,
//     name: user.name,
//     username: user.username,
//     password,
//   });

//   return res.json({ success: true });
// });

// router.get("/admin/users", authenticate, requireRole("admin"), async (_req, res) => {
//   const users = await User.find().select("+passwordPlain");
//   return res.json({
//     data: users.map((user) => user.toSafeObject(true)),
//   });
// });

// export default router;
