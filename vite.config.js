import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default ({ mode }) => {
  // Load env variables based on mode (development, production)
  const env = loadEnv(mode, process.cwd(), "");

  // Default API URL for dev
  const API_URL =
    mode === "production"
      ? env.VITE_API_BASE_URL || "https://sharemarket-app.onrender.com"
      : "http://localhost:3000";

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5000,
      host: "0.0.0.0",
      strictPort: true,
      allowedHosts: true,
      hmr: {
        clientPort: 5000,
      },
      proxy:
        mode === "development"
          ? {
            "/api": API_URL,
          }
          : undefined, // No proxy in production
    },
    build: { outDir: "dist/spa" },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(API_URL),
    },
  });
};
