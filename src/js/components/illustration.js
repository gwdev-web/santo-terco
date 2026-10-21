/** Illustration names are file names: lowercase letters, digits and hyphens. */
const ILLUSTRATION_NAME = /^[a-z0-9-]+$/;

/**
 * Shows one of the rosary illustrations on an `.illustration` element.
 * The element starts `hidden`, because without a drawing the mask would paint a solid square.
 *
 * @param {Element} element - An `.illustration` element.
 * @param {string} name - Illustration name from the data, e.g. "m-anunciacao".
 */
export function setIllustration(element, name) {
  if (!ILLUSTRATION_NAME.test(name)) return;

  element.classList.add(`illustration--${name}`);
  element.hidden = false;
}
