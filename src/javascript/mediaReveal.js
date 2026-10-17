/**
 * mediaReveal — проявление тяжёлого кадра после загрузки.
 *
 * Кадр помечается в разметке атрибутом data-media-reveal и до загрузки
 * держится прозрачным, чтобы не появляться кусками поверх фона-заглушки.
 *
 * Кадр бывает и картинкой, и видео — в галерее кейса их поровну. Готовность
 * они сообщают по-разному: картинка событием load, видео — loadeddata, то
 * есть когда появился первый кадр. Раньше модуль ждал только load, и видео
 * оставалось прозрачным навсегда: загружалось, но не проявлялось.
 */

const LOADED_CLASS = "is-Loaded";

/** Готов ли кадр прямо сейчас — он мог загрузиться до запуска скрипта. */
const ready = (media) =>
  media.tagName === "VIDEO"
    ? media.readyState >= 2 // HAVE_CURRENT_DATA: первый кадр уже есть
    : media.complete && media.naturalWidth > 0;

document.querySelectorAll("[data-media-reveal]").forEach((media) => {
  const reveal = () => media.classList.add(LOADED_CLASS);

  if (ready(media)) {
    reveal();
    return;
  }

  media.addEventListener(
    media.tagName === "VIDEO" ? "loadeddata" : "load",
    reveal,
    { once: true }
  );

  /* Не загрузилось — показываем как есть: пустая рамка на месте кадра
     выглядит хуже, чем сломанная картинка, которую видно. */
  media.addEventListener("error", reveal, { once: true });
});
