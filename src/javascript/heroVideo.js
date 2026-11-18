/**
 * heroVideo — ролик первого экрана.
 *
 * Роликов два: вертикальный для телефона и горизонтальный для всего
 * остального. Какой взять, браузер решает сам по media у <source>, но
 * только при загрузке страницы. Если ширина перешла границу уже после —
 * повернули телефон, потянули окно, — просим выбрать заново.
 *
 * Выбор браузера ещё и проверяется. Страница, поднятая из кэша «назад —
 * вперёд», приходит с уже выбранным источником: он мог быть выбран при
 * другой ширине или вовсе на прошлой версии страницы, и тогда на телефоне
 * играл горизонтальный ролик или прежний файл. Поэтому при восстановлении
 * страницы и при смене ширины сверяем, что играет именно то, что нужно
 * этой ширине, и при расхождении переключаем сами.
 *
 * Ролик зациклен и запускается сам, поэтому для тех, кто просил систему
 * убрать движение, его останавливаем: остаётся первый кадр, то есть ровно
 * то, что было на месте ролика картинкой.
 *
 * Браузер может и не уметь этот кодек — тогда сработает error, кадр покажет
 * постер (см. mediaReveal.js), и останавливать будет уже нечего.
 */

const video = document.querySelector("video.A_HeroImage");
const still = window.matchMedia("(prefers-reduced-motion: reduce)");
const narrow = window.matchMedia("(max-width: 768px)");

if (video) {
  const sources = [...video.querySelectorAll("source")];
  const mobile = sources.find((source) => source.media);
  const wide = sources.find((source) => !source.media);

  /** Адрес, который должен играть при текущей ширине. */
  const wanted = () => {
    const source = narrow.matches ? mobile ?? wide : wide ?? mobile;
    return source ? new URL(source.src, location.href).href : null;
  };

  const apply = () => {
    if (!still.matches) {
      video.play().catch(() => {});
      return;
    }

    video.pause();
    video.currentTime = 0;
  };

  /* Играет не тот файл — ставим нужный сами. Дальше источником управляет
     этот скрипт: у элемента появляется src, и <source> уже не при делах. */
  const ensureSource = () => {
    const want = wanted();

    if (!want || video.currentSrc === want) {
      return false;
    }

    video.src = want;
    video.load();

    return true;
  };

  apply();
  still.addEventListener("change", apply);

  narrow.addEventListener("change", () => {
    if (!ensureSource()) {
      video.load();   // выбор источника проходит заново
    }

    apply();
  });

  /* Возврат по «назад»: страница поднята из кэша целиком, вместе с тем
     источником, который был выбран в прошлый раз. */
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) {
      return;
    }

    ensureSource();
    apply();
  });
}
