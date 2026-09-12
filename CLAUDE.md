# CLAUDE.md — SURA Website

Правила разработки нового сайта студии SURA (suradsgn.com).
Архитектура основана на референсном проекте yeta-new: Vite multipage + vanilla JS + GSAP, атомарный CSS с токенами.

## Стек

- **Сборка:** Vite, multipage — каждый HTML-файл регистрируется как отдельный entry в `vite.config.js` (`build.rollupOptions.input`). Новая страница = новый entry, не забывай добавлять.
- **Общая разметка:** шапка, футер и левая колонка (счётчик + меню) лежат в `src/partials/<язык>/` и подставляются на сборке плагином `htmlIncludes` из `vite.config.js` — строкой `<!-- include: src/partials/en/header.html -->`. Правится в одном месте, копий по страницам не держим.
- **JS:** vanilla ES-modules, без React/Vue. Один файл `src/javascript/<фича>.js` на одну фичу (smoothScroll.js, marquee.js, form.js). Никаких файлов-помоек «main.js на всё».
- **Анимации:** GSAP (ScrollTrigger, ScrollSmoother) — скролл-хореография; Lottie (renderer: canvas) — векторные анимации из After Effects, json-файлы в `public/`.
- **Деплой-цель:** статика на VPS (nginx, 1 ГБ RAM) — никакого SSR, никаких серверных зависимостей.

## Структура проекта

```
/
├── index.html              # английская версия — корень
├── projects.html
├── about.html
├── contacts.html
├── ru/                     # русская версия — зеркало корня, те же имена файлов
│   ├── index.html
│   └── ...
├── src/
│   ├── stylesheets/
│   │   ├── reset.css       # только reset, не трогать без причины
│   │   ├── vars.css        # ВСЕ токены: цвета, отступы, радиусы, тайминги
│   │   ├── fonts.css       # только @font-face
│   │   ├── typekit.css     # только типографические классы
│   │   └── responsive.css  # ВСЕ media queries, сгруппированы по брейкпоинтам
│   ├── style.css           # layout-стили компонентов (desktop-first)
│   ├── javascript/         # по файлу на фичу
│   ├── partials/           # общая разметка: en/ и ru/, по файлу на блок
│   └── images/             # svg/jpg, подпапки по секциям (cases/, logos/)
├── public/                 # lottie json, favicon — то, что не проходит через бандлер
└── vite.config.js
```

## Дизайн-токены (vars.css)

Единственный источник правды для цветов, отступов и таймингов. Захардкоженный hex/px-значение в style.css — ошибка.

Имена токенов — **семантические**, по роли, не по значению:

```css
:root {
  /* цвета */
  --color-bg: #fff;
  --color-bg-inverse: #0a0a0a;
  --color-text: #0a0a0a;
  --color-text-muted: rgba(10, 10, 10, 0.56);
  --color-accent: /* задать при утверждении дизайна */;

  /* отступы — шкала 4px */
  --space-xs: 8px;
  --space-s: 16px;
  --space-m: 32px;
  --space-l: 64px;
  --space-xl: 128px;

  /* прочее */
  --radius-s: 4px;
  --radius-m: 12px;
  --transition-fast: 0.15s ease;
  --transition-base: 0.3s ease;
  --container-max: 1440px;
  --container-pad: 64px;
}
```

Правило: новый цвет в макете → сначала токен в vars.css, потом использование.

## Типографика (typekit.css)

Вся типографика — именованные классы, по классу на стиль из макета. В style.css размеры шрифтов не задаются — только применяются классы из typekit.

Паттерн (значения заменить на утверждённые в Figma):

```css
h1.ExtraTitle { font-size: 128px; line-height: 110%; letter-spacing: -0.04em; font-weight: 100; }
h2.BigTitle   { font-size: 56px;  line-height: 110%; letter-spacing: -0.035em; font-weight: 100; }
h3.Title      { font-size: 40px;  line-height: 110%; letter-spacing: -0.05em; font-weight: 100; }
h4.Subtitle   { font-size: 28px;  line-height: 130%; letter-spacing: -0.035em; font-weight: 100; }
p             { font-size: 19px;  line-height: 140%; letter-spacing: -0.025em; font-weight: 300; }
p.small       { font-size: 14px;  line-height: 140%; letter-spacing: -0.035em; font-weight: 300; }
```

- letter-spacing в **em**, не в px (масштабируется вместе с clamp).
- Модификаторы жирности — классом (`.Bold`), не инлайн-стилем.
- font-family задаётся один раз на body, не в каждом классе.

## Нейминг классов — атомарные префиксы

Как в референсе, PascalCase с префиксом уровня:

| Префикс | Уровень | Примеры |
|---|---|---|
| `A_` | Атом: иконка, кнопка, лого, картинка | `A_Logo`, `A_ButtonPrimary`, `A_Arrow` |
| `M_` | Молекула: группа атомов | `M_NavLinks`, `M_ContactRow` |
| `O_` | Организм: секция страницы | `O_Header`, `O_Footer`, `O_Hero`, `O_ProjectsGrid` |
| `T_` | Крупный блок-шаблон внутри страницы | `T_CaseBlock`, `T_ManifestoSection` |
| `W_` | Обёртка/layout-контейнер | `W_Container`, `W_BoxLeft` |

- Вложенные стили писать через CSS nesting (как в референсе): селектор организма, внутри — его части.
- Один организм = один связный блок стилей в style.css, с комментарием-заголовком `/* ===== O_Hero ===== */`.

## Адаптив (responsive.css)

- Подход: **desktop-first**. Базовые стили в style.css под 1440+, все переопределения — только в responsive.css.
- Брейкпоинты, фиксированный набор:
  ```css
  @media (max-width: 1440px) { ... }  /* лэптоп */
  @media (max-width: 1024px) { ... }  /* планшет */
  @media (max-width: 768px)  { ... }  /* планшет вертикально / крупный мобильный */
  @media (max-width: 480px)  { ... }  /* мобильный */
  ```
  Использовать `max-width`, не `max-device-width` (устаревшее).
- Внутри брейкпоинта переопределения сгруппированы по секциям в том же порядке, что и style.css.
- Плавное масштабирование заголовков между брейкпоинтами — через `clamp(min, vw, max)`:
  `font-size: clamp(48px, 5.5vw, 56px);`
- Никаких горизонтальных скроллов: после каждой секции проверять на 375px ширины.

## Анимации

- Скролл-эффекты — только GSAP ScrollTrigger; никаких самописных scroll-listener'ов.
- ScrollSmoother: обёртка `.ScrollWrap` → контент `.ScrollContent`, `smoothTouch: false` (на тач-устройствах нативный скролл).
- Fixed/pin-элементы — через `ScrollTrigger.pin`, не `position: sticky` + JS.
- `prefers-reduced-motion: reduce` — уважать: тяжёлые анимации отключать.
- Lottie: renderer `canvas`, для Safari выставлять `will-change: transform, opacity`.
- Hover-переходы — через токены `--transition-*`.

## Мультиязычность (en/ru)

- Английская версия — корень `/`, русская — зеркало в `/ru/` с теми же именами файлов.
- Переключатель языка ведёт на ту же страницу другого языка: `/about.html` ↔ `/ru/about.html`.
- `<html lang="en">` / `<html lang="ru">` — обязательно; hreflang-теги в `<head>` каждой страницы.
- При изменении разметки страницы — синхронизировать обе версии в одном коммите.

## Качество и самопроверка

После каждого блока работы, до отчёта о готовности:

1. **Опечатки в CSS-свойствах.** Прогнать поиск по diff: несуществующие свойства (`padding-rigjt` и т.п.) браузер молча игнорирует. При наличии — `npx stylelint`.
2. **Токены.** `grep -n "#[0-9a-fA-F]\{3,6\}" src/style.css src/stylesheets/responsive.css` — hex вне vars.css быть не должно.
3. **Сборка.** `npm run build` проходит без ошибок; новые страницы добавлены в vite.config.js.
4. **Адаптив.** Проверить 1440 / 1024 / 768 / 375, нет горизонтального скролла.
5. **Картинки.** jpg ≤ 300KB (hero ≤ 600KB), для фото — `loading="lazy"` кроме первого экрана, обязателен `alt`.
6. **Консоль браузера** чистая: без 404 по ассетам и JS-ошибок.

## Команды

```bash
npm run dev       # vite dev server с HMR
npm run build     # прод-сборка в dist/
npm run preview   # локальный просмотр прод-сборки
```

## Чего НЕ делать

- Не добавлять фреймворки и тяжёлые зависимости без обсуждения (сайт — статика на слабом VPS).
- Не писать инлайн-стили в HTML.
- Не создавать новые css-файлы — всё в существующую структуру из пяти файлов + style.css.
- Не менять reset.css и fonts.css без явной задачи.
- Не коммитить `dist/` и `node_modules/` (см. .gitignore).
- Не использовать `!important` вне typekit-модификаторов.
