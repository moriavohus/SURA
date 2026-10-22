/**
 * titleFit — название кейса подгоняется под колонку панели.
 *
 * Панель кейса узкая по макету (колонка сетки плюс промежуток — около 200px
 * на 1440 и 170px на 1280), а название приходит из админки и бывает длинным:
 * «Конференция AvitoTech 2026». Одно слово в 54px шире колонки, и браузер
 * рвал его посреди: «Конфер / енция». Поэтому для таких названий кегль
 * уменьшается ровно настолько, чтобы самое длинное слово встало целиком —
 * короткие названия («MONS») остаются макетного размера.
 *
 * Ниже MIN_PX не опускаемся: такой кегль уже не читается, и там слово
 * переносится по слогам (hyphens в style.css).
 */

const MIN_PX = 20;

/** Невидимая линейка: меряет слово тем же шрифтом, что и заголовок. */
const ruler = document.createElement("span");
ruler.setAttribute("aria-hidden", "true");
ruler.style.cssText =
  "position:absolute;left:-9999px;top:0;white-space:nowrap;pointer-events:none";

const titles = [...document.querySelectorAll(".M_CasePanel-title")];

const fit = (title) => {
  /* Сначала снимаем прошлую подгонку: базовый кегль задаёт typekit и он
     меняется по брейкпоинтам, читать его надо без наших правок. */
  title.style.fontSize = "";

  const style = getComputedStyle(title);
  const base = parseFloat(style.fontSize);
  const avail = title.clientWidth;
  if (!base || !avail) return;

  ruler.style.font = style.font;
  ruler.style.fontSize = `${base}px`;
  ruler.style.letterSpacing = style.letterSpacing;

  let widest = 0;
  for (const word of title.textContent.trim().split(/\s+/)) {
    ruler.textContent = word;
    widest = Math.max(widest, ruler.getBoundingClientRect().width);
  }
  if (!widest || widest <= avail) return;

  const size = Math.max(MIN_PX, Math.floor((base * avail) / widest));
  if (size < base) title.style.fontSize = `${size}px`;
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
}
