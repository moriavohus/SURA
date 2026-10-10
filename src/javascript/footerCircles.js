/**
 * footerCircles — круги летают в футере.
 *
 * Круги те же, что в остальных местах (circles.js), и появляются той же
 * анимацией — по одному, в случайных точках футера. Дальше каждый медленно
 * плывёт по своей траектории: у него своя скорость (18 px/с ±30%, чтобы не
 * шли строем) и своё направление, которое само по себе плавно уводит в
 * сторону — поэтому летят они по дугам, а не по прямым.
 *
 * Гравитации нет: круги не падают и не складываются внизу. От краёв футера
 * они отражаются, сохраняя скорость, и остаются в кадре.
 *
 * Курсор подталкивает те, до которых дотянулся: толчок добавляется к
 * скорости, а она сама возвращается к своей крейсерской — круг отходит и
 * снова плывёт как плыл.
 *
 * Расчёт вынесен в чистые функции (advance, push) и ничего не знает ни про
 * DOM, ни про GSAP: в браузере движение на глаз не измеришь, а так его можно
 * прогнать симуляцией и проверить скорости, повороты и отражения.
 *
 * Поле живёт, только пока футер в кадре: за его пределами и таймер, и цикл
 * стоят. Страница статическая и едет на слабом VPS — фоновая анимация,
 * которую никто не видит, тут лишняя.
 */

import gsap from "gsap";
import { createCircle, popIn, SIZE } from "./circles.js";

/** Полёт, а не падение. Секунды, пиксели, радианы. */
export const DRIFT = {
  speed: 18,          // px/с — крейсерская скорость
  spread: 0.3,        // ±30% у каждого круга, чтобы не шли строем
  turn: [0.15, 0.5],  // рад/с — насколько круто уводит направление
  rate: [0.1, 0.35],  // Гц — как быстро меняется сам увод
  ease: 0.6,          // с — за столько скорость наполовину возвращается к своей
  spawn: [0.15, 0.4], // с — пауза между появлениями
};

/** Курсор чуть отодвигает круги, которых касается. */
export const PUSH = {
  radius: 50,         // px — на каком расстоянии круг чувствует курсор
  force: 30,          // px/с — толчок в упор, дальше слабее
};

/**
 * Шаг полёта: сначала направление уводит в сторону, потом скорость
 * подтягивается к своей крейсерской, потом круг переносится и, если дошёл до
 * края, отражается. Меняет круг на месте и возвращает точку, где его рисовать.
 */
export function advance(circle, dt, area) {
  /* Увод направления — синусом: он меняет знак сам, и траектория выходит
     волнистой, без накопления поворота в одну сторону. */
  circle.phase += circle.rate * dt;

  const turn = Math.sin(circle.phase * Math.PI * 2) * circle.turn * dt;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const vx = circle.vx * cos - circle.vy * sin;
  const vy = circle.vx * sin + circle.vy * cos;

  circle.vx = vx;
  circle.vy = vy;

  /* Скорость возвращается к крейсерской: так толчок курсора затухает сам,
     а круг не разгоняется и не останавливается насовсем. */
  const speed = Math.hypot(circle.vx, circle.vy);

  if (speed > 0) {
    const k = 0.5 ** (dt / DRIFT.ease);
    const want = circle.cruise + (speed - circle.cruise) * k;

    circle.vx = (circle.vx / speed) * want;
    circle.vy = (circle.vy / speed) * want;
  }

  circle.x += circle.vx * dt;
  circle.y += circle.vy * dt;

  /* Края футера отражают, скорость при этом сохраняется. */
  if (circle.x < circle.r) {
    circle.x = circle.r;
    circle.vx = Math.abs(circle.vx);
  } else if (circle.x > area.w - circle.r) {
    circle.x = area.w - circle.r;
    circle.vx = -Math.abs(circle.vx);
  }

  if (circle.y < circle.r) {
    circle.y = circle.r;
    circle.vy = Math.abs(circle.vy);
  } else if (circle.y > area.h - circle.r) {
    circle.y = area.h - circle.r;
    circle.vy = -Math.abs(circle.vy);
  }

  return { x: circle.x, y: circle.y };
}

/**
 * Толчок от курсора: круг отходит от точки тем сильнее, чем ближе к ней был.
 * Возвращает true, если круг тронуло.
 */
export function push(circle, pointer) {
  const dx = circle.x - pointer.x;
  const dy = circle.y - pointer.y;
  const distance = Math.hypot(dx, dy);

  if (distance > PUSH.radius) return false;

  /* В упор толчок полный, на краю радиуса — нулевой. */
  const strength = 1 - distance / PUSH.radius;
  /* Круг ровно под курсором пихаем в случайную сторону: иначе делить на 0. */
  const angle = distance > 0.01 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;

  circle.vx += Math.cos(angle) * PUSH.force * strength;
  circle.vy += Math.sin(angle) * PUSH.force * strength;

  return true;
}

const footer = document.querySelector(".O_Footer");
const layer = footer?.querySelector(".O_Footer-circles");

if (layer) {
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const radius = SIZE / 2;
    const hoverable = window.matchMedia("(hover: hover)").matches;

    let area = { w: 0, h: 0, max: 0 };
    let circles = [];
    let nextSpawn = 0;
    let running = false;

    const measure = () => {
      const box = layer.getBoundingClientRect();

      area = {
        w: box.width,
        h: box.height,
        /* плотность одна на любом экране: на 1440×818 выходит 40 кругов,
           на телефоне — дюжина */
        max: gsap.utils.clamp(12, 40, Math.round((box.width * box.height) / 24000)),
      };
    };

    const reset = () => {
      layer.replaceChildren();
      circles = [];
      nextSpawn = 0;
    };

    const spawn = () => {
      const x = gsap.utils.random(radius, area.w - radius);
      const y = gsap.utils.random(radius, area.h - radius);
      const el = createCircle(layer, { x, y });
      const cruise = DRIFT.speed * gsap.utils.random(1 - DRIFT.spread, 1 + DRIFT.spread);
      const heading = gsap.utils.random(0, Math.PI * 2);

      /* Лететь круг начинает, когда появился: иначе он поехал бы прямо
         из-под собственного всплытия. */
      popIn(el).eventCallback("onComplete", () =>
        circles.push({
          el,
          r: radius,
          x,
          y,
          vx: Math.cos(heading) * cruise,
          vy: Math.sin(heading) * cruise,
          cruise,
          turn: gsap.utils.random(...DRIFT.turn),
          rate: gsap.utils.random(...DRIFT.rate),
          phase: gsap.utils.random(0, 1),
        })
      );
    };

    /* Курсор над футером: расталкиваем то, до чего дотянулся. Слой кругов
       событий не ловит (pointer-events: none), поэтому слушаем сам футер. */
    const onPointer = (event) => {
      const box = layer.getBoundingClientRect();
      const pointer = { x: event.clientX - box.left, y: event.clientY - box.top };

      circles.forEach((circle) => push(circle, pointer));
    };

    const update = () => {
      const dt = Math.min(gsap.ticker.deltaRatio() / 60, 0.05);

      if (layer.childElementCount < area.max) {
        nextSpawn -= dt;

        if (nextSpawn <= 0) {
          spawn();
          nextSpawn = gsap.utils.random(...DRIFT.spawn);
        }
      }

      circles.forEach((circle) => {
        const step = advance(circle, dt, area);

        gsap.set(circle.el, { x: step.x, y: step.y });
      });
    };

    const start = () => {
      if (running) return;

      running = true;
      gsap.ticker.add(update);
    };

    const stop = () => {
      if (!running) return;

      running = false;
      gsap.ticker.remove(update);
    };

    /* Пересборка по ресайзу: координаты кругов в пикселях слоя, и при другой
       ширине они оказались бы за кадром. */
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        measure();
        reset();
      }, 200);
    };

    const watcher = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "100px" }
    );

    measure();
    watcher.observe(footer);
    window.addEventListener("resize", onResize);

    /* Без курсора расталкивать нечем: на тач-устройствах круги просто
       летают. */
    if (hoverable) footer.addEventListener("pointermove", onPointer);

    return () => {
      stop();
      watcher.disconnect();
      window.removeEventListener("resize", onResize);
      footer.removeEventListener("pointermove", onPointer);
      clearTimeout(resizeTimer);
      reset();
    };
  });
}
