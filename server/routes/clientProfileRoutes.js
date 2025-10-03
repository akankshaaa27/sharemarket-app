import express from "express";
import ClientProfile from "../models/ClientProfile.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/email.js";

const router = express.Router();

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

// GET all (with search + pagination)
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const q = (req.query.q || "").trim();

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
});

// GET by ID
router.get("/:id", async (req, res) => {
  const item = await ClientProfile.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

// POST create
router.post("/", async (req, res) => {
  try {
    const profileData = req.body;
    
    let userId = null;
    let credentials = null;
    
    if (profileData.shareholderName?.name1) {
      const name = profileData.shareholderName.name1;
      let email = profileData.email;
      const phoneNumber = profileData.phoneNumber;
      
      if (!email) {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        email = `${cleanName}${Date.now()}@temp-sharemarket.com`;
      }
      
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      
      if (!existingUser) {
        const username = generateUsername(name);
        const password = generatePassword();
        
        const newUser = new User({
          username,
          name,
          email: email.toLowerCase(),
          password,
          plainPassword: password,
          phoneNumber,
          role: "client",
        });
        
        await newUser.save();
        userId = newUser._id;
        credentials = { username, email, password };
        
        if (email && !email.includes('@temp-sharemarket.com')) {
          try {
            await sendEmail({
              to: email,
              subject: "Welcome to ShareMarket Manager Pro - Your Login Credentials",
              html: `
                <h2>Welcome to ShareMarket Manager Pro!</h2>
                <p>Dear ${name},</p>
                <p>Your client account has been successfully created. Here are your login credentials:</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Username:</strong> ${username}</p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Password:</strong> ${password}</p>
                </div>
                <p>Please keep these credentials secure and change your password after your first login.</p>
                <p>Best regards,<br>ShareMarket Manager Pro Team</p>
              `,
            });
          } catch (emailError) {
            console.error("Failed to send email:", emailError);
          }
        }
      } else {
        userId = existingUser._id;
      }
    }
    
    if (userId) {
      profileData.userId = userId;
    }
    
    const created = await ClientProfile.create(profileData);
    
    if (userId) {
      await User.findByIdAndUpdate(userId, { clientId: created._id });
    }
    
    res.status(201).json({ 
      profile: created,
      credentials: credentials || null,
    });
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

export default router;
