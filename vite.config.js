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
 * Pages built for production, with their SEO metadata.
 * `components.html` is a dev-only review page and is intentionally not listed.
 */
const PAGES = {
  index: {
    title: 'Santo Terço · Reze o terço do dia',
    description: 'Reze o terço do dia com calma, guiado oração por oração, com o mistério sugerido para hoje.',
  },
  mysteries: {
    title: 'Mistérios · Santo Terço',
    description: 'Os quatro mistérios do Rosário: Gozosos, Dolorosos, Gloriosos e Luminosos. Escolha qual rezar.',
  },
  prayers: {
    title: 'Orações · Santo Terço',
    description: 'As orações do terço e orações complementares, com o texto completo.',
  },
  pray: {
    title: 'Rezar o terço · Santo Terço',
    description: 'O terço guiado, oração por oração, com o seu progresso salvo neste aparelho.',
  },
  'rosary-complete': {
    title: 'Rosário completo · Santo Terço',
    description: 'Você meditou os vinte mistérios num só dia.',
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
 * - links marked `data-nav="<page>"` get `aria-current="page"` on their own page;
 * - site links (`<a href="/…">`) get the base the site is published under. Vite already does
 *   this for assets (scripts, styles, images, icons), but not for links between pages.
 */
function htmlPartials() {
  let base = '/';

  return {
    name: 'html-partials',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, { filename }) {
        const page = basename(filename, '.html');
        const meta = PAGES[page] ?? { title: 'Santo Terço', description: '' };
        const url = page === 'index' ? SITE_URL : `${SITE_URL}${page}.html`;

        return html
          .replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
            readFileSync(resolve(root, 'partials', `${name}.html`), 'utf8'),
          )
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
  plugins: [htmlPartials()],
  build: {
    rolldownOptions: {
      input: Object.fromEntries(Object.keys(PAGES).map((page) => [page, resolve(root, `${page}.html`)])),
    },
  },
}));
