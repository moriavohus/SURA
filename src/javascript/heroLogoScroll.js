/**
 * heroLogoScroll — знак süra сплющивается по высоте на первых пикселях скролла.
 *
 * Первый экран на это время закреплён (pin), поэтому прокрутка меняет только
 * высоту знака: страница стоит, ничего больше не едет. Длина закрепления —
 * токен --hero-pin.
 *
 * Ширина остаётся постоянной: вектор экспортирован с preserveAspectRatio="none"
 * и тянется по коробке, поэтому анимируем ровно одно свойство.
 *
 * Границы читаются функциями из токенов --hero-logo-h / --hero-logo-h-min:
 * они меняются по брейкпоинтам, и invalidateOnRefresh пересчитывает их при
 * ресайзе вместо того, чтобы запечь значения первого запуска.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const hero = document.querySelector(".O_Hero");
const logo = hero?.querySelector(".A_Wordmark img");

if (hero && logo) {
  const size = (name) =>
    parseFloat(getComputedStyle(hero).getPropertyValue(name)) || 0;

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const tween = gsap.fromTo(
      logo,
      { height: () => size("--hero-logo-h") },
      {
        height: () => size("--hero-logo-h-min"),
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: () => "+=" + size("--hero-pin"),
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          // закрепление сдвигает всё, что ниже, поэтому пересчитываем его
          // раньше остальных триггеров страницы
          refreshPriority: 1,
        },
      }
    );

    return () => tween.scrollTrigger?.kill();
  });
}
