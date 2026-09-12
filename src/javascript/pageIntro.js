/**
 * pageIntro — появление служебного слоя на внутренних страницах.
 *
 * За первый экран главной отвечает heroIntro; на страницах кейсов его нет,
 * поэтому шапку, счётчик и меню проявляем здесь. Работает только там, где
 * секции .O_Hero в разметке не оказалось.
 *
 * Шапке двигаем одну прозрачность: transform создал бы контекст наложения,
 * и mix-blend-difference знака перестал бы видеть страницу под собой. Слою
 * с аватаром — тоже только прозрачность: autoAlpha выставила бы ему
 * visibility, и скрытые части слоя (знак, подпись) проступили бы вместе с
 * аватаром.
 */

import gsap from "gsap";

const hero = document.querySelector(".O_Hero");

if (!hero) {
  const header = document.querySelector(".O_Header");
  const plain = document.querySelector(".O_HeaderPlain");
  const widget = document.querySelector(".M_CasesWidget");
  const menu = document.querySelector(".O_Menu");

  const bars = [header, plain].filter(Boolean);

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const tl = gsap.timeline({
      defaults: { duration: 0.8, ease: "power3.out" },
    });

    if (bars.length) tl.from(bars, { opacity: 0, duration: 0.6 }, 0);
    if (widget) tl.from(widget, { autoAlpha: 0, y: -12 }, 0.12);
    if (menu) tl.from(menu, { autoAlpha: 0, y: 12 }, 0.22);

    return () => tl.kill();
  });
}
