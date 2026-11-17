/**
 * heroVideo — ролик первого экрана.
 *
 * Роликов два: вертикальный для телефона и горизонтальный для всего
 * остального. Какой взять, браузер решает сам по media у <source>, но
 * только при загрузке страницы. Если ширина перешла границу уже после —
 * повернули телефон, потянули окно, — просим выбрать заново.
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
  const apply = () => {
    if (!still.matches) {
      video.play().catch(() => {});
      return;
    }

    video.pause();
    video.currentTime = 0;
  };

  apply();
  still.addEventListener("change", apply);

  narrow.addEventListener("change", () => {
    video.load();   // выбор источника проходит заново
    apply();
  });
}
