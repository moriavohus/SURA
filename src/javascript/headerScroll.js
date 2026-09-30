/**
 * headerScroll — шапка прячется по направлению прокрутки.
 *
 * Вниз — уезжает за верхний край, вверх — возвращается. У самого верха
 * страницы она видна всегда, иначе на коротких рывках мелькала бы.
 *
 * Счётчик кейсов за ней не ходит. Раньше он подтягивался к верхнему полю,
 * когда шапка пряталась, и возвращался обратно, когда та приходила: пилюля
 * прыгала на 79 пикселей при каждой смене направления, и читалось это как
 * сбой, а не как связь. Шапка едет трансформом, счётчик ехал по top — с
 * размытием под ним это ещё и разная плавность у двух движений рядом.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const header = document.querySelector(".O_Header");
const plain = document.querySelector(".O_HeaderPlain");

if (header) {
  /** До этой отметки шапка не прячется. */
  const KEEP_VISIBLE = 120;

  const setHidden = (hidden) => {
    header.classList.toggle("is-Hidden", hidden);
    if (plain) plain.classList.toggle("is-Hidden", hidden);
  };

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      setHidden(self.scroll() > KEEP_VISIBLE && self.direction === 1);
    },
  });
}
