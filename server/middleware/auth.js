import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export function authenticateToken(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function isEmployee(req, res, next) {
  if (req.user.role !== "employee" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Employee or admin access required" });
  }
  next();
}

export async function canAccessClient(req, res, next) {
  try {
    if (req.user.role === "admin") {
      return next();
    }

    const clientId = req.params.id || req.body.clientId;
    
    if (req.user.role === "client") {
      const user = await User.findById(req.user.userId);
      if (user.clientId && user.clientId.toString() === clientId) {
        return next();
      }
      return res.status(403).json({ error: "Access denied" });
    }

    if (req.user.role === "employee") {
      const user = await User.findById(req.user.userId);
      if (user.assignedClients && user.assignedClients.some(id => id.toString() === clientId)) {
        return next();
      }
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(403).json({ error: "Access denied" });
  } catch (error) {
    console.error("Access control error:", error);
    return res.status(500).json({ error: "Failed to verify access" });
  }
}
