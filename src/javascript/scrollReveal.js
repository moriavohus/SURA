/**
 * scrollReveal — блоки проявляются по мере подхода к вьюпорту.
 *
 * Цели помечаются в разметке атрибутом data-scroll-reveal, поэтому один файл
 * обслуживает и кейсы, и карточки услуг, и всё, что появится дальше.
 *
 * Используется gsap.from(): без JS страница остаётся видимой целиком.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const targets = gsap.utils.toArray("[data-scroll-reveal]");

if (targets.length) {
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const tweens = targets.map((el) =>
      gsap.from(el, {
        autoAlpha: 0,
        y: 48,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
        },
      })
    );

    return () => tweens.forEach((tween) => tween.scrollTrigger?.kill());
  });
}
