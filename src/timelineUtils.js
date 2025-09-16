/**
 * Timeline utility helpers.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTH_LONG_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH_SHORT_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  timeZone: "UTC",
});

const MONTH_SHORT_YEAR_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const MONTH_DAY_YEAR_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  timeZone: "UTC",
});

const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  timeZone: "UTC",
});

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
    if (!it || !it.start || !it.end) {
      continue;
    }
    const s = toUtcDate(it.start);
    const e = toUtcDate(it.end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      continue;
    }
    if (e.getTime() < s.getTime()) {
      continue;
    }
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
  const width = Math.max(days * pxPerDay, Math.max(6, Math.floor(pxPerDay * 0.6)));
  return { left, width };
}

/**
 * Create a new Date offset by a number of days.
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * Compute the inclusive end date for a range described by totalDays.
 * @param {Date} startDate
 * @param {number} totalDays
 * @returns {Date}
 */
export function getRangeEndDate(startDate, totalDays) {
  const safeDays = Math.max(0, totalDays - 1);
  return addDays(startDate, safeDays);
}

/**
 * Return a UTC date representing "today" at midnight.
 * @returns {Date}
 */
export function getTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Determine if a date is within an inclusive range.
 * @param {Date} target
 * @param {Date} start
 * @param {Date} end
 * @returns {boolean}
 */
export function isDateWithinRange(target, start, end) {
  const time = target.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

/**
 * Enumerate each day in a range.
 * @param {Date} startDate
 * @param {number} totalDays
 * @returns {Date[]}
 */
export function enumerateDays(startDate, totalDays) {
  const days = [];
  for (let i = 0; i < totalDays; i += 1) {
    days.push(addDays(startDate, i));
  }
  return days;
}

/**
 * Format the day name for a UTC date (e.g. Mon, Tue).
 * @param {Date} date
 * @returns {string}
 */
export function formatDayName(date) {
  return WEEKDAY_SHORT_FORMATTER.format(date);
}

/**
 * Format the day number for a UTC date.
 * @param {Date} date
 * @returns {string}
 */
export function formatDayNumber(date) {
  return DAY_FORMATTER.format(date);
}

/**
 * Determine if a date falls on the weekend.
 * @param {Date} date
 * @returns {boolean}
 */
export function isWeekendDay(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Format a month label for the header (e.g. October 2021).
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {string}
 */
export function formatMonthRangeLabel(startDate, endDate) {
  const sameMonth =
    startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
    startDate.getUTCMonth() === endDate.getUTCMonth();
  if (sameMonth) {
    return MONTH_LONG_FORMATTER.format(startDate);
  }
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();
  if (sameYear) {
    const year = startDate.getUTCFullYear();
    return `${MONTH_SHORT_FORMATTER.format(startDate)} – ${MONTH_SHORT_FORMATTER.format(endDate)} ${year}`;
  }
  return `${MONTH_SHORT_YEAR_FORMATTER.format(startDate)} – ${MONTH_SHORT_YEAR_FORMATTER.format(endDate)}`;
}

/**
 * Format a compact range summary (e.g. Oct 4 – Oct 29, 2021).
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {string}
 */
export function formatRangeSummary(startDate, endDate) {
  if (startDate.getTime() === endDate.getTime()) {
    return MONTH_DAY_YEAR_FORMATTER.format(startDate);
  }
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();
  if (sameYear) {
    const year = startDate.getUTCFullYear();
    return `${MONTH_DAY_FORMATTER.format(startDate)} – ${MONTH_DAY_FORMATTER.format(endDate)}, ${year}`;
  }
  return `${MONTH_DAY_YEAR_FORMATTER.format(startDate)} – ${MONTH_DAY_YEAR_FORMATTER.format(endDate)}`;
}

/**
 * Format a short month/day label (e.g. Oct 12).
 * @param {Date} date
 * @returns {string}
 */
export function formatMonthDay(date) {
  return MONTH_DAY_FORMATTER.format(date);
}

/**
 * Format a numeric date (MM/DD/YYYY).
 * @param {Date} date
 * @returns {string}
 */
export function formatNumericDate(date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${month}/${day}/${year}`;
}

export { MS_PER_DAY };
