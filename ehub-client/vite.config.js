import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

/**
 * FE local (localhost:5173) + BE remote:
 *   VITE_API_PROXY_TARGET=https://ehub.apt3233.id.vn npm run dev
 * FE local + BE local:
 *   VITE_API_PROXY_TARGET=http://127.0.0.1:7777 npm run dev
 *
 * Browser gọi /api/v1 → Vite proxy → target. Cookie Domain/Secure từ remote
 * được rewrite để browser lưu trên localhost.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET || "https://ehub.apt3233.id.vn";
  const isRemoteApi = /^https?:\/\//i.test(apiTarget) && !/127\.0\.0\.1|localhost/i.test(apiTarget);

  const rewriteLocalCookies = (proxy) => {
    proxy.on("proxyRes", (proxyRes) => {
      const raw = proxyRes.headers["set-cookie"];
      if (!raw) return;
      const list = Array.isArray(raw) ? raw : [raw];
      proxyRes.headers["set-cookie"] = list.map((cookie) =>
        cookie
          .replace(/;\s*Domain=[^;]*/gi, "")
          .replace(/;\s*Secure/gi, "")
          .replace(/;\s*SameSite=[^;]*/gi, "; SameSite=Lax"),
      );
    });
  };

  const apiProxy = {
    target: apiTarget,
    changeOrigin: true,
    secure: apiTarget.startsWith("https"),
    configure: isRemoteApi ? rewriteLocalCookies : undefined,
  };

  const assetProxy = {
    target: apiTarget,
    changeOrigin: true,
    secure: apiTarget.startsWith("https"),
  };

  return {
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
      warmup: {
        clientFiles: [
          "./src/main.jsx",
          "./src/App.jsx",
          "./src/routes/router.jsx",
          "./src/routes/adminRoute.jsx",
          "./src/routes/lectureRoute.jsx",
          "./src/layouts/admin/index.jsx",
        ],
      },
      proxy: {
        "/api": apiProxy,
        "/ehub/": assetProxy,
        "/ehubd/": assetProxy,
      },
    },
  };
});
