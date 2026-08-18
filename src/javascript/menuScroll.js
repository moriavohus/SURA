/**
 * menuScroll — переключение меню между полным и компактным видом.
 *
 * Оба состояния описаны в CSS (.O_Menu и .O_Menu.is-Compact), поэтому размер
 * компактного вида не захардкожен и живёт по содержимому: JS замеряет боксы
 * до и после смены класса и проигрывает переход между ними (FLIP).
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const menu = document.querySelector(".O_Menu");
const hero = document.querySelector(".O_Hero");

if (menu && hero) {
  const COMPACT_CLASS = "is-Compact";
  const intro = menu.querySelector(".O_Menu-block--intro");

  /** Мгновенная смена состояния — для reduced motion и для первого кадра. */
  const setState = (compact) => menu.classList.toggle(COMPACT_CLASS, compact);

  /**
   * Гасим вступление быстрее, чем сжимается коробка, и возвращаем позже,
   * чем она разворачивается. Иначе текст успевает пожить в узкой панели,
   * подрезается по правому краю и выглядит прижатым к левому.
   */
  const fadeIntro = (compact) => {
    gsap.killTweensOf(intro);

    if (compact) {
      gsap.fromTo(
        intro,
        { autoAlpha: 1 },
        { autoAlpha: 0, duration: 0.18, ease: "power2.in" }
      );
    } else {
      gsap.fromTo(
        intro,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25, delay: 0.34, ease: "power2.out" }
      );
    }
  };

  /**
   * Смена состояния с плавным изменением размера.
   *
   * Позицию не трогаем: оба варианта привязаны по left + bottom, поэтому
   * коробка схлопывается к своему левому нижнему углу и никуда не едет.
   * Размер компактного вида задан содержимым (max-content), так что цель
   * тween'а замеряем после смены класса — предварительно сбросив инлайновые
   * значения от предыдущей анимации, иначе замер вернёт их же.
   */
  const morphTo = (compact) => {
    if (menu.classList.contains(COMPACT_CLASS) === compact) return;

    const from = { width: menu.offsetWidth, height: menu.offsetHeight };

    /* Гасим только предыдущий морфинг размера. Раньше здесь стоял
       killTweensOf(menu) без ограничения — он убивал и появление меню из
       heroIntro, которое стоит с задержкой. При перезагрузке страницы на
       прокрутке схлопывание срабатывало сразу, появление умирало не
       начавшись, и меню навсегда оставалось с opacity: 0. */
    gsap.killTweensOf(menu, "width,height");
    gsap.set(menu, { clearProps: "width,height" });
    if (intro) gsap.set(intro, { clearProps: "width" });

    // Ширину гаснущего вступления замеряем в развёрнутом состоянии и держим
    // её всю анимацию. Иначе текст тянется за сжимающейся коробкой,
    // переверстывается на ходу и заметно дёргается.
    const introWidth = intro && !compact ? 0 : intro?.offsetWidth;

    setState(compact);

    const to = { width: menu.offsetWidth, height: menu.offsetHeight };

    // при разворачивании вступление уже вернулось в поток — там его полная ширина
    if (intro) {
      gsap.set(intro, { width: compact ? introWidth : intro.offsetWidth });
      fadeIntro(compact);
    }

    gsap.fromTo(menu, from, {
      ...to,
      duration: 0.55,
      ease: "power3.inOut",
      clearProps: "width,height",
      onComplete: () => {
        if (intro) gsap.set(intro, { clearProps: "width" });
      },
    });
  };

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: "bottom 85%",
      onEnter: () => morphTo(true),
      onLeaveBack: () => morphTo(false),
    });

    return () => trigger.kill();
  });

  mm.add("(prefers-reduced-motion: reduce)", () => {
    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: "bottom 85%",
      onEnter: () => setState(true),
      onLeaveBack: () => setState(false),
    });

    return () => trigger.kill();
  });
}
