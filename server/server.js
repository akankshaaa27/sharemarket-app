import { createServer } from "./index.js";
import { connectDB } from "./db.js";

const app = createServer();
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Express API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
  });
