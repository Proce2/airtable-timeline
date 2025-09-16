import React, { useMemo, useState } from "react";
import assignLanes from "./assignLanes.js";
import { DEFAULT_ZOOM_STEPS, getDateRange, getItemBox, formatIsoDay, toUtcDate } from "./timelineUtils.js";
import "./timeline.css";

/**
 * Timeline component
 * Renders items in non-overlapping lanes with date-based positioning.
 */
function Timeline({ items }) {
  const [pxPerDay, setPxPerDay] = useState(DEFAULT_ZOOM_STEPS[2]);

  const { lanes, startDate, totalDays } = useMemo(() => {
    const range = getDateRange(items);
    const lanesCalc = assignLanes(items);
    return { lanes: lanesCalc, startDate: range.startDate, totalDays: range.totalDays };
  }, [items]);

  const contentWidth = Math.max(1, totalDays * pxPerDay);

  return (
    <div className="timeline" aria-label="Project timeline">
      <Controls pxPerDay={pxPerDay} setPxPerDay={setPxPerDay} />
      <div className="timeline-scroller" role="region" aria-label="Timeline scroller">
        <div className="timeline-content" style={{ width: `${contentWidth}px` }}>
          <Ruler startDate={startDate} totalDays={totalDays} pxPerDay={pxPerDay} />
          <div className="lanes" role="list" aria-label="Timeline lanes">
            {lanes.map((laneItems, i) => (
              <Lane
                key={i}
                laneIndex={i}
                itemsInLane={laneItems}
                startDate={startDate}
                pxPerDay={pxPerDay}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Controls({ pxPerDay, setPxPerDay }) {
  return (
    <div className="timeline-controls">
      <label className="zoom-label">
        Zoom
        <select
          className="zoom-select"
          value={pxPerDay}
          onChange={(e) => setPxPerDay(Number(e.target.value))}
          aria-label="Zoom level"
        >
          {DEFAULT_ZOOM_STEPS.map((v) => (
            <option key={v} value={v}>{v} px/day</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function Ruler({ startDate, totalDays, pxPerDay }) {
  const ticks = [];
  for (let i = 0; i < totalDays; i += 7) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const left = i * pxPerDay;
    ticks.push({ left, label: formatIsoDay(date) });
  }
  return (
    <div className="ruler" aria-hidden="true">
      {ticks.map((t) => (
        <div key={t.left} className="tick" style={{ left: `${t.left}px` }}>
          <span className="tick-label">{t.label}</span>
        </div>
      ))}
      <div className="ruler-line" />
    </div>
  );
}

function Lane({ itemsInLane, laneIndex, startDate, pxPerDay }) {
  return (
    <div className="lane" role="listitem" aria-label={`Lane ${laneIndex + 1}`}>
      {itemsInLane.map((item) => {
        const { left, width } = getItemBox(item, startDate, pxPerDay);
        const title = `${item.name} (${item.start} → ${item.end})`;
        const hue = (item.id * 47) % 360;
        return (
          <div
            key={item.id}
            className="timeline-item"
            style={{ left: `${left}px`, width: `${width}px`, backgroundColor: `hsl(${hue} 70% 55%)` }}
            tabIndex={0}
            role="button"
            aria-label={title}
            title={title}
          >
            <span className="item-label">{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;

