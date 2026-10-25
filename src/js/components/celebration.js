import { qs } from '../utils/dom.js';
import { appUrl } from '../utils/url.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CONFETTI_COUNT = 22;

/** Sparkle positions in % of the art, [left, top]. */
const SPARKLES = [
  [14, 18],
  [80, 14],
  [22, 74],
  [84, 70],
  [50, 4],
  [6, 44],
  [92, 40],
  [64, 86],
];

/**
 * Celebration: rays turning slowly, ripples, sparkles and falling gold beads around
 * medals that pop in, then the text fades up (see celebration.css).
 * The beads are added to `[data-celebration-confetti]` and the sparkles to
 * `[data-celebration-sparkles]`.
 * Under reduced motion CSS shows it still.
 *
 * @param {HTMLElement} root - The `.celebration` element.
 * @returns {{ play(): void }}
 */
export function createCelebration(root) {
  const confetti = qs('[data-celebration-confetti]', root);
  const sparkles = qs('[data-celebration-sparkles]', root);

  // Spread with fixed steps instead of random numbers, so every visit looks the same
  for (let index = 0; index < CONFETTI_COUNT; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'celebration__piece';
    piece.style.setProperty('--x', `${(index * 37 + 7) % 100}%`);
    piece.style.setProperty('--size', `${6 + (index % 4) * 3}px`);
    piece.style.setProperty('--delay', `${((index * 0.37) % 3).toFixed(2)}s`);
    piece.style.setProperty('--duration', `${3.4 + (index % 5) * 0.5}s`);
    confetti?.append(piece);
  }

  SPARKLES.forEach(([left, top], index) => {
    const sparkle = document.createElementNS(SVG_NS, 'svg');
    const use = document.createElementNS(SVG_NS, 'use');

    use.setAttribute('href', appUrl('icons.svg#star'));
    sparkle.append(use);
    sparkle.setAttribute('class', 'celebration__sparkle');
    sparkle.style.setProperty('--x', `${left}%`);
    sparkle.style.setProperty('--y', `${top}%`);
    sparkle.style.setProperty('--size', `${12 + (index % 3) * 6}px`);
    sparkle.style.setProperty('--delay', `${index * 0.3}s`);
    sparkles?.append(sparkle);
  });

  function play() {
    root.classList.remove('celebration--playing');
    void root.offsetWidth; // a reflow restarts the CSS animations
    root.classList.add('celebration--playing');
  }

  return { play };
}
