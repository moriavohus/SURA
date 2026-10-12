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

import { EASE, REVEAL } from "./motion.js";

gsap.registerPlugin(ScrollTrigger);

/* Блок, на который ведёт якорь в адресе, не прячем: к нему сразу
   прокручивают, и появление сдвинуло бы его на свою высоту — страница
   вставала бы мимо, ровно на эти сорок восемь пикселей. */
const anchored =
  location.hash.length > 1
    ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
    : null;

const targets = gsap.utils
  .toArray("[data-scroll-reveal]")
  .filter((el) => el !== anchored);

if (targets.length) {
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const tweens = targets.map((el) =>
      gsap.from(el, {
        autoAlpha: 0,
        y: REVEAL.rise,
        duration: REVEAL.duration,
        ease: EASE,
        scrollTrigger: {
          trigger: el,
          start: REVEAL.start,
        },
      })
    );

    return () => tweens.forEach((tween) => tween.scrollTrigger?.kill());
  });
}
