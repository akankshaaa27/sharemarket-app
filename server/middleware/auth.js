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

// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// const JWT_SECRET = process.env.JWT_SECRET;
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// if (!JWT_SECRET) {
//   console.warn("JWT_SECRET is not set. Authentication will not work correctly without it.");
// }

// export function createAccessToken(user) {
//   if (!user) throw new Error("User required for token generation");
//   if (!JWT_SECRET) {
//     throw new Error("JWT_SECRET is not configured");
//   }
//   return jwt.sign(
//     {
//       sub: user.id,
//       role: user.role,
//     },
//     JWT_SECRET,
//     { expiresIn: JWT_EXPIRES_IN },
//   );
// }

// export async function authenticate(req, res, next) {
//   try {
//     const authHeader = req.headers.authorization || "";
//     const token = authHeader.startsWith("Bearer ")
//       ? authHeader.slice(7)
//       : null;
//     if (!token) {
//       return res.status(401).json({ error: "Authentication required" });
//     }
//     if (!JWT_SECRET) {
//       return res.status(500).json({ error: "Server configuration error" });
//     }
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await User.findById(decoded.sub);
//     if (!user) {
//       return res.status(401).json({ error: "Invalid token" });
//     }
//     req.user = user;
//     next();
//   } catch (error) {
//     return res.status(401).json({ error: "Invalid or expired token" });
//   }
// }

// export function requireRole(...roles) {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(401).json({ error: "Authentication required" });
//     }
//     if (req.user.role === "admin") {
//       return next();
//     }
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ error: "Insufficient permissions" });
//     }
//     return next();
//   };
// }

// export async function optionalAuthenticate(req, _res, next) {
//   const authHeader = req.headers.authorization || "";
//   const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
//   if (!token) return next();
//   if (!JWT_SECRET) return next();
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await User.findById(decoded.sub);
//     if (user) {
//       req.user = user;
//     }
//   } catch (error) {
//     console.warn("Optional auth failed", error.message);
//   }
//   return next();
// }

// export const isAdmin = requireRole("admin");
// export const isEmployee = requireRole("employee", "admin");
