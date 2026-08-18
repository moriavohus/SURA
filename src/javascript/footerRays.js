/**
 * footerRays — круги-веера в футере медленно вращаются.
 *
 * Каждый круг крутится в свою сторону и со своим шагом, чтобы пересечения
 * всё время перестраивались и рисунок не выглядел одной жёсткой картинкой.
 *
 * Пока футер вне кадра, анимация стоит на паузе. При системной настройке
 * «уменьшить движение» круги остаются неподвижными.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const footer = document.querySelector(".O_Footer");
const circles = gsap.utils.toArray(".A_RayCircle");

if (footer && circles.length) {
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const base =
      parseFloat(getComputedStyle(footer).getPropertyValue("--footer-ray-spin")) || 70;

    const spins = circles.map((circle, i) =>
      gsap.to(circle, {
        rotation: i % 2 ? -360 : 360,
        // шаг по кругам, чтобы обороты не совпадали и узор не «замирал»;
        // по модулю — иначе на дюжине фигур последние крутились бы впятеро
        // медленнее первых
        duration: base + (i % 5) * 17,
        ease: "none",
        repeat: -1,
        paused: true,
      })
    );

    const trigger = ScrollTrigger.create({
      trigger: footer,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) =>
        spins.forEach((spin) => (self.isActive ? spin.play() : spin.pause())),
    });

    return () => {
      trigger.kill();
      spins.forEach((spin) => spin.kill());
    };
  });
}
