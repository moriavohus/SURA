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
 *
 * Переходы по якорю берёт на себя плагин. Родной прыжок браузера меняет
 * нативную прокрутку, но не сдвиг содержимого, которым правит плагин: на
 * экране страница уже на месте, а попадание мыши считается по-старому — по
 * всей странице ничего не отзывается на курсор, пока её не прокрутят рукой.
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

    /* Якорь в адресе: браузер уже прыгнул сам, поэтому доводим страницу
       тем же плагином — он выставит и прокрутку, и сдвиг разом. */
    /* Ищем по id, а не селектором: якорь вида #3d — невалидный селектор, и
       querySelector на нём бросает исключение. */
    const byHash = (hash) =>
      hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;

    const jumpToHash = () => {
      const target = byHash(location.hash);

      if (target) smoother.scrollTo(target, false);
    };

    /* Ссылка на якорь этой же страницы: ведём её плавно, тем же плагином. */
    const onClick = (event) => {
      const link = event.target.closest?.('a[href*="#"]');

      if (!link || link.target === "_blank") return;

      const url = new URL(link.href, location.href);

      if (url.pathname !== location.pathname || !url.hash) return;

      const target = byHash(url.hash);

      if (!target) return;

      event.preventDefault();
      smoother.scrollTo(target, true);
      history.pushState(null, "", url.hash);
    };

    requestAnimationFrame(jumpToHash);
    window.addEventListener("hashchange", jumpToHash);
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("hashchange", jumpToHash);
      document.removeEventListener("click", onClick);
      smoother.kill();
    };
  });
}
