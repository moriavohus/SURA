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
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const widget = document.querySelector(".M_CasesWidget");
const hero = document.querySelector(".O_Hero");
const cases = document.querySelector(".O_Cases");

if (widget && hero && cases) {
  const dots = gsap.utils.toArray(".M_CasesWidget-dot");
  const cards = gsap.utils.toArray(".T_CaseCard");

  const triggers = [];

  triggers.push(
    ScrollTrigger.create({
      trigger: hero,
      start: "bottom 85%",
      onEnter: () => widget.classList.add("is-Shaded"),
      onLeaveBack: () => widget.classList.remove("is-Shaded"),
    })
  );

  triggers.push(
    ScrollTrigger.create({
      trigger: cases,
      start: "top 60%",
      end: "bottom 40%",
      onToggle: (self) => widget.classList.toggle("is-OnCases", self.isActive),
    })
  );

  const setActive = (index) =>
    dots.forEach((dot, i) => dot.classList.toggle("is-Active", i === index));

  cards.forEach((card, index) => {
    if (!dots[index]) return;

    triggers.push(
      ScrollTrigger.create({
        trigger: card,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (self.isActive) setActive(index);
        },
      })
    );
  });
}
