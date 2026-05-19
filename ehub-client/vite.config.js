import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const minioProxy = {
  target: "http://127.0.0.1:9000",
  changeOrigin: false,
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: [
      "localhost",
      ".trycloudflare.com",
      "ehub.apt3233.id.vn",
    ],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:7777",
        changeOrigin: true,
      },
      "/ehub/": minioProxy,
      "/ehubd/": minioProxy,
    },
  },
});
