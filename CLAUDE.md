# CLAUDE.md

Guidance for working on **Santo Terço**, a website that recommends the rosary mystery of the day and guides the user prayer by prayer.

## Working agreement

- **Incremental phases.** Build one feature/page at a time, then stop so the user can test, review and approve. Do not start the next phase without the user's go-ahead.
- **Commits are manual.** Never commit, push or write commit messages on your own. When the user asks for a commit message, write it in **Portuguese (pt-BR)**.
- **Language.** Everything is in **English**: code, file names, URLs, CSS classes, custom properties, comments and documentation. The only Portuguese content is user-facing UI text (prayers, labels, messages) and commit messages written on request.

## Stack

- **Vite** (multi-page app), no framework.
- **HTML5** semantic markup that validates on the W3C Nu validator. `lang="pt-BR"`.
- **CSS3** with **BEM** naming (`.block__element--modifier`), custom properties for every design token.
- **Prettier** formats every file, HTML included (`.prettierrc.json`); **ESLint** (`eslint.config.js`) checks the JavaScript and forbids `console.*` outside `log.js`. Run `npm run format` before handing work back.
- **Vanilla JavaScript**, ES modules. Prefer native APIs and small hand-written code; add a runtime dependency only when it clearly beats a simple solution (size, accessibility, maintenance), and ask the user before adding it.

```bash
npm run dev       # dev server
npm run build     # production build to dist/
npm run preview   # serve the build at /santo-terco/
npm run validate  # html-validate on dist/*.html (also run by CI)
npm run lint      # ESLint + Prettier check (also run by CI)
npm run format    # format every file with Prettier and apply ESLint fixes
npm test          # Vitest: unit tests and /data checks (also run by CI)
npm run test:watch # Vitest in watch mode
npm run test:e2e  # Playwright + axe on the production build, Chrome and Safari (also run by CI)
```

## Architecture

```
*.html                 one HTML file per page (index, mysteries, prayers, pray, rosary-complete, history, about, symbols)
components.html        dev-only review page for components, icons and illustrations (not built)
partials/              shared HTML (head, header, tab bar, footer) included at build time (see vite.config.js)
data/                  JSON content, consumed from GitHub raw (see Data)
.github/workflows/     ci.yml (pull requests and develop: lint + test + build + validate, and the browser tests), deploy.yml (main: GitHub Pages)
public/                files served with a fixed name: favicon, app icons, manifest, og-image, robots.txt, icons.svg sprite
src/assets/fonts/      Playfair Display and Lato (Latin subset, woff2), served with the site
src/assets/brand/      emblem, full and horizontal logos (normal and light, for navy) and the Our Lady banner art (PNG)
src/assets/illustrations/  the 38 custom rosary illustrations (single-path SVG masks)
tests/unit/            Vitest tests for services and utils, plus data.test.js, which checks every /data file
tests/e2e/             Playwright tests on the build, in Chrome and Safari (desktop and phone): every page (axe, no sideways scroll), the terço flow, failures and offline
src/js/
  app.js               initApp(): shared behavior for every page
src/sw.js              service worker (offline); the build turns it into dist/sw.js with the file list (see Offline)
  config.js            constants (the data URL itself is set in vite.config.js)
  services/            data access and persistence (api, mysteries, prayers, rosary, storage, progress, history)
  utils/               small pure helpers (dom, date, text, url, log)
  components/          reusable UI behavior: initTabs, initAccordion, initBeadCounter, ...
  pages/               one entry module per page
src/styles/
  main.css             imports only: tokens → base → layout → utilities → motion → components → pages
  tokens.css           all design tokens
  components/          one BEM file per component
  pages/               page-specific styles only
```

### Links and base path

The build is published under `/santo-terco/` (GitHub Pages, from `SITE_URL` in `vite.config.js`); development runs at `/`.

- In HTML, write site links and assets from the root (`/mysteries.html`, `/icons.svg#play`, `/src/assets/...`): Vite adds the base to assets and the partials plugin adds it to `<a href>`.
- In JavaScript, build URLs with `appUrl('pray.html?…')` (`src/js/utils/url.js`), never a hard-coded `/`.

### Component pattern

- Static markup lives in the HTML; behavior is added with an `initX(root)` function.
- Data-driven lists render from `<template>` elements with `cloneTemplate()` and `textContent`. **Never** put external data into `innerHTML`.
- UI state that affects styling lives in ARIA attributes (`aria-pressed`, `aria-expanded`, `aria-current`, `aria-selected`) and CSS selects on them.
- Build for reuse: one component, one file, one responsibility. Prefer one markup with responsive CSS over separate desktop/mobile markup.
- Keep logic simple and readable; no abstractions until there is a second use.

## Data

- JSON files live in `/data` in this repository and are fetched from `https://raw.githubusercontent.com/gwdev-web/santo-terco/main/data/<file>.json`.
- Always load them through `fetchJson()` (`src/js/services/api.js`): timeout, `response.ok` check, per-URL cache. Don't add request headers: the request must match the `<link rel="preload">` that the build adds for each file listed in the page's `data` in `PAGES` (`vite.config.js`).
- In development (`npm run dev`) the local `/data` files are served instead, so data can be tested before it is pushed. The production build only reaches data after it is pushed to `main`.
- A push to `main` changes the live data at once, so data changes go through `develop` or a pull request, where CI runs `tests/unit/data.test.js`. When the data gets a new field or rule, add its check there.
- User progress and history are stored only in the browser with `localStorage`, through `services/storage.js` (keys prefixed `santo-terco:`). Nothing is sent to a server.
- Pages that load data show a skeleton while loading and a `.notice--error` with "Tentar de novo" on failure (`initDataLoader`, which also retries when the device comes back online).
- Pages that save or read progress have a `[data-storage-notice]`, shown when the browser doesn't keep the site's data (private window, blocked or full storage).

## Offline (PWA)

The site is installable (`public/site.webmanifest`) and works offline through a hand-written service worker, `src/sw.js`.

- The `serviceWorker()` plugin in `vite.config.js` builds `dist/sw.js` with a manifest: every page, JS, CSS, font and image of the build (`core`), the illustrations (`extra`), the data files of `PAGES` and a version hash. A deploy that changes any file is a new version; it takes over at once (`skipWaiting`) and deletes the old cache.
- Pages and assets come from the cache; data is served from the cache and refreshed in the background (stale-while-revalidate), so a data change reaches installed users on their second visit after it is pushed.
- Performance first: the worker is registered only in the production build, after `load`, when the browser is idle (`components/service-worker.js`). Hashed files already cached are copied, not downloaded again. Don't add files to the install that a page doesn't need offline, and keep the first visit free of extra requests.
- A new page or a new kind of file is picked up by the plugin automatically; a new file in `/public` that must work offline goes in `SW_PUBLIC_FILES`.
- The browser tests block the service worker (`serviceWorkers: 'block'`), except `tests/e2e/offline.spec.js`.

## Errors and the console

- The user always gets feedback in the page (error notice, storage notice, button label); the console is for developers.
- Log through `logError()` / `logWarning()` (`src/js/utils/log.js`), which add the `[Santo Terço]` prefix. Never call `console.*` directly.
- `logError` only for what the user sees fail (data that didn't load); `logWarning` for problems the app works around (storage, invalid data values, clipboard, unknown URL parameters). Lighthouse counts console errors against Best Practices, so a normal visit logs nothing.
- Error messages are in English and name what failed (the URL, the JSON file and field, the storage key).

## Style guide rules

The full visual and editorial rules are in [STYLE_GUIDE.md](STYLE_GUIDE.md). Key rules:

- Use tokens from `src/styles/tokens.css`; no hard-coded colors, spacing, radii or shadows.
- Fonts: Playfair Display (headings, prayer text, quotes) and Lato (UI).
- Gold (`--color-gold`) is decoration only, **never text**. Use `--color-gold-text` for small text and `--color-gold-heading` for 24px+ headings. Never put white text on gold.
- One primary (gold) button per screen.
- Color proportion: beige 60%, white 20%, navy 12%, gold 8%.
- Icons: Phosphor (Light weight, Regular at 14–18px, Fill only for "play") from the `public/icons.svg` sprite for menu, arrows and buttons; the 38 custom rosary illustrations (mystery sets, each mystery, prayers) are applied as CSS masks colored by `currentColor`. Never emoji.
- Logo: emblem of Our Lady in prayer inside a circle wrapped by the rosary, plus the "Santo ✦ Terço" small-caps wordmark. Favicon is a gold "M" on navy.
- Everything clickable looks clickable: filled or gold-bordered buttons, gold-underlined links, cards with border and arrow, the next step gently pulsing.
- Voice: close, simple, unhurried, never demanding. Address the user as "você". Marking prayers is always optional.
- Prayer texts are complete, in the traditional version used in Brazil. Ordinals use "º"/"ª". Bible references use the "Lc 22,39-46" format.

## Responsive design

Mobile-first, fluid sizes with `clamp()`, four ranges:

| Range   | Width       | Media query                     |
| ------- | ----------- | ------------------------------- |
| Mobile  | ≤ 640px     | base styles                     |
| Tablet  | 641–1024px  | `@media (min-width: 40.0625em)` |
| Desktop | 1025–1439px | `@media (min-width: 64.0625em)` |
| Large   | ≥ 1440px    | `@media (min-width: 90em)`      |

- Grids use `auto-fit` + `minmax()` instead of fixed columns. Media queries are only for structural changes.
- Reading text stays ≤ 720px wide; pages ≤ 1200px; side gutter ≥ 16px.
- Touch targets ≥ 44×44px; primary buttons on mobile are 52px tall.
- No horizontal scroll at any width. Check 360, 390, 768, 1024, 1280, 1440 and 1920px, plus phone landscape.

## Motion

- Use the motion tokens (`--duration-*`, `--ease-*`) and the shared patterns in `motion.css`: entrance fade-up with stagger, hover/press feedback, bead fill, next-step pulse, progress transitions, accordion via `grid-template-rows`, celebration, cross-document View Transitions.
- 150–450ms for interactions, 700ms for progress bars, curve `cubic-bezier(.3, .7, .4, 1)`.
- Motion is subtle and serene; nothing flashy.
- Everything is disabled under `prefers-reduced-motion: reduce`.

## Accessibility checklist

- Text contrast ≥ 4.5:1 (3:1 from 24px).
- Buttons are `<button>`, links are `<a>`; nothing clickable on a `<div>`.
- Icon-only buttons have `aria-label`; decorative icons have `aria-hidden="true"`.
- Prayer marking uses `aria-pressed`; the current step uses `aria-current="step"`.
- The Ave Maria counter is announced with `aria-live="polite"`.
- Visible `:focus-visible` on every interactive element; skip link on every page.
- Hidden labels use `.visually-hidden`.

## Before handing a phase back

1. `npm run lint`, `npm test`, `npm run build`, `npm run validate` and `npm run test:e2e` pass.
2. Check every responsive range, keyboard navigation and reduced motion.
3. Changed pages pass the W3C validator.
4. Summarize what changed, what to test, and any design deviation, then stop.
