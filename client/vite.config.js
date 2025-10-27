import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // ✅ Changed from ./client to ./src (frontend source)
      "@shared": path.resolve(__dirname, "../shared")
    },
  },
  optimizeDeps: {
    include: ["lucide-react", "recharts"],
  },
  server: {
    port: 5000,
    host: "0.0.0.0",
    strictPort: true,
    hmr: { clientPort: 5000 },
    // Only proxy in development
    ...(mode === 'development' ? {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    } : {})
  },

  // Force production to always use Render backend
  define: {
    __API_BASE__: JSON.stringify("https://sharemarket-app.onrender.com"),
  },

  build: {
    outDir: "dist/spa",
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
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
}));
