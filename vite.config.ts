import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/oscilloscope/', // GitHub Pages base path
  server: {
    host: "0.0.0.0", // Force IPv4 binding to all interfaces
    port: 5173,
    strictPort: false,
  },
});
