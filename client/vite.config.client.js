import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    outDir: "dist/spa", // ✅ matches your vercel.json
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"), // ✅ better to point to /src for React imports
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    strictPort: true,
    proxy: {
      "/api": {
        target:
          mode === "production"
            ? "https://sharemarket-app.onrender.com"
            : "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    __API_BASE__: JSON.stringify(
      mode === "production"
        ? "https://sharemarket-app.onrender.com"
        : "http://localhost:3000"
    ),
  },
}));
