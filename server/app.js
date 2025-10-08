import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import shareholderRoutes from "./routes/shareholderRoutes.js";
import dmatRoutes from "./routes/dmatRoutes.js";
import clientProfileRoutes from "./routes/clientProfileRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => res.json({ message: "pong" }));

  // We remove the connectDB call from here because we are connecting in server.js

  const ensureDB = (_req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }
    next();
  };

  app.use("/api/auth", authRoutes);
  app.use("/api/users", ensureDB, userRoutes);
  app.use("/api/shareholders", shareholderRoutes);
  app.use("/api/dmat", ensureDB, dmatRoutes);
  app.use("/api/client-profiles", ensureDB, clientProfileRoutes);

  return app;
}

export default createServer;
// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import { connectDB } from "./db.js";
// import shareholderRoutes from "./routes/shareholderRoutes.js";
// import dmatRoutes from "./routes/dmatRoutes.js";
// import clientProfileRoutes from "./routes/clientProfileRoutes.js";
// import clientRoutes from "./routes/clientRoutes.js";
// import authRoutes from "./routes/authRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import externalRoutes from "./routes/externalRoutes.js";

// export function createServer() {
//   const app = express();

//   // ---------------------
//   // CORS Middleware
//   // ---------------------
//   app.use(cors({
//     origin: [
//       "http://localhost:5173", // local frontend
//       "https://f7f48d22e8e54090adc71d8f9d82a08c-ca526187-8c24-4f50-a5b5-8ca37d.projects.builder.codes" // deployed frontend
//     ],
//     credentials: true, // allow cookies / auth headers
//   }));

//   // ---------------------
//   // JSON and URL-encoded Middleware
//   // ---------------------
//   app.use(express.json());
//   app.use(express.urlencoded({ extended: true }));

//   // ---------------------
//   // Health check route
//   // ---------------------
//   app.get("/api/ping", (_req, res) => res.json({ message: "pong" }));

//   // ---------------------
//   // DB connection (no-op if already connected)
//   // ---------------------
//   connectDB();

//   const ensureDB = (_req, res, next) => {
//     if (mongoose.connection.readyState !== 1) {
//       return res.status(503).json({ error: "Database not connected" });
//     }
//     next();
//   };

//   // ---------------------
//   // API Routes
//   // ---------------------
//   app.use("/api/auth", authRoutes);
//   app.use("/api/users", ensureDB, userRoutes);
//   app.use("/api/clients", ensureDB, clientRoutes);
//   app.use("/api/shareholders", shareholderRoutes);
//   app.use("/api/dmat", ensureDB, dmatRoutes);
//   app.use("/api/client-profiles", ensureDB, clientProfileRoutes);
//   app.use("/api/external", externalRoutes);

//   return app;
// }

// export default createServer;
