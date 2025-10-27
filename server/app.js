import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Routes
import shareholderRoutes from "./routes/shareholderRoutes.js";
import dmatRoutes from "./routes/dmatRoutes.js";
import clientProfileRoutes from "./routes/clientProfileRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Optional: You can later re-enable connectDB() in server.js for Render
// import { connectDB } from "./db.js";

export function createServer() {
  const app = express();

  // -----------------------------------------
  // ✅ CORS Configuration
  // -----------------------------------------
  const allowedOrigins = [
    process.env.FRONTEND_URL || "https://sharemarket-app-three.vercel.app", // your deployed frontend on Vercel
    "https://sharemarket-app-git-main-akankshaaa27s-projects.vercel.app",   // alt preview deploy
    "http://localhost:5173", // local dev
    "http://localhost:5000", // local dev (vite)
  ];

  app.use(cors({
    origin(origin, callback) {
      // allow requests from tools like Postman or server-to-server (no origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("CORS policy: origin not allowed"), false);
    },
    credentials: true,
  }));

  // -----------------------------------------
  // ✅ Middleware
  // -----------------------------------------
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // -----------------------------------------
  // ✅ Health check route
  // -----------------------------------------
  app.get("/api/ping", (_req, res) => res.json({ message: "pong" }));

  // -----------------------------------------
  // ✅ Ensure DB Connection middleware
  // -----------------------------------------
  const ensureDB = (_req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }
    next();
  };

  // -----------------------------------------
  // ✅ API Routes
  // -----------------------------------------
  app.use("/api/auth", authRoutes);
  app.use("/api/users", ensureDB, userRoutes);
  app.use("/api/shareholders", ensureDB, shareholderRoutes);
  app.use("/api/dmat", ensureDB, dmatRoutes);
  app.use("/api/client-profiles", ensureDB, clientProfileRoutes);

  // -----------------------------------------
  // ✅ Fallback route
  // -----------------------------------------
  app.use("*", (_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  return app;
}

export default createServer;
