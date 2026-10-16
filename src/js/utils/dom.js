/**
 * Small DOM helpers.
 * Screens render from <template> elements and fill data with textContent,
 * never innerHTML with external data.
 */

/**
 * @param {string} selector
 * @param {ParentNode} [scope=document]
 * @returns {Element | null}
 */
export const qs = (selector, scope = document) => scope.querySelector(selector);

/**
 * @param {string} selector
 * @param {ParentNode} [scope=document]
 * @returns {Element[]}
 */
export const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/**
 * Clones the content of a <template> by id.
 *
 * @param {string} id
 * @returns {DocumentFragment}
 * @throws {Error} When the template does not exist.
 */
export function cloneTemplate(id) {
  const template = document.getElementById(id);

  if (!(template instanceof HTMLTemplateElement)) {
    throw new Error(`Template #${id} not found`);
  }

  return template.content.cloneNode(true);
}
