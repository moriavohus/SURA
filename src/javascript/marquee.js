/**
 * marquee — бегущая строка.
 *
 * Строка помечается атрибутом data-marquee, скорость берётся из токена
 * --marquee-speed (пикселей в секунду). Содержимое дублируется, и дорожка
 * едет ровно на длину одного круга — на стыке копии совпадают, поэтому
 * движение читается непрерывным.
 *
 * Работает только на узком экране: в макете клиенты идут строкой лишь там,
 * на широком это столбец, которому бежать некуда. Копии помечены
 * aria-hidden — экранный диктор читает список один раз.
 */

import gsap from "gsap";

const tracks = gsap.utils.toArray("[data-marquee]");

if (tracks.length) {
  gsap.matchMedia().add(
    "(max-width: 480px) and (prefers-reduced-motion: no-preference)",
    () => {
      const loops = tracks.map((track) => {
        const items = Array.from(track.children);
        const copies = items.map((item) => {
          const copy = item.cloneNode(true);
          copy.setAttribute("aria-hidden", "true");
          track.appendChild(copy);
          return copy;
        });

        /* Длина круга — расстояние от начала оригинала до начала его копии:
           в неё входит и промежуток между ними, поэтому мерить ширину
           содержимого и делить пополам было бы неточно. */
        const step = () => copies[0].offsetLeft - items[0].offsetLeft;
        const speed =
          parseFloat(getComputedStyle(track).getPropertyValue("--marquee-speed")) || 40;

        const tween = gsap.to(track, {
          x: () => -step(),
          duration: () => step() / speed,
          ease: "none",
          repeat: -1,
        });

        return () => {
          tween.kill();
          gsap.set(track, { clearProps: "transform" });
          copies.forEach((copy) => copy.remove());
        };
      });

      return () => loops.forEach((stop) => stop());
    }
  );
}
