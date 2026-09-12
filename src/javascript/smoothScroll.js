/**
 * smoothScroll — плавная прокрутка страницы (GSAP ScrollSmoother).
 *
 * Обёртка .ScrollWrap → содержимое .ScrollContent: плагин везёт содержимое
 * трансформом, догоняя позицию нативного скролла. Всё, что закреплено на
 * экране (шапка, счётчик кейсов, меню), лежит в разметке снаружи обёртки —
 * внутри трансформированного родителя position: fixed не работает.
 *
 * smoothTouch: false — на тач-устройствах остаётся нативная прокрутка: там
 * инерция своя, системная, и дублировать её значит ломать привычное
 * поведение и сажать батарею.
 *
 * Подключать первым из модулей страницы: ScrollSmoother сам является
 * скролл-триггером, и остальные должны считаться уже от него.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

if (document.querySelector(".ScrollWrap")) {
  /* При системной настройке «меньше движения» плагин не создаётся вовсе —
     страница листается нативно, без догоняющего содержимого. */
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const smoother = ScrollSmoother.create({
      wrapper: ".ScrollWrap",
      content: ".ScrollContent",
      /* секунды на догон: меньше — резче, больше — «мыльно» */
      smooth: 1,
      smoothTouch: false,
      /* data-speed / data-lag в разметке не используем */
      effects: false,
    });

    return () => smoother.kill();
  });
}
