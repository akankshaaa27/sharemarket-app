import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import shareholderRoutes from "./routes/shareholderRoutes.js";
import dmatRoutes from "./routes/dmatRoutes.js";
import clientProfileRoutes from "./routes/clientProfileRoutes.js";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => res.json({ message: "pong" }));

  // Initiate DB connection (no-op if already connected)
  connectDB();

  const ensureDB = (_req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }
    next();
  };

  app.use("/api/shareholders", shareholderRoutes);
  app.use("/api/dmat", ensureDB, dmatRoutes);
  app.use("/api/client-profiles", ensureDB, clientProfileRoutes);

  return app;
}

export default createServer;
