/**
 * heroVideo — ролик первого экрана.
 *
 * Роликов два: вертикальный для телефона и горизонтальный для всего
 * остального. По разметке выбор делает браузер — media у <source>, — но
 * доверять этому выбору нельзя. Он делается один раз, при загрузке, и
 * по-разному переживает возврат «назад», восстановление вкладки и
 * сорванную закачку: в этих случаях на телефоне оказывался горизонтальный
 * ролик, то есть просто другое видео.
 *
 * Поэтому выбор проверяется и, если он не тот, источник ставится руками —
 * при старте, при смене ширины и при восстановлении страницы.
 *
 * Ролик зациклен и запускается сам, поэтому для тех, кто просил систему
 * убрать движение, его останавливаем: остаётся первый кадр, то есть ровно
 * то, что было на месте ролика картинкой.
 *
 * Браузер может и не уметь кодек — тогда сработает error, кадр покажет
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
    return source ? new URL(source.getAttribute("src"), location.href).href : null;
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

  /* Пока файл не начал грузиться, currentSrc пуст и сверять нечего:
     ждём первых данных — или просто истечения срока, если их не будет. */
  const check = () => {
    ensureSource();
    apply();
  };

  if (video.readyState > 0) {
    check();
  } else {
    video.addEventListener("loadedmetadata", check, { once: true });
    setTimeout(check, 2000);
  }

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
    if (event.persisted) {
      check();
    }
  });
}
