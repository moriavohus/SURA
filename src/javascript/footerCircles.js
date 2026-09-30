/**
 * footerCircles — круги оседают в футере.
 *
 * Круги те же, что при наведении на кнопку (circles.js), и появляются той же
 * анимацией — по одному, в случайных точках верхней части футера. Дальше
 * каждый очень медленно падает: со скоростью 0, с плавным разгоном до своего
 * предела (30 px/с ±30%, чтобы не падали строем) и с лёгким покачиванием по
 * горизонтали — как оседающая в воздухе пыль.
 *
 * Внизу круг ложится на пол футера или на уже лежащие круги: опора ищется по
 * тем, с кем он пересекается по горизонтали, и берётся самая высокая. При
 * касании скорость не обнуляется, а переворачивается с потерей — выходит
 * мягкий отскок на пару пикселей вместо резкого стопа.
 *
 * Расчёт вынесен в чистые функции (support, advance) и ничего не знает ни про
 * DOM, ни про GSAP: в браузере анимацию на глаз не измеришь, а так её можно
 * прогнать симуляцией и проверить скорости, размах качания и высоту отскока.
 *
 * Поле живёт, только пока футер в кадре: за его пределами и таймер, и цикл
 * стоят. Страница статическая и едет на слабом VPS — фоновая анимация,
 * которую никто не видит, тут лишняя.
 */

import gsap from "gsap";
import { createCircle, popIn } from "./circles.js";

/** Оседание, а не бросок. Секунды, пиксели, радианы. */
export const FALL = {
  gravity: 20,        // px/с² — разгон до предела примерно за полторы секунды
  speed: 30,          // px/с — предельная скорость
  spread: 0.3,        // ±30% у каждого круга, чтобы не падали строем
  sway: [2, 4],       // px — амплитуда покачивания
  rate: [0.8, 1.6],   // рад/с — его частота
  spawn: [0.15, 0.4], // с — пауза между появлениями
  bounce: 0.25,       // доля скорости, остающаяся после касания
  rest: 3,            // px/с — ниже этого круг ложится
  band: 0.25,         // верхняя четверть футера — откуда круги приходят
};

/**
 * Высота опоры под кругом: пол футера или верх того, на что он сел.
 *
 * Круг на круге лежит не по вертикали: чем дальше центры по горизонтали, тем
 * ниже он садится, — отсюда теорема Пифагора, а не просто «минус радиус».
 */
export function support(circle, x, area, settled) {
  let top = area.h - circle.r;

  for (const rest of settled) {
    const dx = x - rest.x;
    const reach = circle.r + rest.r;

    if (Math.abs(dx) >= reach) continue;

    const perch = rest.y - Math.sqrt(reach * reach - dx * dx);

    if (perch < top) top = perch;
  }

  return top;
}

/**
 * Шаг падения. Меняет круг на месте и возвращает точку, где его рисовать, и
 * признак того, что он улёгся.
 */
export function advance(circle, dt, area, settled) {
  circle.v = Math.min(circle.vMax, circle.v + FALL.gravity * dt);
  circle.y += circle.v * dt;
  circle.phase += circle.rate * dt;

  const x = circle.x + Math.sin(circle.phase) * circle.sway;
  const floor = support(circle, x, area, settled);

  if (circle.y < floor) return { x, y: circle.y, done: false };

  circle.y = floor;

  /* Касание не гасит движение разом: скорость переворачивается с потерей,
     и круг подпрыгивает на пару пикселей. Ниже порога — ложится. */
  if (circle.v > FALL.rest) {
    circle.v = -circle.v * FALL.bounce;

    return { x, y: circle.y, done: false };
  }

  return { x, y: circle.y, done: true };
}

const footer = document.querySelector(".O_Footer");
const layer = footer?.querySelector(".O_Footer-circles");

if (layer) {
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const sizeMax = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--circle-size-max")
    ) || 18;

    let area = { w: 0, h: 0, max: 0 };
    let falling = [];
    let settled = [];
    let nextSpawn = 0;
    let spawned = 0;
    let running = false;

    const measure = () => {
      const box = layer.getBoundingClientRect();

      area = {
        w: box.width,
        h: box.height,
        /* плотность одна на любом экране: на 1440×818 выходит 80 кругов,
           на телефоне — два десятка */
        max: gsap.utils.clamp(24, 80, Math.round((box.width * box.height) / 12000)),
      };
    };

    const reset = () => {
      layer.replaceChildren();
      falling = [];
      settled = [];
      spawned = 0;
      nextSpawn = 0;
    };

    const spawn = () => {
      const r = gsap.utils.random(4, sizeMax / 2);
      const x = gsap.utils.random(r, area.w - r);
      const y = gsap.utils.random(r, area.h * FALL.band);
      const el = createCircle(layer, { x, y, size: r * 2 });

      spawned += 1;

      /* Падать круг начинает, когда появился: иначе он поехал бы вниз
         прямо из-под собственного всплытия. */
      popIn(el).eventCallback("onComplete", () =>
        falling.push({
          el,
          r,
          x,
          y,
          v: 0,
          vMax: FALL.speed * gsap.utils.random(1 - FALL.spread, 1 + FALL.spread),
          sway: gsap.utils.random(...FALL.sway),
          rate: gsap.utils.random(...FALL.rate),
          phase: gsap.utils.random(0, Math.PI * 2),
        })
      );
    };

    const update = () => {
      const dt = Math.min(gsap.ticker.deltaRatio() / 60, 0.05);

      if (spawned < area.max) {
        nextSpawn -= dt;

        if (nextSpawn <= 0) {
          spawn();
          nextSpawn = gsap.utils.random(...FALL.spawn);
        }
      }

      for (let i = falling.length - 1; i >= 0; i -= 1) {
        const circle = falling[i];
        const step = advance(circle, dt, area, settled);

        gsap.set(circle.el, { x: step.x, y: step.y });

        if (step.done) {
          settled.push({ x: step.x, y: step.y, r: circle.r });
          falling.splice(i, 1);
        }
      }
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
       ширине лежащая горка оказалась бы не на своём месте. */
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

    return () => {
      stop();
      watcher.disconnect();
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      reset();
    };
  });
}
