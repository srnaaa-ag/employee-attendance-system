/**
 * @param {Date | string | number} value
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatDate(value, options) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("mk-MK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  }).format(d);
}
