/**
 * heroIntro — появление первого экрана.
 *
 * Анимация построена на gsap.from(): без JS страница остаётся полностью
 * видимой, ничего не прячем через CSS.
 */

import gsap from "gsap";

import { EASE, INTRO } from "./motion.js";
import { glassSafe } from "./glass.js";

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
    /* Меню стеклянное: на время проявления размытие снимаем, иначе оно
       берёт фон из самого меню и оно превращается в глухую плашку. */
    if (targets.menu)
      tl.from(
        targets.menu,
        { autoAlpha: 0, y: 18, ...glassSafe(targets.menu) },
        0.35
      );

    return () => tl.kill();
  });
}
