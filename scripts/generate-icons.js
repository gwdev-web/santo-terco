/**
 * Generates the favicon, app icons and the Open Graph image into public/.
 *
 * Sources:
 *   assets-src/brand/favicon.svg        gold "M" on navy (16–32px rule)
 *   public/images/logo-emblem-on-navy.svg   emblem used on app icons and og-image
 *
 * Run with `npm run icons` after changing any source. The outputs are committed,
 * so the regular build does not depend on this script.
 */
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import sharp from 'sharp';

const BRAND_DIR = 'assets-src/brand';
const PUBLIC_DIR = 'public';
const EMBLEM_ON_NAVY = `${PUBLIC_DIR}/images/logo-emblem-on-navy.svg`;

const NAVY = '#1C2B4B';
const NAVY_HOVER = '#2A3D66';
const BEIGE_LIGHT = '#FAF8F5';
const GOLD_BRIGHT = '#D4AF37';
const GOLD_LIGHT = '#E7CB86';
const ON_NAVY_MUTED = '#D9D4C7';

/** Rasterizes an SVG buffer to a square PNG buffer. */
function svgToPng(svg, size) {
  return sharp(svg, { density: 1200 }).resize(size, size).png().toBuffer();
}

/** Packs PNG buffers into a .ico file (PNG-compressed entries). */
function toIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;

  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

/** Navy square with the emblem centered; `scale` is the emblem height relative to the icon. */
async function appIcon(size, scale) {
  const emblemHeight = Math.round(size * scale);
  const emblem = await sharp(await readFile(EMBLEM_ON_NAVY), { density: 1200 })
    .resize({ height: emblemHeight })
    .png()
    .toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: emblem, gravity: 'center' }])
    .png()
    .toBuffer();
}

/** 1200×630 Open Graph image: navy, damask, emblem and wordmark. */
async function ogImage() {
  const width = 1200;
  const height = 630;

  const background = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <radialGradient id="glow" cx="30%" cy="45%" r="75%">
          <stop offset="0" stop-color="${NAVY_HOVER}"/>
          <stop offset="0.6" stop-color="${NAVY}"/>
        </radialGradient>
        <pattern id="damask" width="220" height="220" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="${NAVY_HOVER}" stroke-width="1.4">
            <path d="M110 18c32 22 32 62 0 84c-32-22-32-62 0-84z"/>
            <path d="M110 102c-42 0-62 30-62 62M110 102c42 0 62 30 62 62"/>
            <circle cx="48" cy="170" r="9"/><circle cx="172" cy="170" r="9"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <rect width="100%" height="100%" fill="url(#damask)" opacity="0.6"/>
      <text x="560" y="300" font-family="Didot, 'Playfair Display', Georgia, serif" font-size="88" letter-spacing="4" fill="${BEIGE_LIGHT}">SANTO</text>
      <path transform="translate(912 236) scale(1.5)" fill="${GOLD_BRIGHT}"
        d="M12 0C12.8 7.2 16.8 11.2 24 12C16.8 12.8 12.8 16.8 12 24C11.2 16.8 7.2 12.8 0 12C7.2 11.2 11.2 7.2 12 0Z"/>
      <text x="560" y="400" font-family="Didot, 'Playfair Display', Georgia, serif" font-size="88" letter-spacing="4" fill="${BEIGE_LIGHT}">TERÇO</text>
      <text x="562" y="470" font-family="'Helvetica Neue', Lato, Arial, sans-serif" font-size="30" fill="${ON_NAVY_MUTED}">Reze o terço do dia, oração por oração.</text>
      <rect x="562" y="500" width="72" height="4" rx="2" fill="${GOLD_LIGHT}"/>
    </svg>`);

  const emblem = await sharp(await readFile(EMBLEM_ON_NAVY), { density: 1200 })
    .resize({ height: 430 })
    .png()
    .toBuffer();

  return sharp(background)
    .composite([{ input: emblem, left: 150, top: 100 }])
    .png()
    .toBuffer();
}

async function main() {
  const favicon = await readFile(`${BRAND_DIR}/favicon.svg`);

  await copyFile(`${BRAND_DIR}/favicon.svg`, `${PUBLIC_DIR}/favicon.svg`);
  await writeFile(
    `${PUBLIC_DIR}/favicon.ico`,
    toIco([
      { size: 16, data: await svgToPng(favicon, 16) },
      { size: 32, data: await svgToPng(favicon, 32) },
      { size: 48, data: await svgToPng(favicon, 48) },
    ]),
  );

  await writeFile(`${PUBLIC_DIR}/apple-touch-icon.png`, await appIcon(180, 0.72));
  await writeFile(`${PUBLIC_DIR}/icon-192.png`, await appIcon(192, 0.72));
  await writeFile(`${PUBLIC_DIR}/icon-512.png`, await appIcon(512, 0.72));
  await writeFile(`${PUBLIC_DIR}/icon-maskable-512.png`, await appIcon(512, 0.56));
  await writeFile(`${PUBLIC_DIR}/og-image.png`, await ogImage());

  console.log('Icons and og-image generated in public/.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
