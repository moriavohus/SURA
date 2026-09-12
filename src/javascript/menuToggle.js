/**
 * menuToggle — раскрытие списка услуг там, где нет наведения.
 *
 * На тач-устройствах ховера не существует, поэтому шесть строк услуг были
 * недостижимы вовсе. Здесь тот же список открывается тапом по «услугам».
 *
 * На устройствах с курсором обработчик не вешается: там работает :hover, а
 * с клавиатуры — :focus-within, для которого триггер и сделан кнопкой.
 */

const menu = document.querySelector(".O_Menu");
const item = menu?.querySelector(".O_Menu-item");
const trigger = item?.querySelector(".O_Menu-trigger");

if (menu && item && trigger && !window.matchMedia("(hover: hover)").matches) {
  const setOpen = (open) => {
    item.classList.toggle("is-Open", open);
    trigger.setAttribute("aria-expanded", String(open));
  };

  trigger.addEventListener("click", () => {
    setOpen(!item.classList.contains("is-Open"));
  });

  // тап мимо меню закрывает список
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target)) setOpen(false);
  });
}
