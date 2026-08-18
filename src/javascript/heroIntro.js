/**
 * heroIntro — появление первого экрана.
 *
 * Анимация построена на gsap.from(): без JS страница остаётся полностью
 * видимой, ничего не прячем через CSS.
 */

import gsap from "gsap";

const hero = document.querySelector(".O_Hero");

if (hero) {
  const targets = {
    header: hero.querySelector(".O_Header"),
    wordmark: hero.querySelector(".A_Wordmark"),
    projects: hero.querySelector(".M_ProjectsLink"),
    menu: document.querySelector(".O_Menu"),   // меню лежит вне секции
  };

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const tl = gsap.timeline({
      defaults: { duration: 0.9, ease: "power3.out" },
    });

    // Шапке двигаем только прозрачность: transform создал бы контекст
    // наложения, и mix-blend-difference знака перестал бы видеть кадр.
    if (targets.header) tl.from(targets.header, { autoAlpha: 0, duration: 0.7 }, 0);
    if (targets.wordmark) tl.from(targets.wordmark, { autoAlpha: 0, y: 24 }, 0.15);
    if (targets.projects) tl.from(targets.projects, { autoAlpha: 0, y: 18 }, 0.35);
    if (targets.menu) tl.from(targets.menu, { autoAlpha: 0, y: 18 }, 0.5);

    return () => tl.kill();
  });
}
