/**
 * caseReveal — появление кадров на страницах кейсов.
 *
 * Блок помечается атрибутом data-case-reveal, подпись внутри него —
 * data-case-caption. Кадр проявляется с коротким подъёмом, подпись приходит
 * следом.
 *
 * Раскрытия обложки внутри рамки здесь намеренно нет. Раньше кадр
 * дораскрывался снизу вверх через clip-path, и вместе с подъёмом плитки это
 * читалось так, будто картинка сползает и доливается в свою рамку, — на
 * широких кадрах особенно.
 *
 * Размах по ширине экрана разный: на узком кадры идут во всю ширину, и тот
 * же подъём там втрое заметнее, поэтому он короче и быстрее.
 *
 * Построено на gsap.from(): без JS страница видна целиком.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const blocks = gsap.utils.toArray("[data-case-reveal]");

if (blocks.length) {
  gsap.matchMedia().add(
    {
      wide: "(prefers-reduced-motion: no-preference) and (min-width: 769px)",
      narrow: "(prefers-reduced-motion: no-preference) and (max-width: 768px)",
    },
    (context) => {
      const { wide } = context.conditions;

      const rise = wide ? 28 : 12;
      const duration = wide ? 0.8 : 0.6;
      const cascade = wide ? 0.09 : 0.06;

      /* Блоки, уже стоящие в кадре при загрузке, триггер показал бы разом —
         разводим их каскадом, чтобы первый экран собирался, а не вспыхивал. */
      const onScreen = blocks.filter(
        (block) => block.getBoundingClientRect().top < window.innerHeight
      );

      const timelines = blocks.map((block) => {
        const caption = block.querySelector("[data-case-caption]");
        const order = onScreen.indexOf(block);

        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          delay: order < 0 ? 0 : order * cascade,
          scrollTrigger: {
            trigger: block,
            start: "top 88%",
          },
        });

        tl.from(block, { autoAlpha: 0, y: rise, duration }, 0);

        if (caption) {
          tl.from(
            caption,
            { autoAlpha: 0, y: rise * 0.45, duration: duration * 0.78 },
            duration * 0.2
          );
        }

        return tl;
      });

      return () => timelines.forEach((tl) => tl.scrollTrigger?.kill());
    }
  );
}
