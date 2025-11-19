import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/osc/", // GitHub Pages base path (matches repository name)
  server: {
    host: "localhost",
    port: 5173,
    strictPort: false,
  },
});
