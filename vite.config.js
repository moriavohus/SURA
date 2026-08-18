import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

/**
 * Multipage: каждая страница — отдельный entry.
 * Новая страница = новая строка здесь, иначе она не попадёт в сборку.
 */
export default defineConfig({
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL("./index.html", import.meta.url)),
        ruIndex: fileURLToPath(new URL("./ru/index.html", import.meta.url)),
      },
    },
  },
});
