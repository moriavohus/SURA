/**
 * mediaReveal — проявление тяжёлых картинок после загрузки.
 *
 * Картинка помечается в разметке атрибутом data-media-reveal и до загрузки
 * держится прозрачной, чтобы кадр не появлялся кусками поверх фона-заглушки.
 */

const LOADED_CLASS = "is-Loaded";

document.querySelectorAll("[data-media-reveal]").forEach((image) => {
  const reveal = () => image.classList.add(LOADED_CLASS);

  if (image.complete && image.naturalWidth) {
    reveal();
    return;
  }

  image.addEventListener("load", reveal, { once: true });
  image.addEventListener("error", reveal, { once: true });
});
