/**
 * Date helpers. Everything uses the device's local time, because the
 * mystery of the day follows the user's own calendar day.
 */

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** @param {Date} date @returns {string} e.g. "Terça-feira" */
export const weekdayName = (date) => WEEKDAYS[date.getDay()];

/** @param {Date} date @returns {string} e.g. "Ter" */
export const weekdayShortName = (date) => WEEKDAYS_SHORT[date.getDay()];

/** @param {Date} date @returns {string} e.g. "20 out" */
export const formatShortDate = (date) => `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;

/**
 * @param {Date} date
 * @returns {string} Local day as "YYYY-MM-DD", used as the key for saved progress and history.
 */
export function toDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * @param {Date} date
 * @returns {Date[]} The seven days of the week that contains `date`, Monday to Sunday.
 */
export function getWeek(date) {
  const daysSinceMonday = (date.getDay() + 6) % 7;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday);

  return Array.from(
    { length: 7 },
    (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index),
  );
}
