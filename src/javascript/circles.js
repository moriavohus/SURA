/**
 * circles — цветной круг: один компонент на два места.
 *
 * Здесь только сам круг и его появление: всплытие из точки с небольшим
 * перелётом. Куда круги ставить и что с ними делать дальше — дело тех, кто
 * этим пользуется (buttonCircles.js, footerCircles.js). Поэтому появление в
 * футере ровно то же, что при наведении на кнопку: это одна и та же функция.
 *
 * Круги одного размера и одного цвета, и то и другое задано в vars.css —
 * элементу ничего не проставляется, он весь описан классом.
 */

import gsap from "gsap";

/** Размер круга из токена: по нему физика в футере считает радиус. */
export const SIZE =
  parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--circle-size")
  ) || 12;

/** Появление: круг вскакивает из точки, чуть переваливая за свой размер. */
export const POP = { duration: 0.42, ease: "back.out(2.2)" };

/**
 * Круг в заданной точке хозяина. Координата — центр: у элемента
 * отрицательные поля в половину размера (см. .A_Circle в style.css), поэтому
 * и физике, и раскладке можно думать центрами, а не углами.
 */
export function createCircle(host, { x, y } = {}) {
  const circle = document.createElement("span");

  circle.className = "A_Circle";
  host.appendChild(circle);
  gsap.set(circle, { x, y, scale: 0, autoAlpha: 0 });

  return circle;
}

/** Появление. Возвращает твин — по нему видно, когда круг «ожил». */
export function popIn(circle, delay = 0) {
  return gsap.to(circle, { scale: 1, autoAlpha: 1, delay, ...POP });
}

/** Исчезновение тем же движением наоборот; элемент убирается за собой. */
export function popOut(circle, delay = 0) {
  return gsap.to(circle, {
    scale: 0,
    autoAlpha: 0,
    delay,
    duration: POP.duration * 0.6,
    ease: "back.in(2)",
    onComplete: () => circle.remove(),
  });
}
