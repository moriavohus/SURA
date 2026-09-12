/**
 * headerScroll — шапка прячется по направлению прокрутки.
 *
 * Вниз — уезжает за верхний край, вверх — возвращается. У самого верха
 * страницы она видна всегда, иначе на коротких рывках мелькала бы.
 *
 * Счётчик кейсов стоит под шапкой, поэтому вместе с ней подтягивается к
 * верхнему полю: класс вешаем здесь, а не в casesWidget.js, чтобы у обоих
 * состояний был один источник правды — направление скролла.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const header = document.querySelector(".O_Header");
const plain = document.querySelector(".O_HeaderPlain");
const widget = document.querySelector(".M_CasesWidget");

if (header) {
  /** До этой отметки шапка не прячется. */
  const KEEP_VISIBLE = 120;

  const setHidden = (hidden) => {
    header.classList.toggle("is-Hidden", hidden);
    if (plain) plain.classList.toggle("is-Hidden", hidden);
    if (widget) widget.classList.toggle("is-Raised", hidden);
  };

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      setHidden(self.scroll() > KEEP_VISIBLE && self.direction === 1);
    },
  });
}
