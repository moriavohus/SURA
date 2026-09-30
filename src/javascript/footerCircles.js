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
import { createCircle, popIn, SIZE } from "./circles.js";

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
  drag: 0.12,         // за сколько секунд боковой разгон гаснет вдвое
  wall: 0.4,          // доля скорости после удара о край футера
};

/**
 * Курсор чуть отодвигает круги, которых касается. Толчок деликатный: круг
 * отходит на несколько пикселей и тут же оседает обратно, горку не сдувает.
 */
export const PUSH = {
  radius: 50,         // px — на каком расстоянии круг чувствует курсор
  force: 30,          // px/с — толчок в упор, дальше слабее
  lift: 8,            // px/с — вверх, чтобы круг едва оторвался
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

  /* Боковой разгон бывает только от курсора и гаснет сам: круг не улетает,
     а отъезжает и продолжает оседать. */
  if (circle.vx) {
    circle.x += circle.vx * dt;
    circle.vx *= 0.5 ** (dt / FALL.drag);

    if (Math.abs(circle.vx) < 1) circle.vx = 0;

    /* края футера держат: за ними круга не видно, он подрезан слоем */
    if (circle.x < circle.r) {
      circle.x = circle.r;
      circle.vx = Math.abs(circle.vx) * FALL.wall;
    } else if (circle.x > area.w - circle.r) {
      circle.x = area.w - circle.r;
      circle.vx = -Math.abs(circle.vx) * FALL.wall;
    }
  }

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

/**
 * Толчок от курсора: круг отъезжает от точки тем сильнее, чем ближе к ней
 * был, и подскакивает. Возвращает true, если круг тронулся с места.
 */
export function push(circle, pointer) {
  const dx = circle.x - pointer.x;
  const dy = circle.y - pointer.y;
  const distance = Math.hypot(dx, dy);

  if (distance > PUSH.radius) return false;

  /* В упор толчок полный, на краю радиуса — нулевой. */
  const strength = 1 - distance / PUSH.radius;
  /* Круг ровно под курсором пихаем в случайную сторону: иначе делить на 0. */
  const dir = distance > 0.01 ? dx / distance : Math.random() < 0.5 ? -1 : 1;

  circle.vx = (circle.vx || 0) + dir * PUSH.force * strength;
  circle.v = Math.min(circle.v, -PUSH.lift * strength);

  return true;
}

const footer = document.querySelector(".O_Footer");
const layer = footer?.querySelector(".O_Footer-circles");

if (layer) {
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const radius = SIZE / 2;
    const hoverable = window.matchMedia("(hover: hover)").matches;

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
        /* плотность одна на любом экране: на 1440×818 выходит 40 кругов,
           на телефоне — дюжина */
        max: gsap.utils.clamp(12, 40, Math.round((box.width * box.height) / 24000)),
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
      const x = gsap.utils.random(radius, area.w - radius);
      const y = gsap.utils.random(radius, area.h * FALL.band);
      const el = createCircle(layer, { x, y });

      spawned += 1;

      /* Падать круг начинает, когда появился: иначе он поехал бы вниз
         прямо из-под собственного всплытия. */
      popIn(el).eventCallback("onComplete", () =>
        falling.push({
          el,
          r: radius,
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

    /* Круг, которого толкнули, уезжает из горки — и те, что на нём лежали,
       повисают в воздухе. Поэтому после толчка будим всех, под кем не стало
       опоры: они просто падают дальше и складываются заново. */
    const wake = () => {
      for (let i = settled.length - 1; i >= 0; i -= 1) {
        const rest = settled[i];
        const others = settled.filter((other) => other !== rest);

        if (rest.y >= support(rest, rest.x, area, others) - 0.5) continue;

        settled.splice(i, 1);
        falling.push({
          el: rest.el,
          r: rest.r,
          x: rest.x,
          y: rest.y,
          v: rest.v || 0,
          vx: rest.vx || 0,
          vMax: FALL.speed * gsap.utils.random(1 - FALL.spread, 1 + FALL.spread),
          sway: gsap.utils.random(...FALL.sway),
          rate: gsap.utils.random(...FALL.rate),
          phase: gsap.utils.random(0, Math.PI * 2),
        });
      }
    };

    /* Курсор над футером: расталкиваем то, до чего дотянулся. Слой кругов
       событий не ловит (pointer-events: none), поэтому слушаем сам футер. */
    const onPointer = (event) => {
      const box = layer.getBoundingClientRect();
      const pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
      let touched = false;

      for (let i = settled.length - 1; i >= 0; i -= 1) {
        const rest = settled[i];

        if (!push(rest, pointer)) continue;

        settled.splice(i, 1);
        falling.push({
          el: rest.el,
          r: rest.r,
          x: rest.x,
          y: rest.y,
          v: rest.v,
          vx: rest.vx,
          vMax: FALL.speed * gsap.utils.random(1 - FALL.spread, 1 + FALL.spread),
          sway: gsap.utils.random(...FALL.sway),
          rate: gsap.utils.random(...FALL.rate),
          phase: gsap.utils.random(0, Math.PI * 2),
        });
        touched = true;
      }

      /* и падающим тоже достаётся — мимо курсора они не проскакивают */
      falling.forEach((circle) => push(circle, pointer));

      if (touched) wake();
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
          /* элемент кладём вместе с координатами: круг ещё поднимут курсором */
          settled.push({ el: circle.el, x: circle.x, y: step.y, r: circle.r, v: 0, vx: 0 });
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

    /* Без курсора расталкивать нечем: на тач-устройствах круги просто
       оседают. */
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
