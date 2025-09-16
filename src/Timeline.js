import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import assignLanes from "./assignLanes.js";
import {
  addDays,
  enumerateDays,
  formatDayName,
  formatDayNumber,
  formatIsoDay,
  formatMonthDay,
  formatMonthRangeLabel,
  formatNumericDate,
  formatRangeSummary,
  getTodayUtc,
  isDateWithinRange,
  isWeekendDay,
  leftForDate,
  toUtcDate,
} from "./timelineUtils.js";
import "./timeline.css";

const TIMEFRAME_OPTIONS = [
  { value: "week", label: "Week", pxPerDay: 68 },
  { value: "two-week", label: "2 week", pxPerDay: 52 },
  { value: "month", label: "Month", pxPerDay: 38 },
];

const DEFAULT_ZOOM_INDEX = 1;
const MIN_ITEM_WIDTH_PX = 96;
const LABEL_CHARACTER_WIDTH = 7;
const LABEL_PADDING_PX = 28;
const MAX_LABEL_OVERFLOW_DAYS = 3;
const UNTITLED_LABEL = "Untitled item";

const DRAG_TYPES = {
  MOVE: "move",
  RESIZE_START: "resize-start",
  RESIZE_END: "resize-end",
};

const STAGE_STYLES = {
  alpha: { background: "#f59f00", shadow: "rgba(245, 159, 0, 0.35)" },
  beta: { background: "#1bbe84", shadow: "rgba(27, 190, 132, 0.32)" },
  ga: { background: "#2b6df8", shadow: "rgba(43, 109, 248, 0.35)" },
  deprecated: { background: "#ef4565", shadow: "rgba(239, 69, 101, 0.35)" },
  default: { background: "#475569", shadow: "rgba(71, 85, 105, 0.3)" },
};

function Timeline({ items }) {
  const [records, setRecords] = useState(() => items);
  useEffect(() => {
    setRecords(items);
  }, [items]);

  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const pxPerDay = useMemo(() => TIMEFRAME_OPTIONS[zoomIndex].pxPerDay, [zoomIndex]);

  const layout = useMemo(
    () =>
      assignLanes(records, {
        pxPerDay,
        minItemWidthPx: MIN_ITEM_WIDTH_PX,
        labelCharacterPx: LABEL_CHARACTER_WIDTH,
        labelPaddingPx: LABEL_PADDING_PX,
        maxOverflowDays: MAX_LABEL_OVERFLOW_DAYS,
      }),
    [records, pxPerDay]
  );

  const { lanes, startDate, endDate, totalDays } = layout;

  const days = useMemo(() => enumerateDays(startDate, totalDays), [startDate, totalDays]);
  const monthLabel = useMemo(() => formatMonthRangeLabel(startDate, endDate), [startDate, endDate]);
  const rangeLabel = useMemo(() => formatRangeSummary(startDate, endDate), [startDate, endDate]);

  const hasData = lanes.some((lane) => lane.length > 0);
  const todayUtc = getTodayUtc();
  const showTodayMarker = hasData && isDateWithinRange(todayUtc, startDate, endDate);
  const todayLeft = showTodayMarker ? leftForDate(todayUtc, startDate, pxPerDay) : 0;
  const todayLabel = formatMonthDay(todayUtc);
  const contentWidth = Math.max(totalDays * pxPerDay, 1);
  const itemCount = records.length;

  const [editingId, setEditingId] = useState(null);
  const pointerInteractionRef = useRef(null);
  const [activeInteraction, setActiveInteraction] = useState(null);

  const updateItemDates = useCallback((id, nextStartDate, nextEndDate) => {
    const nextStart = formatIsoDay(nextStartDate);
    const nextEnd = formatIsoDay(nextEndDate);
    setRecords((prev) =>
      prev.map((record) => {
        if (record.id !== id) {
          return record;
        }
        if (record.start === nextStart && record.end === nextEnd) {
          return record;
        }
        return { ...record, start: nextStart, end: nextEnd };
      })
    );
  }, []);

  const handleRename = useCallback((id, name) => {
    const trimmed = name.trim();
    const nextName = trimmed.length > 0 ? trimmed : UNTITLED_LABEL;
    setRecords((prev) =>
      prev.map((record) => {
        if (record.id !== id) {
          return record;
        }
        if (record.name === nextName) {
          return record;
        }
        return { ...record, name: nextName };
      })
    );
  }, []);

  useEffect(() => {
    if (editingId == null) {
      return;
    }
    const stillExists = records.some((record) => record.id === editingId);
    if (!stillExists) {
      setEditingId(null);
    }
  }, [records, editingId]);

  const handlePointerMove = useCallback(
    (event) => {
      const interaction = pointerInteractionRef.current;
      if (!interaction || event.pointerId !== interaction.pointerId) {
        return;
      }
      const deltaPx = event.clientX - interaction.anchorX;
      const deltaDays = Math.round(deltaPx / pxPerDay);
      if (deltaDays === interaction.lastDelta) {
        return;
      }

      const anchorStart = interaction.startDate;
      const anchorEnd = interaction.endDate;
      let nextStart = interaction.lastStart;
      let nextEnd = interaction.lastEnd;

      if (interaction.type === DRAG_TYPES.MOVE) {
        nextStart = addDays(anchorStart, deltaDays);
        nextEnd = addDays(anchorEnd, deltaDays);
      } else if (interaction.type === DRAG_TYPES.RESIZE_START) {
        const candidateStart = addDays(anchorStart, deltaDays);
        const limitEnd = interaction.lastEnd;
        nextStart = candidateStart.getTime() > limitEnd.getTime() ? limitEnd : candidateStart;
      } else if (interaction.type === DRAG_TYPES.RESIZE_END) {
        const candidateEnd = addDays(anchorEnd, deltaDays);
        const limitStart = interaction.lastStart;
        nextEnd = candidateEnd.getTime() < limitStart.getTime() ? limitStart : candidateEnd;
      }

      interaction.lastDelta = deltaDays;
      interaction.lastStart = nextStart;
      interaction.lastEnd = nextEnd;
      updateItemDates(interaction.id, nextStart, nextEnd);
    },
    [pxPerDay, updateItemDates]
  );

  const finishInteraction = useCallback(
    (event) => {
      const interaction = pointerInteractionRef.current;
      if (!interaction) {
        return;
      }
      if (event && event.pointerId !== undefined && event.pointerId !== interaction.pointerId) {
        return;
      }
      pointerInteractionRef.current = null;
      setActiveInteraction(null);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishInteraction);
      window.removeEventListener("pointercancel", finishInteraction);
    },
    [handlePointerMove]
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishInteraction);
      window.removeEventListener("pointercancel", finishInteraction);
    };
  }, [handlePointerMove, finishInteraction]);

  useEffect(() => {
    finishInteraction();
  }, [pxPerDay, finishInteraction]);

  const handleBeginInteraction = useCallback(
    (event, layoutEntry, type) => {
      if (event.button !== 0) {
        return;
      }
      const itemId = layoutEntry.itemId;
      if (itemId == null) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (editingId != null) {
        setEditingId(null);
      }
      pointerInteractionRef.current = {
        id: itemId,
        type,
        pointerId: event.pointerId,
        anchorX: event.clientX,
        startDate: layoutEntry.startDate,
        endDate: layoutEntry.endDate,
        lastStart: layoutEntry.startDate,
        lastEnd: layoutEntry.endDate,
        lastDelta: 0,
      };
      setActiveInteraction({ id: itemId, type });
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", finishInteraction);
      window.addEventListener("pointercancel", finishInteraction);
    },
    [editingId, finishInteraction, handlePointerMove]
  );

  const handleZoomIn = useCallback(() => {
    setZoomIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomIndex((prev) => (prev < TIMEFRAME_OPTIONS.length - 1 ? prev + 1 : prev));
  }, []);

  const canZoomIn = zoomIndex > 0;
  const canZoomOut = zoomIndex < TIMEFRAME_OPTIONS.length - 1;

  const handleSelectTimeframe = useCallback((value) => {
    const nextIndex = TIMEFRAME_OPTIONS.findIndex((option) => option.value === value);
    if (nextIndex !== -1) {
      setZoomIndex(nextIndex);
    }
  }, []);

  const handleStartEditing = useCallback((id) => {
    setEditingId(id);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleCommitEdit = useCallback(
    (id, nextName) => {
      handleRename(id, nextName);
      setEditingId(null);
    },
    [handleRename]
  );

  const zoomLabel = `${pxPerDay}px / day`;

  return (
    <div className="timeline" aria-label="Product roadmap timeline">
      <Toolbar
        monthLabel={monthLabel}
        rangeLabel={rangeLabel}
        timeframeValue={TIMEFRAME_OPTIONS[zoomIndex].value}
        onTimeframeChange={handleSelectTimeframe}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        zoomLabel={zoomLabel}
        itemCount={itemCount}
      />
      <div className="timeline-scroller" role="region" aria-label="Timeline">
        <div className="timeline-content" style={{ width: `${contentWidth}px` }}>
          <DayHeader days={days} pxPerDay={pxPerDay} />
          <div className="lanes-container">
            <DayColumns days={days} pxPerDay={pxPerDay} />
            {showTodayMarker ? <TodayMarker left={todayLeft} label={todayLabel} /> : null}
            {hasData ? (
              <div className="lanes" role="list">
                {lanes.map((laneItems, index) => (
                  <Lane
                    key={index}
                    laneIndex={index}
                    itemsInLane={laneItems}
                    startDate={startDate}
                    pxPerDay={pxPerDay}
                    onBeginInteraction={handleBeginInteraction}
                    onStartEditing={handleStartEditing}
                    onCancelEdit={handleCancelEdit}
                    onCommitEdit={handleCommitEdit}
                    activeInteraction={activeInteraction}
                    editingId={editingId}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toolbar({
  monthLabel,
  rangeLabel,
  timeframeValue,
  onTimeframeChange,
  onZoomIn,
  onZoomOut,
  canZoomIn,
  canZoomOut,
  zoomLabel,
  itemCount,
}) {
  const handleZoomInClick = useCallback(() => {
    if (canZoomIn && typeof onZoomIn === "function") {
      onZoomIn();
    }
  }, [canZoomIn, onZoomIn]);

  const handleZoomOutClick = useCallback(() => {
    if (canZoomOut && typeof onZoomOut === "function") {
      onZoomOut();
    }
  }, [canZoomOut, onZoomOut]);

  const summaryLabel = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  return (
    <div className="timeline-toolbar">
      <div className="toolbar-headings">
        <h1 className="timeline-heading">{monthLabel}</h1>
        <span className="timeline-range">{rangeLabel}</span>
        <span className="timeline-summary">{summaryLabel}</span>
      </div>
      <div className="toolbar-actions">
        <div className="zoom-controls">
          <span className="zoom-label">Zoom</span>
          <div className="zoom-buttons" role="group" aria-label="Zoom controls">
            <button
              type="button"
              className="zoom-button"
              onClick={handleZoomOutClick}
              disabled={!canZoomOut}
              aria-label="Zoom out"
            >
              <span aria-hidden="true">−</span>
            </button>
            <span className="zoom-value">{zoomLabel}</span>
            <button
              type="button"
              className="zoom-button"
              onClick={handleZoomInClick}
              disabled={!canZoomIn}
              aria-label="Zoom in"
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
        </div>
        <label className="timeframe-label">
          View
          <select
            className="timeframe-select"
            value={timeframeValue}
            onChange={(event) => onTimeframeChange(event.target.value)}
            aria-label="Select timeframe"
          >
            {TIMEFRAME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="records-button">
          See records
        </button>
      </div>
    </div>
  );
}

function DayHeader({ days, pxPerDay }) {
  return (
    <div className="timeline-day-header" aria-hidden="true">
      {days.map((day) => {
        const iso = formatIsoDay(day);
        const isWeekend = isWeekendDay(day);
        const cellClass = isWeekend ? "timeline-day-cell weekend" : "timeline-day-cell";
        return (
          <div key={iso} className={cellClass} style={{ width: `${pxPerDay}px` }}>
            <span className="day-name">{formatDayName(day)}</span>
            <span className="day-number">{formatDayNumber(day)}</span>
          </div>
        );
      })}
    </div>
  );
}

function DayColumns({ days, pxPerDay }) {
  return (
    <div className="day-columns" aria-hidden="true">
      {days.map((day) => {
        const iso = formatIsoDay(day);
        const isWeekend = isWeekendDay(day);
        const columnClass = isWeekend ? "day-column weekend" : "day-column";
        return <div key={iso} className={columnClass} style={{ width: `${pxPerDay}px` }} />;
      })}
    </div>
  );
}

function Lane({
  itemsInLane,
  laneIndex,
  startDate,
  pxPerDay,
  onBeginInteraction,
  onStartEditing,
  onCancelEdit,
  onCommitEdit,
  activeInteraction,
  editingId,
}) {
  return (
    <div className="lane" role="listitem" aria-label={`Lane ${laneIndex + 1}`}>
      {itemsInLane.map((entry, index) => {
        const itemId = entry.itemId;
        const key = itemId != null ? itemId : `${laneIndex}-${index}`;
        return (
          <TimelineItem
            key={key}
            layout={entry}
            itemId={itemId}
            startDate={startDate}
            pxPerDay={pxPerDay}
            onBeginInteraction={onBeginInteraction}
            onStartEditing={onStartEditing}
            onCancelEdit={onCancelEdit}
            onCommitEdit={onCommitEdit}
            isEditing={editingId === itemId}
            isActive={activeInteraction != null && activeInteraction.id === itemId}
            activeType={activeInteraction != null && activeInteraction.id === itemId ? activeInteraction.type : null}
          />
        );
      })}
    </div>
  );
}

function TimelineItem({
  layout,
  itemId,
  startDate,
  pxPerDay,
  onBeginInteraction,
  onStartEditing,
  onCancelEdit,
  onCommitEdit,
  isEditing,
  isActive,
  activeType,
}) {
  const { item, startDate: itemStart, endDate: itemEnd, displayWidthPx, requiresTooltip } = layout;
  const left = leftForDate(itemStart, startDate, pxPerDay);
  const width = displayWidthPx;
  const stageKey = typeof item.stage === "string" ? item.stage.trim().toLowerCase() : "";
  const palette = STAGE_STYLES[stageKey] || STAGE_STYLES.default;
  const parsedRelease = item.release ? toUtcDate(item.release) : null;
  const releaseDate = parsedRelease && !Number.isNaN(parsedRelease.getTime()) ? parsedRelease : itemEnd;
  const stageLabel = stageKey ? item.stage.trim().toUpperCase() : "";
  const releaseLabel = formatNumericDate(releaseDate);
  const metaLabel = [stageLabel, releaseLabel].filter(Boolean).join(" • ");
  const titleParts = [item.name || UNTITLED_LABEL];
  if (stageLabel) {
    titleParts.push(stageLabel);
  }
  if (releaseLabel) {
    titleParts.push(releaseLabel);
  }
  const title = titleParts.join(" - ");
  const itemClasses = ["timeline-item"];
  if (isActive) {
    itemClasses.push("is-active");
  }
  if (activeType === DRAG_TYPES.MOVE) {
    itemClasses.push("is-dragging");
  }
  if (activeType === DRAG_TYPES.RESIZE_START || activeType === DRAG_TYPES.RESIZE_END) {
    itemClasses.push("is-resizing");
  }
  if (isEditing) {
    itemClasses.push("is-editing");
  }
  if (requiresTooltip) {
    itemClasses.push("needs-tooltip");
  }

  const [draftName, setDraftName] = useState(item.name || "");
  const inputRef = useRef(null);
  const cancelEditRef = useRef(false);

  useEffect(() => {
    if (isEditing) {
      setDraftName(item.name || "");
      cancelEditRef.current = false;
    }
  }, [isEditing, item.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBodyPointerDown = useCallback(
    (event) => {
      if (isEditing) {
        return;
      }
      onBeginInteraction(event, layout, DRAG_TYPES.MOVE);
    },
    [isEditing, layout, onBeginInteraction]
  );

  const handleResizeStartPointerDown = useCallback(
    (event) => {
      if (isEditing) {
        return;
      }
      onBeginInteraction(event, layout, DRAG_TYPES.RESIZE_START);
    },
    [isEditing, layout, onBeginInteraction]
  );

  const handleResizeEndPointerDown = useCallback(
    (event) => {
      if (isEditing) {
        return;
      }
      onBeginInteraction(event, layout, DRAG_TYPES.RESIZE_END);
    },
    [isEditing, layout, onBeginInteraction]
  );

  const handleDoubleClick = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (itemId == null) {
        return;
      }
      onStartEditing(itemId);
    },
    [itemId, onStartEditing]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (isEditing) {
        return;
      }
      if (itemId == null) {
        return;
      }
      if (event.key === "Enter" || event.key === "F2") {
        event.preventDefault();
        onStartEditing(itemId);
      }
    },
    [isEditing, itemId, onStartEditing]
  );

  const handleInputChange = useCallback((event) => {
    setDraftName(event.target.value);
  }, []);

  const handleInputKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        if (itemId != null) {
          onCommitEdit(itemId, draftName);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancelEditRef.current = true;
        setDraftName(item.name || "");
        onCancelEdit();
      }
    },
    [draftName, item.name, itemId, onCancelEdit, onCommitEdit]
  );

  const handleInputBlur = useCallback(() => {
    if (cancelEditRef.current) {
      cancelEditRef.current = false;
      return;
    }
    if (itemId != null) {
      onCommitEdit(itemId, draftName);
    }
  }, [draftName, itemId, onCommitEdit]);

  return (
    <div
      className={itemClasses.join(" ")}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        background: palette.background,
        boxShadow: `0 12px 22px ${palette.shadow}`,
      }}
      tabIndex={0}
      role="group"
      aria-label={title}
      title={title}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="resize-handle handle-start"
        onPointerDown={handleResizeStartPointerDown}
        aria-label="Adjust start date"
      />
      <div className="item-body" onPointerDown={handleBodyPointerDown}>
        {isEditing ? (
          <input
            ref={inputRef}
            className="item-input"
            value={draftName}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            aria-label="Edit item name"
          />
        ) : (
          <div className="item-inner">
            <span className="item-name">{item.name || UNTITLED_LABEL}</span>
            {metaLabel ? <span className="item-meta">{metaLabel}</span> : null}
          </div>
        )}
      </div>
      <button
        type="button"
        className="resize-handle handle-end"
        onPointerDown={handleResizeEndPointerDown}
        aria-label="Adjust end date"
      />
    </div>
  );
}

function TodayMarker({ left, label }) {
  return (
    <div
      className="today-marker"
      style={{ left: `${left}px` }}
      role="img"
      aria-label={`Today ${label}`}
      title={`Today ${label}`}
    >
      <span className="today-badge">Today</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="timeline-empty" role="status" aria-live="polite">
      <h2 className="empty-title">No launches scheduled</h2>
      <p className="empty-body">Add a roadmap record to see it on the timeline.</p>
    </div>
  );
}

export default Timeline;
