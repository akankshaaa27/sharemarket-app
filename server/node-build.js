import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createServer();

const spaDir = path.resolve(__dirname, "../spa");
app.use(express.static(spaDir));
app.get("*", (_req, res, next) => {
  const filePath = path.join(spaDir, "index.html");
  res.sendFile(filePath, (err) => (err ? next() : undefined));
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
