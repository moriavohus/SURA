/**
 * caseReveal — появление кадров на страницах кейсов.
 *
 * Блок помечается атрибутом data-case-reveal, подпись внутри него —
 * data-case-caption. Кадр поднимается и проявляется, обложка внутри него
 * дораскрывается снизу вверх через clip-path, подпись приходит следом.
 *
 * clip-path выбран намеренно вместо масштаба: transform у обложки занят
 * наведением (см. .A_CaseFrame-image в style.css), и анимация по нему
 * смазывалась бы css-переходом ховера.
 *
 * Построено на gsap.from()/fromTo(): без JS страница видна целиком.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const blocks = gsap.utils.toArray("[data-case-reveal]");

if (blocks.length) {
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    /* Блоки, уже стоящие в кадре при загрузке, триггер показал бы разом —
       разводим их каскадом, чтобы первый экран собирался, а не вспыхивал. */
    const onScreen = blocks.filter(
      (block) => block.getBoundingClientRect().top < window.innerHeight
    );

    const timelines = blocks.map((block) => {
      const image = block.querySelector("img");
      const caption = block.querySelector("[data-case-caption]");
      const order = onScreen.indexOf(block);

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: order < 0 ? 0 : order * 0.09,
        scrollTrigger: {
          trigger: block,
          start: "top 88%",
        },
      });

      tl.from(block, { autoAlpha: 0, y: 40, duration: 0.9 }, 0);

      if (image) {
        tl.fromTo(
          image,
          { clipPath: "inset(0% 0% 22% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2 },
          0
        );
      }

      if (caption) {
        tl.from(caption, { autoAlpha: 0, y: 18, duration: 0.7 }, 0.18);
      }

      return tl;
    });

    return () => timelines.forEach((tl) => tl.scrollTrigger?.kill());
  });
}
