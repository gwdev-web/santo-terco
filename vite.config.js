import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

/** Public URL of the site, used in canonical and Open Graph tags. */
const SITE_URL = 'https://gwdev-web.github.io/santo-terco/';

/** Path the build (and `npm run preview`) is published under: the GitHub Pages project site. Development stays at "/". */
const BUILD_BASE = new URL(SITE_URL).pathname;

/**
 * Where the JSON data is read from. The build reads this repository's /data folder through
 * its GitHub raw URL, so data updates go live with a push to main, without a new build.
 * Development serves the local /data files, so changes can be tested before they are pushed.
 */
const BUILD_DATA_URL = 'https://raw.githubusercontent.com/gwdev-web/santo-terco/main/data';
const DEV_DATA_URL = '/data';

/**
 * Pages built for production, with their SEO metadata and the data files they load first,
 * which are preloaded so the request starts with the HTML instead of after the scripts.
 * `components.html` is a dev-only review page and is intentionally not listed.
 */
const PAGES = {
  index: {
    title: 'Santo Terço · Reze o terço do dia',
    description: 'Reze o terço do dia com calma, guiado oração por oração, com o mistério sugerido para hoje.',
    data: ['mysteries.json'],
  },
  mysteries: {
    title: 'Mistérios · Santo Terço',
    description: 'Os quatro mistérios do Rosário: Gozosos, Dolorosos, Gloriosos e Luminosos. Escolha qual rezar.',
    data: ['mysteries.json'],
  },
  prayers: {
    title: 'Orações · Santo Terço',
    description: 'As orações do terço e orações complementares, com o texto completo.',
    data: ['prayers.json'],
  },
  pray: {
    title: 'Rezar o terço · Santo Terço',
    description: 'O terço guiado, oração por oração, com o seu progresso salvo neste aparelho.',
    data: ['mysteries.json', 'prayers.json', 'rosary.json'],
  },
  'rosary-complete': {
    title: 'Rosário completo · Santo Terço',
    description: 'Você meditou os vinte mistérios num só dia.',
    data: ['mysteries.json'],
  },
  history: {
    title: 'Histórico · Santo Terço',
    description: 'Seus dias de oração, terços rezados e medalhas, salvos só neste aparelho.',
  },
  about: {
    title: 'Sobre · Santo Terço',
    description: 'Um guia simples para quem está começando a rezar o terço.',
  },
  symbols: {
    title: 'Símbolos e design · Santo Terço',
    description: 'O significado do logotipo, das cores, das ilustrações e das letras do Santo Terço.',
    data: ['mysteries.json', 'prayers.json'],
  },
  404: {
    title: 'Página não encontrada · Santo Terço',
    description: 'Esta página não existe. Volte ao início para rezar o terço do dia.',
  },
};

/** Escapes text for use inside an HTML attribute. */
const escapeAttribute = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

/**
 * Tiny HTML partials plugin:
 * - `<!-- @include name -->` is replaced by `partials/name.html`;
 * - `{{title}}`, `{{description}}`, `{{url}}` and `{{siteUrl}}` are filled from PAGES;
 * - `<!-- @data-preload -->` becomes a preload link for each of the page's data files;
 * - links marked `data-nav="<page>"` get `aria-current="page"` on their own page;
 * - site links (`<a href="/…">`) get the base the site is published under. Vite already does
 *   this for assets (scripts, styles, images, icons), but not for links between pages.
 */
function htmlPartials() {
  let base = '/';
  let dataUrl = DEV_DATA_URL;

  return {
    name: 'html-partials',
    configResolved(config) {
      base = config.base;
      dataUrl = config.command === 'build' ? BUILD_DATA_URL : DEV_DATA_URL;
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, { filename }) {
        const page = basename(filename, '.html');
        const meta = PAGES[page] ?? { title: 'Santo Terço', description: '' };
        // Same mode and credentials as fetch() in src/js/services/api.js, so the browser reuses the response
        const dataPreload = (meta.data ?? [])
          .map((file) => `    <link rel="preload" href="${dataUrl}/${file}" as="fetch" crossorigin="anonymous">\n`)
          .join('');
        const url = page === 'index' ? SITE_URL : `${SITE_URL}${page}.html`;

        return html
          .replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
            readFileSync(resolve(root, 'partials', `${name}.html`), 'utf8'),
          )
          .replace(/^[ \t]*<!-- @data-preload -->\n/m, dataPreload)
          .replaceAll('{{title}}', escapeAttribute(meta.title))
          .replaceAll('{{description}}', escapeAttribute(meta.description))
          .replaceAll('{{url}}', url)
          .replaceAll('{{siteUrl}}', SITE_URL)
          .replaceAll(`data-nav="${page}"`, `data-nav="${page}" aria-current="page"`)
          .replace(/(<a\b[^>]*?\shref=")\/(?!\/)/g, `$1${base}`);
      },
    },
    // Reload the browser when a partial changes during development
    configureServer(server) {
      server.watcher.add(resolve(root, 'partials'));
      server.watcher.on('change', (file) => {
        if (file.includes(`${root}partials`)) server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? BUILD_BASE : '/',
  define: {
    'import.meta.env.DATA_URL': JSON.stringify(command === 'build' ? BUILD_DATA_URL : DEV_DATA_URL),
  },
  plugins: [htmlPartials()],
  build: {
    rolldownOptions: {
      input: Object.fromEntries(Object.keys(PAGES).map((page) => [page, resolve(root, `${page}.html`)])),
    },
  },
}));
