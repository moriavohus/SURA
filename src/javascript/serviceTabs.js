/**
 * serviceTabs — подразделы услуги как вкладки: строка слева меняет
 * заявление справа.
 *
 * Переключается тремя способами: прокруткой, кликом и стрелками с
 * клавиатуры. При прокрутке блок закрепляется на экране, и подразделы
 * сменяют друг друга по ходу движения — шаг задан токеном
 * --service-tab-scroll. Клик по строке прокручивает к её отрезку, иначе
 * следующий же кадр прокрутки вернул бы подраздел обратно.
 *
 * Разметка работает и без JS: заявления лежат в странице все, первое
 * показано, остальные вынуты из потока стилями (см. .M_ServiceStatement).
 *
 * Фокус по вкладкам ходит стрелками, а не Tab'ом: в списке восемь строк, и
 * прогонять через них всю страницу — ровно то, от чего паттерн вкладок
 * избавляет. Tab уводит сразу к содержимому.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const section = document.querySelector(".O_ServiceLead");
const list = section?.querySelector(".M_ServiceList");
const box = section?.querySelector(".M_ServiceStatement-panels");
const link = section?.querySelector(".A_LinkArrow");
const panels = Array.from(section?.querySelectorAll(".M_ServiceStatement-text") || []);

if (list && box && panels.length) {
  const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Высоту коробки с заявлениями намеренно не анимируем. Приходящий текст
     стоит в потоке сразу, и пока высота ехала бы к новой, более длинный
     текст вылезал бы за коробку и ложился на ссылку под ней. Теперь коробка
     всегда ровно по текущему тексту, а переезд ссылки прячет её собственное
     появление: она в этот момент прозрачна. */

  /** Закрепление секции: живёт только на широких экранах, см. matchMedia ниже. */
  let pin = null;
  let current = 0;
  /** Текущее появление ссылки: она одна на все подразделы, см. ниже. */
  let linkFade = null;

  const select = (index, focus) => {
    if (index !== current) {
      const leaving = panels[current];
      const coming = panels[index];

      tabs.forEach((tab, i) => {
        const on = i === index;

        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        tab.closest(".M_ServiceList-item").classList.toggle("is-Current", on);
        panels[i]?.classList.toggle("is-Current", on);
      });

      current = index;

      if (!still.matches) {
        gsap.killTweensOf([coming, leaving].filter(Boolean));

        /* Уходящее заявление догасает поверх приходящего: без этого старый
           текст пропадал в один кадр и смена читалась рывком. */
        if (leaving && leaving !== coming) {
          leaving.classList.add("is-Leaving");
          gsap.fromTo(
            leaving,
            { opacity: 1 },
            {
              opacity: 0,
              duration: 0.28,
              ease: "power1.out",
              onComplete: () => {
                leaving.classList.remove("is-Leaving");
                // к этому времени оно могло снова стать текущим
                if (!leaving.classList.contains("is-Current")) {
                  gsap.set(leaving, { clearProps: "opacity" });
                }
              },
            }
          );
        }

        /* Заявление приходит с задержкой, чтобы разойтись с уходящим
           текстом. Границы заданы обе: быстрым переключением твин можно
           убить на полпути, и from() принял бы недотянутое значение за
           конечное. */
        gsap.fromTo(
          coming,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, delay: 0.14, ease: "power2.out" }
        );

        /* Ссылка появляется вместе с текстом, но заявление на каждую смену
           своё, а она одна на все. Начинать её появление заново на каждой
           смене нельзя: при быстрой прокрутке смены идут чаще, чем длится
           задержка, и ссылка так и не доходила до конца — отсюда ощущение,
           что она не поспевает за текстом. Пока предыдущее появление не
           доиграно, новое не запускаем. */
        if (link && (!linkFade || linkFade.progress() === 1)) {
          linkFade = gsap.fromTo(
            link,
            { opacity: 0 },
            { opacity: 1, duration: 0.4, delay: 0.14, ease: "power2.out" }
          );
        }
      }
    }

    if (focus) tabs[index].focus();
  };

  /** Прокрутка к середине отрезка вкладки. false — секция не закреплена. */
  const scrollToTab = (index) => {
    if (!pin) return false;

    const y = pin.start + ((index + 0.5) / tabs.length) * (pin.end - pin.start);
    const smoother = ScrollSmoother.get();

    if (smoother) smoother.scrollTo(y, true);
    else window.scrollTo({ top: y, behavior: still.matches ? "auto" : "smooth" });

    return true;
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      if (!scrollToTab(index)) select(index);
    });

    tab.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      let next;

      if (step) next = (index + step + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;

      event.preventDefault();
      select(next, true);
      scrollToTab(next);
    });
  });

  /* Смена прокруткой. На узких экранах закрепления нет: блок там идёт в одну
     колонку и занимает почти весь экран, держать его ещё и восемь шагов
     прокрутки — значит запереть страницу. Остаются клик и клавиатура. */
  gsap.matchMedia().add(
    "(prefers-reduced-motion: no-preference) and (min-width: 1025px)",
    () => {
      const css = (name, fallback) =>
        parseFloat(getComputedStyle(section).getPropertyValue(name)) || fallback;

      const step = () => css("--service-tab-scroll", 320);
      /* запас над блоком: под шапкой он не должен оказаться впритык */
      const var_gap = () => css("--header-h", 91) + 20;

      pin = ScrollTrigger.create({
        trigger: section,
        /* Блок обычно ниже экрана — тогда закрепляем его по центру. Но на
           невысоком окне (ноутбук с открытой панелью, 1100×600) заявление в
           три колонки разрастается, и центрированный блок обрезало бы с
           обеих сторон. Там прижимаем его к верху: текст важнее низа.
           Функция пересчитывается на каждом refresh — см. invalidateOnRefresh. */
        start: () =>
          section.offsetHeight + var_gap() < window.innerHeight ? "center center" : "top top",
        end: () => "+=" + step() * tabs.length,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const index = Math.min(tabs.length - 1, Math.floor(self.progress * tabs.length));

          if (index !== current) select(index);
        },
      });

      return () => {
        pin.kill();
        pin = null;
      };
    }
  );
}
