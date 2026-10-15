import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server runs on 5173 and proxies "/api" to the backend so that the
// HttpOnly auth cookie is same-origin while developing. Requests from the app
// therefore use relative "/api/..." URLs and include credentials.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
