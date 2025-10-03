import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./db.js";
import User from "./models/User.js";

async function createAdminUser() {
  try {
    await connectDB();

    const adminEmail = "admin@sharemarket.com";
    const adminPassword = "Admin123!";

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log("✓ Admin user already exists");
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
      process.exit(0);
    }

    const admin = new User({
      username: "admin",
      name: "System Administrator",
      email: adminEmail,
      password: adminPassword,
      plainPassword: adminPassword,
      phoneNumber: "+91 9999999999",
      role: "admin",
      isActive: true,
    });

    await admin.save();

    console.log("✓ Admin user created successfully!");
    console.log("");
    console.log("Login Credentials:");
    console.log("==================");
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("");
    console.log("You can login at: http://localhost:5000/login");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();
