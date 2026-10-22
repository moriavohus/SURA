/**
 * glass — стекло не переживает анимацию прозрачности.
 *
 * Пока у блока opacity меньше единицы, браузер рисует его отдельной группой,
 * и backdrop-filter внутри берёт фон не из страницы, а из этой группы. Меню и
 * виджет на время появления превращались в глухие серые плашки со швом
 * посередине, а панель кейса размывала собственный кадр и заливала карточку
 * цветным маревом. Это не баг конкретного браузера: так описан backdrop root
 * в спецификации, и Safari с Chrome ведут себя одинаково.
 *
 * Поэтому на время появления размытие снимаем — остаётся та же подложка, но
 * плоская, — и возвращаем, когда блок дошёл до полной непрозрачности.
 *
 * Стеклянные блоки ищем по вычисленному стилю, а не по списку классов: на
 * телефоне стекло получают другие элементы (пилюли нижнего бара, кнопка в
 * карточке), и список пришлось бы держать в двух местах. Снимаем размытие
 * тоже стилем на элементе, а не классом: правила стекла живут и в style.css,
 * и в медиазапросах, и классу пришлось бы перебивать их !important.
 */

/* Сколько анимаций сейчас держат размытие снятым с этого элемента: у реплики
   на карточке появление и уход сменяют друг друга, и уходящая анимация иначе
   вернула бы стекло прямо посреди приходящей. */
const holds = new Map();

const isGlass = (el) => {
  const style = getComputedStyle(el);
  return (style.backdropFilter || style.webkitBackdropFilter) !== "none";
};

const glassInside = (root) => {
  const found = isGlass(root) ? [root] : [];
  root.querySelectorAll("*").forEach((el) => {
    if (isGlass(el)) found.push(el);
  });
  return found;
};

/**
 * Обработчики для tween'а, который гасит прозрачность блока со стеклом.
 * Подмешиваются в его параметры: gsap.from(el, { autoAlpha: 0, ...glassSafe(el) }).
 */
export const glassSafe = (root) => {
  /* Список собираем на старте, а не при вызове: до появления блок может быть
     ещё не в своём брейкпоинте, а снятое размытие мы бы уже не узнали. */
  let muted = [];

  const mute = () => {
    restore();
    muted = glassInside(root);
    muted.forEach((el) => {
      holds.set(el, (holds.get(el) || 0) + 1);
      el.style.backdropFilter = "none";
      el.style.webkitBackdropFilter = "none";
    });
  };

  const restore = () => {
    muted.forEach((el) => {
      const left = (holds.get(el) || 1) - 1;
      if (left > 0) {
        holds.set(el, left);
        return;
      }
      holds.delete(el);
      el.style.removeProperty("backdrop-filter");
      el.style.removeProperty("-webkit-backdrop-filter");
    });
    muted = [];
  };

  return {
    onStart: mute,
    onComplete: restore,
    onReverseComplete: restore,
    onInterrupt: restore,
  };
};
