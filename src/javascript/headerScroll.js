/**
 * headerScroll — шапка прячется по направлению прокрутки.
 *
 * Вниз — уезжает за верхний край, вверх — возвращается. У самого верха
 * страницы она видна всегда, иначе на коротких рывках мелькала бы.
 *
 * Счётчик кейсов стоит под шапкой, поэтому вместе с ней подтягивается к
 * верхнему полю. Хлебные крошки уходят и приходят вместе с ней же. Классы
 * вешаем здесь, а не по своим модулям, чтобы у всех трёх состояний был один
 * источник правды — направление скролла.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const header = document.querySelector(".O_Header");
const hero = document.querySelector(".O_Hero");
const plain = document.querySelector(".O_HeaderPlain");
const widget = document.querySelector(".M_CasesWidget");
const crumbs = document.querySelector(".M_Breadcrumbs");

if (header) {
  /** До этой отметки шапка не прячется. */
  const KEEP_VISIBLE = 120;

  const setHidden = (hidden) => {
    header.classList.toggle("is-Hidden", hidden);
    if (plain) plain.classList.toggle("is-Hidden", hidden);
    if (widget) widget.classList.toggle("is-Raised", hidden);
    if (crumbs) crumbs.classList.toggle("is-Hidden", hidden);
  };

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      setHidden(self.scroll() > KEEP_VISIBLE && self.direction === 1);
    },
  });
}

/* Знак слева меняется на стрелку вверх, как только уходит первый экран, —
   по той же отметке, по которой сворачивается меню и темнеет счётчик.
   Страницы без первого экрана показывают стрелку сразу, это решает CSS. */
if (header && hero) {
  ScrollTrigger.create({
    trigger: hero,
    start: "bottom 85%",
    onEnter: () => header.classList.add("is-Past"),
    onLeaveBack: () => header.classList.remove("is-Past"),
  });
}
