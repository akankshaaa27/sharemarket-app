import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ShareMarket";

// Connect with retry logic
export async function connectDB(retries = 5, delay = 5000) {
  if (!uri) throw new Error("MONGODB_URI not set");

  for (let i = 0; i < retries; i++) {
    try {
      // Prevent duplicate connections
      if (mongoose.connection.readyState >= 1) {
        console.log(`ℹ️ MongoDB already connected: ${dbName}`);
        return;
      }

      await mongoose.connect(uri, { dbName });
      console.log(`✅ MongoDB connected: ${dbName}`);
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection failed (attempt ${i + 1}): ${err.message}`);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error("❌ All retry attempts failed. Exiting...");
        process.exit(1);
      }
    }
  }
}

export default mongoose;
