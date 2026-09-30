/**
 * casesWidget — состояния виджета-счётчика кейсов.
 *
 * Виджет закреплён на экране, поэтому у него два независимых состояния:
 *
 *   is-Shaded  — за первым экраном подложка темнеет: дальше идут светлые
 *                секции, на которых белый текст по 20% чёрного пропадает.
 *   is-OnCases — пока блок кейсов в кадре, снизу раскрывается строка точек,
 *                и подсвечена та, чей кейс сейчас на экране.
 *
 * Точек ровно столько, сколько карточек в разметке, — они и разложены в
 * HTML, поэтому без JS виджет остаётся целым, просто без подсветки.
 *
 * На странице всех кейсов виджет показывает не точки, а перечень; подсветка
 * там идёт по тем же триггерам, только класс достаётся строке списка.
 *
 * Состояния считаются раздельно: подложка зависит только от первого экрана,
 * точки — только от блока кейсов. Страница услуги идёт с первым экраном, но
 * без кейсов, и общее условие оставило бы там светлый виджет на светлом фоне.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const widget = document.querySelector(".M_CasesWidget");
const hero = document.querySelector(".O_Hero");
/* Блок кейсов главной или страница всех кейсов — карточки в обоих одни. */
const cases =
  document.querySelector(".O_Cases") || document.querySelector(".O_Projects");

if (widget && hero) {
  ScrollTrigger.create({
    trigger: hero,
    start: "bottom 85%",
    onEnter: () => widget.classList.add("is-Shaded"),
    onLeaveBack: () => widget.classList.remove("is-Shaded"),
  });
}

/* Полоска прокрутки перечня: родную в вебките видно только во время
   движения, поэтому бегунок свой. Высота — доля видимой части от всего
   списка, положение — та же доля от прокрутки. */
const list = widget?.querySelector(".M_CasesWidget-list");
const thumb = widget?.querySelector(".M_CasesWidget-thumb");

if (list && thumb) {
  const draw = () => {
    const visible = list.clientHeight;
    const total = list.scrollHeight;

    if (total <= visible) {
      thumb.style.display = "none";
      return;
    }

    thumb.style.display = "";
    thumb.style.height = `${(visible / total) * visible}px`;
    thumb.style.transform = `translateY(${(list.scrollTop / total) * visible}px)`;
  };

  list.addEventListener("scroll", draw, { passive: true });
  window.addEventListener("resize", draw);
  draw();
}

if (widget && cases) {
  /* Точки и перечень лежат в разметке оба — виджет один на весь сайт, а
     показывается на странице только что-то одно. Поэтому отметку выбираем
     по странице, а не по наличию в DOM. */
  const onProjects = cases.classList.contains("O_Projects");
  const marks = gsap.utils.toArray(
    onProjects ? ".M_CasesWidget-item" : ".M_CasesWidget-dot"
  );
  const cards = gsap.utils.toArray(".T_CaseCard");

  ScrollTrigger.create({
    trigger: cases,
    start: "top 60%",
    end: "bottom 40%",
    onToggle: (self) => widget.classList.toggle("is-OnCases", self.isActive),
  });

  const setActive = (index) =>
    marks.forEach((mark, i) => mark.classList.toggle("is-Active", i === index));

  cards.forEach((card, index) => {
    if (!marks[index]) return;

    ScrollTrigger.create({
      trigger: card,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => {
        if (self.isActive) setActive(index);
      },
    });
  });
}
