/**
 * langSwitch — переключатель ведёт на ту же страницу другого языка.
 *
 * Английская версия лежит в корне, русская — её зеркало в /ru с теми же
 * именами файлов. Разметка у меню одна на все страницы, поэтому адрес в
 * ней стоит общий — на главную другого языка, — а точный путь модуль
 * подставляет уже на месте.
 *
 * Якорь сохраняется: со страницы всех кейсов, прокрученной к конкретному
 * кейсу, переключение приводит к нему же.
 *
 * Без JS ссылка остаётся рабочей, просто уводит на главную.
 */

const link = document.querySelector("[data-lang-switch]");

if (link) {
  const path = window.location.pathname;
  const onRu = path === "/ru" || path.startsWith("/ru/");

  const mirror = onRu ? path.replace(/^\/ru/, "") || "/" : `/ru${path}`;

  link.href = mirror + window.location.search + window.location.hash;
}
