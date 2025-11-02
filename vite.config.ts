import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"]
        }
      }
    }
  },
  server: {
    port: 8000,
    host: "0.0.0.0",
    fs: {
      allow: [".."]
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom"]
  }
});