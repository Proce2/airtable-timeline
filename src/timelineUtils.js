/**
 * Timeline utility helpers.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parse a YYYY-MM-DD string into a UTC Date to avoid TZ drift.
 * @param {string} isoDay
 * @returns {Date}
 */
export function toUtcDate(isoDay) {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Format a Date back to YYYY-MM-DD (UTC-based).
 * @param {Date} date
 * @returns {string}
 */
export function formatIsoDay(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Inclusive day span between two UTC dates.
 * @param {Date} start
 * @param {Date} end
 * @returns {number}
 */
export function daySpanInclusive(start, end) {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / MS_PER_DAY) + 1;
}

/**
 * Compute the overall date range for the items.
 * @param {Array<{start:string,end:string}>} items
 */
export function getDateRange(items) {
  let min = null;
  let max = null;
  for (const it of items) {
    const s = toUtcDate(it.start);
    const e = toUtcDate(it.end);
    if (!min || s < min) min = s;
    if (!max || e > max) max = e;
  }
  if (!min || !max) {
    const today = new Date();
    const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    return { startDate: base, endDate: base, totalDays: 1 };
  }
  return { startDate: min, endDate: max, totalDays: daySpanInclusive(min, max) };
}

/**
 * Get pixel left offset for a date relative to the timeline start.
 * @param {Date} date
 * @param {Date} startDate
 * @param {number} pxPerDay
 */
export function leftForDate(date, startDate, pxPerDay) {
  const days = Math.floor((date.getTime() - startDate.getTime()) / MS_PER_DAY);
  return days * pxPerDay;
}

/**
 * Compute item left/width in pixels.
 * @param {{start:string,end:string,name:string,id:number}} item
 * @param {Date} startDate
 * @param {number} pxPerDay
 */
export function getItemBox(item, startDate, pxPerDay) {
  const s = toUtcDate(item.start);
  const e = toUtcDate(item.end);
  const left = leftForDate(s, startDate, pxPerDay);
  const days = daySpanInclusive(s, e);
  const width = Math.max(6, days * pxPerDay);
  return { left, width };
}

export const DEFAULT_ZOOM_STEPS = [6, 8, 12, 16, 24, 32];

