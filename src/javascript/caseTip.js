/**
 * caseTip — реплика над кейсом: появляется на ховере и едет за курсором.
 *
 * Ключевой момент — в каких координатах считать. Курсор живёт в координатах
 * вьюпорта, а плашка лежит внутри карточки, которая уезжает при скролле.
 * Поэтому сглаженная точка хранится вьюпортной, а в координаты карточки
 * пересчитывается на каждом кадре: иначе при скролле с неподвижной мышью
 * события не приходят, плашка остаётся приклеенной к карточке и уползает от
 * курсора ровно на величину прокрутки.
 *
 * Кадры гоняем через gsap.ticker (rAF), а не через слушатель скролла.
 */

import gsap from "gsap";

const cards = gsap.utils.toArray(".T_CaseCard");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (cards.length && canHover) {
  const SMOOTH = noMotion ? 1 : 0.18;   // доля пути до курсора за кадр при 60fps
  const EDGE = 12;                      // отступ от краёв кадра

  cards.forEach((card) => {
    const tip = card.querySelector(".M_CaseTip");
    if (!tip) return;

    const cursor = { x: 0, y: 0 };      // курсор, координаты вьюпорта
    const eased = { x: 0, y: 0 };       // сглаженный след за ним, тоже вьюпортный

    /** Ставит левый верхний угол плашки так, чтобы хвостик попал в точку. */
    const place = () => {
      const area = card.getBoundingClientRect();
      const size = tip.getBoundingClientRect();

      gsap.set(tip, {
        x: gsap.utils.clamp(
          EDGE,
          Math.max(EDGE, area.width - size.width - EDGE),
          eased.x - area.left - size.width / 2
        ),
        y: gsap.utils.clamp(
          EDGE,
          Math.max(EDGE, area.height - size.height - EDGE),
          eased.y - area.top - size.height
        ),
      });
    };

    const tick = () => {
      // deltaRatio выравнивает шаг сглаживания на дисплеях быстрее 60 Гц
      const step = Math.min(1, SMOOTH * gsap.ticker.deltaRatio());
      eased.x += (cursor.x - eased.x) * step;
      eased.y += (cursor.y - eased.y) * step;
      place();
    };

    card.addEventListener("pointerenter", (event) => {
      cursor.x = eased.x = event.clientX;
      cursor.y = eased.y = event.clientY;
      place();
      gsap.to(tip, { autoAlpha: 1, duration: 0.25, ease: "power2.out" });
      gsap.ticker.add(tick);
    });

    card.addEventListener("pointermove", (event) => {
      cursor.x = event.clientX;
      cursor.y = event.clientY;
    });

    card.addEventListener("pointerleave", () => {
      gsap.ticker.remove(tick);
      gsap.to(tip, { autoAlpha: 0, duration: 0.25, ease: "power2.out" });
    });
  });
}
