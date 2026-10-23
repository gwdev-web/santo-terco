# Santo Terço

A simple website to pray the rosary every day. It recommends the mystery of the day and guides you prayer by prayer, from the Sign of the Cross to the Hail Holy Queen.

> The interface is in Brazilian Portuguese.

## Features

- **Mystery of the day**: suggested from the day of the week (Joyful, Sorrowful, Glorious, Luminous), with the option to choose any other.
- **Guided rosary**: opening prayers, the five mysteries (Bible reference, quote, reflections, fruit) with an Our Father, a 10 Hail Mary counter and the Glory Be, then the closing prayers.
- **Optional marking**: mark each prayer as you go; progress is saved so you can continue where you stopped.
- **Celebrations**: finishing a terço shows a calm celebration and today's Rosary; the fourth set of the day opens the full Rosary page.
- **Full Rosary**: pray the four sets of mysteries on the same day to complete a Rosary.
- **Prayers**: the rosary prayers in the order they are prayed, complementary prayers and three litanies, with an adjustable text size and a copy button.
- **History**: this week, days in a row, a 12-week heatmap, totals per mystery, recent days and medals, with an option to clear everything.
- **Privacy**: no sign-up, no ads. Data stays in your browser and can be cleared at any time.

## Tech stack

- [Vite](https://vite.dev/) (multi-page app)
- Semantic HTML5 (W3C valid)
- CSS3 with BEM and design tokens (custom properties)
- Vanilla JavaScript (ES modules), no runtime dependencies
- [sharp](https://sharp.pixelplumbing.com/) (dev only) to generate icons

## Pages

| Page | File |
|---|---|
| Home: today's terço, the week and today's Rosary | `index.html` |
| Mysteries: the four sets and their twenty mysteries | `mysteries.html` |
| Prayers: rosary and complementary prayers, litanies | `prayers.html` |
| Guided terço, one stage per URL | `pray.html?mystery=<set>&step=<opening \| 1–5 \| closing>` |
| Full Rosary celebration | `rosary-complete.html` |
| History | `history.html` |
| About and Symbols and design | `about.html`, `symbols.html` |
| Not found | `404.html` |

## Accessibility

- Semantic HTML, a skip link on every page and a visible focus ring (light gold on navy).
- Prayer marks use `aria-pressed`, the current step `aria-current="step"`, and counters and celebrations are announced to screen readers.
- Touch targets of at least 44px (52px for main buttons on mobile) and text contrast of at least 4.5:1.
- Every animation is turned off with `prefers-reduced-motion`.
- Checked with the W3C validator rules (html-validate), axe-core and Lighthouse.

## Getting started

Requirements: Node.js 20+.

```bash
npm install
npm run dev       # start the dev server
npm run build     # build to dist/
npm run preview   # preview the build
npm run icons     # regenerate favicon, app icons and og-image from the brand sources
```

During development, `/components.html` shows every base component, interface icon and illustration for review (it is not part of the build).

## Project structure

```
├── *.html              one file per page
├── partials/           shared HTML included at build time
├── data/               JSON content (mysteries, prayers, rosary sequence)
├── assets-src/brand/   brand sources for generated icons (favicon)
├── public/             favicon, app icons, manifest, Open Graph image, icon sprite, logo images
├── scripts/            build helpers (icon generation)
└── src/
    ├── assets/         custom rosary illustrations (SVG)
    ├── js/             app code: services, utils, components, pages
    └── styles/         tokens, base, layout, utilities, motion, components, pages
```

See [STYLE_GUIDE.md](STYLE_GUIDE.md) for the visual and editorial rules.

## Data

The content lives as JSON in [`/data`](data) and is fetched at runtime from GitHub raw:

```
https://raw.githubusercontent.com/gwdev-web/santo-terco/main/data/<file>.json
```

Updating a JSON file on `main` updates the site without a new build. During development (`npm run dev`) the local files in `/data` are used, so changes can be tested before they are pushed.

User progress and history are stored only in the browser (`localStorage`).

## Design

The design was prototyped in Claude Design (screens, style guide and brand): calm, clear and welcoming for people who are starting to pray. The palette is beige, white, navy and gold. Headings and prayers use Playfair Display; the interface uses Lato.

## Credits

- Interface icons: [Phosphor Icons](https://phosphoricons.com/) (MIT License)
- Rosary illustrations: original drawings made for Santo Terço
- Fonts: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) and [Lato](https://fonts.google.com/specimen/Lato) (SIL Open Font License)

## Author

[gwdev-web](https://github.com/gwdev-web) · [Repository](https://github.com/gwdev-web/santo-terco)
