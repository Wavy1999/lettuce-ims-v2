import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/lettuce-ims-v2/",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["chart.js", "react-chartjs-2"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
