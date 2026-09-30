import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));

/**
 * Строка вида `<!-- include: src/partials/en/header.html -->` — одна на строку.
 * После пути можно передать параметры: `... breadcrumbs.html current="all cases"`.
 */
const INCLUDE =
  /^([ \t]*)<!--\s*include:\s*([\w./-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->[ \t]*$/gm;

const PARAM = /([\w-]+)="([^"]*)"/g;

/** `{{#имя}} … {{/имя}}` — кусок остаётся только с непустым параметром. */
const BLOCK = /^[ \t]*\{\{#([\w-]+)\}\}[ \t]*\n([\s\S]*?)^[ \t]*\{\{\/\1\}\}[ \t]*\n/gm;

/** `{{имя}}` — подстановка значения. */
const SLOT = /\{\{([\w-]+)\}\}/g;

/**
 * Подстановка параметров в партиал.
 *
 * Незаполненный слот — ошибка сборки, а не пустое место в разметке: партиал
 * один на все страницы, и молча пропущенный параметр заметить в вёрстке
 * нечем.
 */
function fill(part, params, file) {
  return part
    .replace(BLOCK, (_, name, body) => (params[name] ? body : ""))
    .replace(SLOT, (_, name) => {
      if (!params[name]) {
        throw new Error(
          `htmlIncludes: ${file} ждёт параметр "${name}", а он не передан`
        );
      }

      return params[name];
    });
}

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
 *
 * Партиал может быть с параметрами — так собраны хлебные крошки: разметка
 * навигации живёт в одном файле, а страница передаёт ей только свои названия
 * и ссылки.
 */
function htmlIncludes() {
  return {
    name: "html-includes",

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(INCLUDE, (_, indent, file, attrs) => {
          const params = Object.fromEntries(
            [...(attrs || "").matchAll(PARAM)].map(([, key, value]) => [key, value])
          );

          const source = readFileSync(resolve(root, file), "utf8").replace(/\s+$/, "");
          const part = fill(source, params, file);
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
