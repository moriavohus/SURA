import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));

/** Строка вида `<!-- include: src/partials/en/header.html -->` — одна на строку. */
const INCLUDE = /^([ \t]*)<!--\s*include:\s*([\w./-]+)\s*-->[ \t]*$/gm;

/**
 * htmlIncludes — общие куски разметки одним файлом.
 *
 * Шапка, футер и левая колонка (счётчик + меню) одинаковы на всех страницах,
 * поэтому лежат в src/partials/<язык>/ и подставляются на сборке. Без плагина
 * пришлось бы держать шесть копий и синхронизировать их руками.
 *
 * Подстановка идёт до остальных преобразований (order: "pre"), чтобы пути к
 * картинкам внутри партиала обрабатывались Vite как обычная разметка страницы.
 *
 * Отступ строки с директивой переносится на весь вставленный кусок: партиалы
 * написаны с базовым отступом в два пробела, а подключаются с разной глубины.
 */
function htmlIncludes() {
  return {
    name: "html-includes",

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(INCLUDE, (_, indent, file) => {
          const part = readFileSync(resolve(root, file), "utf8").replace(/\s+$/, "");
          const shift = indent.replace(/^ {2}/, "");

          return shift
            ? part.replace(/^(?=.)/gm, shift)
            : part;
        });
      },
    },

    /* правка партиала не проходит по графу модулей — перезагружаем страницу */
    handleHotUpdate({ file, server }) {
      if (file.startsWith(resolve(root, "src/partials"))) {
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },
  };
}

/**
 * Multipage: каждая страница — отдельный entry.
 * Новая страница = новая строка здесь, иначе она не попадёт в сборку.
 */
export default defineConfig({
  plugins: [htmlIncludes()],
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL("./index.html", import.meta.url)),
        projects: fileURLToPath(new URL("./projects.html", import.meta.url)),
        case: fileURLToPath(new URL("./case.html", import.meta.url)),
        service: fileURLToPath(new URL("./service.html", import.meta.url)),
        ruIndex: fileURLToPath(new URL("./ru/index.html", import.meta.url)),
        ruProjects: fileURLToPath(new URL("./ru/projects.html", import.meta.url)),
        ruCase: fileURLToPath(new URL("./ru/case.html", import.meta.url)),
        ruService: fileURLToPath(new URL("./ru/service.html", import.meta.url)),
      },
    },
  },
});
