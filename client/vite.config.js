import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  optimizeDeps: {
    include: ["lucide-react"], // pre-bundle lucide-react
  },
  server: {
    port: 5000,
    host: "0.0.0.0",
    strictPort: true,
    hmr: { clientPort: 5000 },
    proxy: { "/api": "http://localhost:3000" },
  },
  build: {
    outDir: "dist/spa",
    sourcemap: false,
    chunkSizeWarningLimit: 1500, // Increase if some chunks are large
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("lucide-react")) {
              return "vendor-react"; // split react & lucide-react
            }
            return "vendor"; // split other node_modules
          }
        },
      },
    },
  },
});
