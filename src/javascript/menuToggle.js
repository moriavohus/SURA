/**
 * menuToggle — раскрытие списка услуг там, где нет наведения.
 *
 * На тач-устройствах ховера не существует, поэтому шесть строк услуг были
 * недостижимы вовсе. Здесь тот же список открывается тапом по «услугам».
 *
 * Клик нужен не только там, где нет курсора. В мобильной раскладке
 * раскрытие по ховеру выключено нарочно (responsive.css: залипший после
 * тапа ховер не давал закрыть список), поэтому с мышью в узком окне
 * браузера список не открывался вовсе — ни ховером, ни кликом. Условие
 * поэтому про раскладку, а не про устройство: нет ховера или узкий экран.
 *
 * На широком экране с курсором работает :hover, а с клавиатуры —
 * :focus-visible, для которого триггер и сделан кнопкой.
 */

const menu = document.querySelector(".O_Menu");
const item = menu?.querySelector(".O_Menu-item");
const trigger = item?.querySelector(".O_Menu-trigger");

/** Раскладки, где список открывается нажатием, а не наведением. */
const byTap = window.matchMedia("(hover: none), (max-width: 768px)");

if (menu && item && trigger) {
  const setOpen = (open) => {
    item.classList.toggle("is-Open", open);
    trigger.setAttribute("aria-expanded", String(open));
  };

  trigger.addEventListener("click", () => {
    if (!byTap.matches) return;
    setOpen(!item.classList.contains("is-Open"));
  });

  // тап мимо меню закрывает список
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target)) setOpen(false);
  });

  /* Окно растянули до широкой раскладки — дальше за список отвечает ховер,
     и оставленный класс держал бы его раскрытым навсегда. */
  byTap.addEventListener("change", () => {
    if (!byTap.matches) setOpen(false);
  });
}
