import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // O build vai para ../fastapi-app/../frontend/dist
  // que é lido pelo main.py
  build: {
    outDir: "dist",
  },
  server: {
    // Em dev, faz proxy das chamadas /api para o FastAPI
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});