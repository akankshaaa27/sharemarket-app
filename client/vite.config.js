import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    // port: 5000,
    port: 5173,

    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: true,
    hmr: {
      // clientPort: 5000,
        clientPort: 5173,

    },
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: { outDir: "dist/spa" },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
