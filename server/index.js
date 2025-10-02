import "dotenv/config";
import express from "express";
import cors from "cors";
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

  app.use("/api/shareholders", shareholderRoutes);
  app.use("/api/dmat", dmatRoutes);
  app.use("/api/client-profiles", clientProfileRoutes);

  return app;
}

export default createServer;
