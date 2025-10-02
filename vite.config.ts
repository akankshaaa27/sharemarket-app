import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer as createApiServer } from "./server/index";

function expressDevMiddleware() {
  return {
    name: "express-dev-middleware",
    configureServer(vite) {
      const app = createApiServer();
      vite.middlewares.use(app);
    },
  };
}

export default defineConfig({
  plugins: [react(), expressDevMiddleware()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: "dist/spa",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
