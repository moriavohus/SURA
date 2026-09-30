/**
 * buttonCircles — цветные круги под курсором на кнопке.
 *
 * Круги и их появление берутся из circles.js — того же компонента, что
 * осыпается в футере. Здесь они всплывают в случайных точках внутри кнопки,
 * россыпью, и уходят тем же движением наоборот, когда курсор ушёл.
 *
 * Круги лежат под подписью и подрезаются коробкой кнопки, поэтому в соседние
 * блоки ничего не вылезает.
 *
 * Только там, где есть курсор: на тач-устройствах наведение оставляет
 * залипшее состояние, и круги повисли бы на кнопке до следующего тапа.
 */

import gsap from "gsap";
import { createCircle, popIn, popOut } from "./circles.js";

const buttons = gsap.utils.toArray(".A_Button");

if (buttons.length) {
  gsap.matchMedia().add(
    "(hover: hover) and (prefers-reduced-motion: no-preference)",
    () => {
      const COUNT = [4, 7];      // сколько кругов в россыпи
      const STEP = 0.05;         // с — задержка между соседними

      const fields = buttons.map((button) => {
        let circles = [];

        const scatter = () => {
          if (circles.length) return;

          const box = button.getBoundingClientRect();
          const count = Math.round(gsap.utils.random(...COUNT));

          circles = Array.from({ length: count }, (_, index) => {
            const circle = createCircle(button, {
              x: gsap.utils.random(0, box.width),
              y: gsap.utils.random(0, box.height),
            });

            popIn(circle, index * STEP);

            return circle;
          });
        };

        const clear = () => {
          circles.forEach((circle, index) => {
            gsap.killTweensOf(circle);
            popOut(circle, index * STEP * 0.5);
          });

          circles = [];
        };

        button.addEventListener("mouseenter", scatter);
        button.addEventListener("mouseleave", clear);
        button.addEventListener("focusin", scatter);
        button.addEventListener("focusout", clear);

        return () => {
          button.removeEventListener("mouseenter", scatter);
          button.removeEventListener("mouseleave", clear);
          button.removeEventListener("focusin", scatter);
          button.removeEventListener("focusout", clear);
          circles.forEach((circle) => circle.remove());
          circles = [];
        };
      });

      return () => fields.forEach((stop) => stop());
    }
  );
}
