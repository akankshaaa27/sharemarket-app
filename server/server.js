import { createServer } from "./app.js";
import { connectDB } from "./db.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database first
    await connectDB();
    
    // Then create and start server
    const app = createServer();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: ${process.env.DB_NAME}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
// AI Server

// import dotenv from "dotenv";
// import { createServer } from "./app.js";
// import { connectDB } from "./db.js";
// import cron from "node-cron";
// import dotenv from "dotenv";

// // Load environment variables
// dotenv.config();

// const PORT = process.env.PORT || 5000;

// async function startServer() {
//   try {
//     console.log("⏳ Connecting to database...");
//     await connectDB();
//     console.log("✅ Database connected successfully");

//     // Initialize Express app
//     const app = createServer();

//     // Start the server
//     const server = app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 Server running on http://localhost:${PORT}`);
//       if (process.env.NODE_ENV) console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
//       if (process.env.DB_NAME) console.log(`📊 Database: ${process.env.DB_NAME}`);
//     });

//     // Nightly sync at midnight server time
//     const symbols = (process.env.SYNC_SYMBOLS || "RELIANCE,INFY,TCS,HDFCBANK").split(",").map(s=>s.trim());
//     cron.schedule("0 0 * * *", async () => {
//       try {
//         console.log("🕛 Running daily market data sync...");
//         const base = `http://localhost:${PORT}`;
//         for (const sym of symbols) {
//           await fetch(`${base}/api/external/nse/quote/${encodeURIComponent(sym)}`);
//           const to = Math.floor(Date.now()/1000);
//           const from = to - 30*24*60*60;
//           await fetch(`${base}/api/external/mc/historical?symbol=${encodeURIComponent(sym)}&resolution=1D&from=${from}&to=${to}`);
//         }
//         console.log("✅ Daily sync completed");
//       } catch (err) {
//         console.error("❌ Daily sync failed:", err.message);
//       }
//     });
//   } catch (error) {
//     console.error("❌ Failed to start server:", error.message);
//     process.exit(1);
//   }
// }

// // Handle unhandled promise rejections globally
// process.on("unhandledRejection", (err) => {
//   console.error("🚨 Unhandled Promise Rejection:", err);
//   process.exit(1);
// });

// startServer();
