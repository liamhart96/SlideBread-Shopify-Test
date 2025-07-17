import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import shopify from "vite-plugin-shopify";

export default defineConfig({
  plugins: [shopify({ snippetFile: "vite.liquid", versionNumbers: true }), react(), tailwindcss()],
  server: {
    hmr: {
      protocol: "ws",
      host: "localhost",
    },
    cors: {
      origin: [
        /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/,
        "https://fonts.shopifycdn.com",
        "https://slicebread-l-hart.myshopify.com",
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].[hash].min.js",
        chunkFileNames: "[name].[hash].min.js",
        assetFileNames: "[name].[hash].min[extname]",
      },
    },
  },
});
