import { addDays, daySpanInclusive, getTodayUtc, toUtcDate } from "./timelineUtils.js";

const DEFAULT_OPTIONS = {
  pxPerDay: 48,
  minItemWidthPx: 72,
  labelCharacterPx: 7,
  labelPaddingPx: 24,
  maxOverflowDays: 3,
};

/**
 * Takes an array of items and assigns them to non-overlapping lanes.
 * Items are never mutated; invalid items (missing dates or malformed ranges)
 * are ignored so they do not impact the visual layout.
 *
 * The assignment strategy keeps lanes as compact as possible by always
 * reusing the lane that frees up the earliest. This reduces the number of
 * lanes that need to be rendered which keeps the timeline readable even
 * with large datasets.
 *
 * @param {Array<{id?:number|string,start:string,end:string,name?:string}>} items
 * @param {object} [options]
 * @param {number} [options.pxPerDay]
 * @param {number} [options.minItemWidthPx]
 * @param {number} [options.labelCharacterPx]
 * @param {number} [options.labelPaddingPx]
 * @param {number} [options.maxOverflowDays]
 * @returns {{lanes:Array<Array<object>>,startDate:Date,endDate:Date,totalDays:number}}
 */
function assignLanes(items, options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    const today = getTodayUtc();
    return { lanes: [], startDate: today, endDate: today, totalDays: 1 };
  }

  const config = { ...DEFAULT_OPTIONS, ...options };
  const pxPerDay = Math.max(1, Number(config.pxPerDay) || DEFAULT_OPTIONS.pxPerDay);
  const minItemWidthPx = Math.max(4, Number(config.minItemWidthPx) || DEFAULT_OPTIONS.minItemWidthPx);
  const labelCharacterPx = Math.max(1, Number(config.labelCharacterPx) || DEFAULT_OPTIONS.labelCharacterPx);
  const labelPaddingPx = Math.max(0, Number(config.labelPaddingPx) || DEFAULT_OPTIONS.labelPaddingPx);
  const maxOverflowDays = Math.max(0, Number(config.maxOverflowDays) || DEFAULT_OPTIONS.maxOverflowDays);

  const preparedItems = [];

  for (const item of items) {
    if (!item || !item.start || !item.end) {
      continue;
    }

    const startDate = toUtcDate(item.start);
    const endDate = toUtcDate(item.end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      continue;
    }

    if (endDate.getTime() < startDate.getTime()) {
      continue;
    }

    const daySpan = daySpanInclusive(startDate, endDate);
    const baseWidthPx = daySpan * pxPerDay;
    const trimmedName = typeof item.name === "string" ? item.name.trim() : "";
    const approximateLabelWidth = trimmedName.length > 0 ? trimmedName.length * labelCharacterPx : 0;
    const desiredLabelWidth = approximateLabelWidth > 0 ? approximateLabelWidth + labelPaddingPx : minItemWidthPx;
    const minSpanForWidth = Math.max(daySpan, Math.ceil(minItemWidthPx / pxPerDay));
    const spanForLabel = Math.max(daySpan, Math.ceil(desiredLabelWidth / pxPerDay));
    const maxAllowedSpan = daySpan + maxOverflowDays;
    const displayDaySpan = Math.min(Math.max(minSpanForWidth, spanForLabel), maxAllowedSpan);
    const displayWidthPx = displayDaySpan * pxPerDay;
    const requiresTooltip = spanForLabel > displayDaySpan;
    const visualEndDate = addDays(startDate, displayDaySpan - 1);

    const itemId = item.id != null ? item.id : `${item.start}-${item.end}-${trimmedName || "item"}`;

    preparedItems.push({
      item,
      itemId,
      startDate,
      endDate,
      daySpan,
      baseWidthPx,
      displayDaySpan,
      displayWidthPx,
      visualEndDate,
      requiresTooltip,
    });
  }

  if (preparedItems.length === 0) {
    const today = getTodayUtc();
    return { lanes: [], startDate: today, endDate: today, totalDays: 1 };
  }

  preparedItems.sort((a, b) => {
    const startDiff = a.startDate.getTime() - b.startDate.getTime();
    if (startDiff !== 0) {
      return startDiff;
    }

    const endDiff = a.endDate.getTime() - b.endDate.getTime();
    if (endDiff !== 0) {
      return endDiff;
    }

    const nameA = typeof a.item.name === "string" ? a.item.name : "";
    const nameB = typeof b.item.name === "string" ? b.item.name : "";
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    const idA = typeof a.item.id === "number" ? a.item.id : String(a.item.id || "");
    const idB = typeof b.item.id === "number" ? b.item.id : String(b.item.id || "");
    if (idA < idB) {
      return -1;
    }
    if (idA > idB) {
      return 1;
    }
    return 0;
  });

  const lanes = [];
  const laneAvailability = [];
  let minStartDate = null;
  let maxVisualEndDate = null;

  for (const entry of preparedItems) {
    const { item, startDate, endDate, visualEndDate } = entry;

    if (!minStartDate || startDate < minStartDate) {
      minStartDate = startDate;
    }
    if (!maxVisualEndDate || visualEndDate > maxVisualEndDate) {
      maxVisualEndDate = visualEndDate;
    }

    let laneInfoIndex = -1;

    for (let i = 0; i < laneAvailability.length; i += 1) {
      if (laneAvailability[i].endTime.getTime() < startDate.getTime()) {
        laneInfoIndex = i;
        break;
      }
    }

    if (laneInfoIndex === -1) {
      const laneIndex = lanes.length;
      lanes.push([{ ...entry }]);
      insertLaneByEndTime(laneAvailability, {
        laneIndex,
        endTime: visualEndDate,
      });
    } else {
      const laneInfo = laneAvailability.splice(laneInfoIndex, 1)[0];
      lanes[laneInfo.laneIndex].push({ ...entry });
      laneInfo.endTime = visualEndDate;
      insertLaneByEndTime(laneAvailability, laneInfo);
    }
  }

  const fallbackToday = getTodayUtc();
  const startDate = minStartDate || fallbackToday;
  const endDate = maxVisualEndDate || startDate;
  const totalDays = daySpanInclusive(startDate, endDate);

  return {
    lanes,
    startDate,
    endDate,
    totalDays,
  };
}

function insertLaneByEndTime(queue, laneInfo) {
  let inserted = false;
  for (let i = 0; i < queue.length; i += 1) {
    if (laneInfo.endTime.getTime() < queue[i].endTime.getTime()) {
      queue.splice(i, 0, laneInfo);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    queue.push(laneInfo);
  }
}

export default assignLanes;
