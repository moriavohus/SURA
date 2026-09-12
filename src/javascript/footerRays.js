/**
 * footerRays — генеративный веер в футере.
 *
 * Рисунок не лежит файлом, а считается каждый кадр. Поле собрано из
 * нескольких вееров: у каждого свой центр, число лучей, радиус и фаза.
 * Центры медленно ходят по своим восьмёркам, фазы разъезжаются с разной
 * скоростью — сочетание никогда не повторяется.
 *
 * Главное здесь — режим наложения xor: там, где два веера накрывают друг
 * друга, заливка взаимно гасится и проступает коллаж под ней. Именно из
 * этого рождаются формы, которых нет ни в одном веере по отдельности —
 * шахматные зоны, дуги, розетки. Они и меняются, пока центры расходятся.
 *
 * Прокрутка добавляет второй слой движения: пока футер идёт через экран,
 * лучи раскрываются — веера растут от половины радиуса к полному.
 *
 * Дешевле, чем кажется: девять вееров по три десятка клиньев — это пара
 * сотен путей на кадр, и рисуется всё только пока футер в кадре.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const footer = document.querySelector(".O_Footer");
const canvas = footer?.querySelector(".A_FooterRays");

if (footer && canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  const css = (name, fallback) =>
    parseFloat(getComputedStyle(footer).getPropertyValue(name)) || fallback;

  /** Свой генератор: одно зерно — одна и та же раскладка вееров при перезагрузке. */
  const random = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const build = (count) => {
    const rnd = random(20250912);
    const min = css("--footer-rays-min", 24);
    const max = css("--footer-rays-max", 102);

    return Array.from({ length: count }, () => {
      const radius = 0.35 + rnd() * 0.65;

      return {
      /* доли коробки, а не пиксели: раскладка переживает ресайз */
      x: rnd(),
      y: rnd(),
      radius,
      /* Лучей ровно пропорционально радиусу: длина дуги на ободе у всех
         вееров тогда одна, и мелкие круги не выглядят исчерченными тоньше
         крупных. Нижняя граница — чтобы у самых мелких рисунок не огрубел. */
      rays: Math.max(min, Math.round(max * radius)),
      phase: rnd() * Math.PI * 2,
      /* знак разный, поэтому соседние веера расходятся, а не едут вместе */
      spin: (rnd() - 0.5) * 0.06,
      swayX: 0.04 + rnd() * 0.09,
      swayY: 0.04 + rnd() * 0.09,
      swayRate: 0.05 + rnd() * 0.12,
      swayPhase: rnd() * Math.PI * 2,
      };
    });
  };

  let fans = [];
  let box = { w: 0, h: 0 };
  let progress = 0;

  const resize = () => {
    const rect = footer.getBoundingClientRect();
    /* плотность выше двух не даёт разницы на глаз, но втрое дороже */
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    box = { w: rect.width, h: rect.height };
    canvas.width = Math.round(box.w * dpr);
    canvas.height = Math.round(box.h * dpr);
    canvas.style.width = box.w + "px";
    canvas.style.height = box.h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (time) => {
    const { w, h } = box;
    if (!w || !h) return;

    const reach = Math.hypot(w, h);
    /* пока футер входит в кадр, веера раскрываются от половины к полному */
    const open = 0.5 + progress * 0.5;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = getComputedStyle(footer).getPropertyValue("--color-white").trim() || "#f6f6f6";
    ctx.globalCompositeOperation = "source-over";

    fans.forEach((fan, index) => {
      const t = time * fan.swayRate + fan.swayPhase;
      const cx = (fan.x + Math.sin(t) * fan.swayX) * w;
      const cy = (fan.y + Math.cos(t * 0.8) * fan.swayY) * h;
      const r = fan.radius * reach * 0.5 * open;
      const step = (Math.PI * 2) / fan.rays;
      const phase = fan.phase + time * fan.spin;

      ctx.beginPath();

      for (let i = 0; i < fan.rays; i += 1) {
        const start = phase + i * step;

        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, start + step / 2);
        ctx.closePath();
      }

      /* Первый веер ложится обычной заливкой, дальше — взаимное гашение:
         пересечения выпадают, и на их месте рождается новый рисунок. */
      ctx.globalCompositeOperation = index === 0 ? "source-over" : "xor";
      ctx.fill();
    });
  };

  resize();

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    fans = build(Math.round(css("--footer-rays-count", 9)));

    const speed = css("--footer-rays-speed", 1);
    const tick = (time) => draw(time * speed);

    /* Считаем только пока футер на экране: внизу страницы он висит долго,
       и гонять рисовку по всей прокрутке незачем. */
    const visible = ScrollTrigger.create({
      trigger: footer,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        if (self.isActive) gsap.ticker.add(tick);
        else gsap.ticker.remove(tick);
      },
      onUpdate: (self) => {
        progress = Math.min(1, self.progress * 2);
      },
    });

    const onResize = () => {
      resize();
      draw(gsap.ticker.time * speed);
    };

    window.addEventListener("resize", onResize);

    return () => {
      gsap.ticker.remove(tick);
      visible.kill();
      window.removeEventListener("resize", onResize);
    };
  });

  gsap.matchMedia().add("(prefers-reduced-motion: reduce)", () => {
    fans = build(Math.round(css("--footer-rays-count", 9)));
    progress = 1;
    draw(0);

    const onResize = () => {
      resize();
      draw(0);
    };

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  });
}
