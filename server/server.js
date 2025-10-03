import { createServer } from "./app.js";
import { connectDB } from "./db.js";

const PORT = process.env.PORT || 5000;

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