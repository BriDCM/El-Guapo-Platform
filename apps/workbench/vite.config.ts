import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
  server: {
    // Bind explicitly to IPv4 so browsers resolving localhost to 127.0.0.1
    // can reach the local-only workbench consistently on macOS.
    host: "127.0.0.1",
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:3001",
      "/health": "http://127.0.0.1:3001"
    }
  }
});
