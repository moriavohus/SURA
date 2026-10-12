/**
 * heroIntro — появление первого экрана.
 *
 * Анимация построена на gsap.from(): без JS страница остаётся полностью
 * видимой, ничего не прячем через CSS.
 */

import gsap from "gsap";

import { EASE, INTRO } from "./motion.js";

const hero = document.querySelector(".O_Hero");

if (hero) {
  const targets = {
    header: hero.querySelector(".O_Header"),
    menu: document.querySelector(".O_Menu"),   // меню лежит вне секции
  };

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const tl = gsap.timeline({
      defaults: { duration: INTRO.hero, ease: EASE },
    });

    // Шапке двигаем только прозрачность: transform создал бы контекст
    // наложения, и mix-blend-difference шапки перестал бы видеть кадр.
    if (targets.header) tl.from(targets.header, { autoAlpha: 0, duration: INTRO.heroHeader }, 0);
    if (targets.menu) tl.from(targets.menu, { autoAlpha: 0, y: 18 }, 0.35);

    return () => tl.kill();
  });
}
