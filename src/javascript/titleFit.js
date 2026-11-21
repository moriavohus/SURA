/**
 * titleFit — название кейса подгоняется под свою колонку.
 *
 * Колонка узкая по макету: у панели карточки это колонка сетки плюс
 * промежуток (около 200px на 1440 и 170px на 1280), у заголовка на странице
 * кейса — одна пятая ширины блока. Название приходит из админки и бывает
 * длинным: «Avito Tech Conference 2026». Одно слово в 50px шире колонки, и
 * браузер рвал его посреди или пускал поверх соседней колонки. Поэтому для
 * таких названий кегль уменьшается ровно настолько, чтобы самое длинное
 * слово встало целиком, — короткие («MONS») остаются макетного размера.
 *
 * Макетный кегль берётся не с самого заголовка, а с линейки: ей выдаются
 * те же классы, и typekit задаёт ей тот же размер и трекинг — включая
 * брейкпоинты. Читать кегль с заголовка нельзя: сразу после снятия нашей
 * подгонки getComputedStyle отдаёт ещё старое значение, подгонка решала,
 * что всё и так влезает, и название возвращалось к макетному кеглю.
 *
 * Ниже MIN_PX не опускаемся: такой кегль уже не читается, и там слово
 * переносится по слогам (hyphens в style.css).
 */

const MIN_PX = 20;

/** Невидимая линейка: меряет слово тем же шрифтом, что и заголовок. */
const ruler = document.createElement("span");
ruler.setAttribute("aria-hidden", "true");
ruler.style.cssText =
  "position:absolute;left:-9999px;top:0;white-space:nowrap;width:max-content;" +
  "pointer-events:none";

const titles = [
  ...document.querySelectorAll(".M_CasePanel-title, .T_CaseIntro-title"),
];

const fit = (title) => {
  const avail = title.clientWidth;
  if (!avail) return;

  /* Линейке выдаём классы заголовка — вместе с ними она получает макетный
     кегль и трекинг, в том числе для текущего брейкпоинта. */
  ruler.className = title.className;
  const base = parseFloat(getComputedStyle(ruler).fontSize);
  if (!base) return;

  let widest = 0;
  for (const word of title.textContent.trim().split(/\s+/)) {
    ruler.textContent = word;
    widest = Math.max(widest, ruler.getBoundingClientRect().width);
  }
  if (!widest) return;

  const size =
    widest <= avail
      ? base
      : Math.max(MIN_PX, Math.floor((base * avail) / widest));

  title.style.fontSize = size === base ? "" : `${size}px`;
};

const fitAll = () => titles.forEach(fit);

if (titles.length) {
  document.body.append(ruler);
  fitAll();

  /* Шрифт догружается после первой отрисовки — меряем ещё раз по готовности. */
  document.fonts?.ready.then(fitAll);

  /* Колонка живёт по сетке: следим за шириной панели, а не только за окном.
     Пересчёт откладываем на кадр — иначе ResizeObserver ругается на цикл. */
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fitAll);
  };
  const observer = new ResizeObserver(schedule);
  titles.forEach((title) => observer.observe(title.parentElement));

  /* Смена ширины окна — смена брейкпоинта: макетный кегль там другой. */
  window.addEventListener("resize", schedule);
}
