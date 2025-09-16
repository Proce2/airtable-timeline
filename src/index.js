import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import timelineItems from "./timelineItems.js";
import assignLanes from "./assignLanes.js";

function Timeline() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [items, setItems] = useState(timelineItems);
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [highlightedDayIdx, setHighlightedDayIdx] = useState(null);
  
  // Test the assignLanes function
  const lanes = assignLanes(items);
  
  // Calculate date range for timeline scale with padding
  const allDates = items.flatMap(item => [item.start, item.end]);
  const originalMinDate = new Date(Math.min(...allDates.map(date => new Date(date))));
  const originalMaxDate = new Date(Math.max(...allDates.map(date => new Date(date))));
  
  // Add padding to ensure items don't get cut off
  const minDate = new Date(originalMinDate);
  minDate.setDate(minDate.getDate() - 5); // 5 days padding before
  
  const maxDate = new Date(originalMaxDate);
  maxDate.setDate(maxDate.getDate() + 5); // 5 days padding after
  
  const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  
  // Generate clean month intervals for the top scale
  const generateMonthIntervals = () => {
    const intervals = [];
    const currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    
    while (currentDate <= maxDate) {
      const month = currentDate.toLocaleDateString('en-US', { month: 'short' });
      const year = currentDate.getFullYear();
      
      const daysFromStart = (currentDate - minDate) / (1000 * 60 * 60 * 24);
      const leftPercent = Math.max(0, (daysFromStart / totalDays) * 100);
      
      intervals.push({
        month,
        year,
        leftPercent
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return intervals;
  };
  
  const monthIntervals = generateMonthIntervals();
  
  // Generate day intervals for detailed scale
  const generateDayIntervals = () => {
    const dayIntervals = [];
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      const day = currentDate.getDate();
      const daysFromStart = (currentDate - minDate) / (1000 * 60 * 60 * 24);
      const leftPercent = (daysFromStart / totalDays) * 100;
      const dayOfWeek = currentDate.getDay();
      dayIntervals.push({
        day,
        leftPercent,
        isFirstOfMonth: day === 1,
        dayOfWeek
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dayIntervals;
  };
  
  const dayIntervals = generateDayIntervals();
  
  // Function to calculate item position and width based on dates
  const calculateItemStyle = (item) => {
    const startDate = new Date(item.start);
    const endDate = new Date(item.end);
    const daysFromStart = (startDate - minDate) / (1000 * 60 * 60 * 24);
    const itemDuration = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

    // Increase rightward nudge even more for left edge alignment
    const widthPercent = (itemDuration / totalDays) * 100;
    const leftPercent = ((daysFromStart + 0.7) / totalDays) * 100;
    const adjustedWidthPercent = Math.max(1, widthPercent);

    return {
      position: 'absolute',
      left: `${leftPercent}%`,
      width: `${adjustedWidthPercent}%`,
      minWidth: '100px',
      cursor: 'grab',
      boxSizing: 'border-box'
    };
  };
  
  // Drag and drop handlers
  const handleDragStart = (e, item) => {
  setDraggedItem(item);
  setHighlightedDayIdx(null);
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.cursor = 'grabbing';
  };
  
  const handleDragEnd = (e) => {
  setDraggedItem(null);
  setHighlightedDayIdx(null);
  e.target.style.cursor = 'grab';
  };
  
  const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  // Calculate which day is under the drag position (matches drop target)
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const laneWidth = rect.width;
  const dropPercent = (x / laneWidth) * 100;
  let dayIdx = Math.round((dropPercent / 100) * totalDays);
  dayIdx = Math.max(0, Math.min(dayIntervals.length - 1, dayIdx));
  setHighlightedDayIdx(dayIdx);
  };
  
  const handleDrop = (e, laneItems) => {
  e.preventDefault();
  if (!draggedItem) return;

  // Use highlightedDayIdx - 1 for drop to fix off-by-one error
  const newStartDay = highlightedDayIdx !== null ? highlightedDayIdx - 1 : 0;
  const newStartDate = new Date(minDate);
  newStartDate.setDate(newStartDate.getDate() + newStartDay);
  setHighlightedDayIdx(null);

    // Keep duration the same
    const originalStart = new Date(draggedItem.start);
    const originalEnd = new Date(draggedItem.end);
    const duration = (originalEnd - originalStart) / (1000 * 60 * 60 * 24);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + duration);

    // Format dates as YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Update the item
    const updatedItems = items.map(item => 
      item.id === draggedItem.id 
        ? { ...item, start: formatDate(newStartDate), end: formatDate(newEndDate) }
        : item
    );
  setItems(updatedItems);
  setDraggedItem(null);
  // Recalculate lanes after drag
  // This will happen automatically on next render since lanes is derived from items
  };
  
  // Inline editing handlers
  const handleNameClick = (e, item) => {
    // Don't start editing if we're dragging
    if (draggedItem) return;
    e.stopPropagation();
    setEditingItem(item.id);
    setEditingName(item.name);
  };
  
  const handleNameChange = (e) => {
    setEditingName(e.target.value);
  };
  
  const handleNameSubmit = () => {
    if (editingName.trim()) {
      const updatedItems = items.map(item => 
        item.id === editingItem 
          ? { ...item, name: editingName.trim() }
          : item
      );
      setItems(updatedItems);
    }
    setEditingItem(null);
    setEditingName("");
  };
  
  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditingItem(null);
      setEditingName("");
    }
  };
  
  return (
  <div className={darkMode ? 'dark-mode' : 'light-mode'}>
    <h2 style={{marginLeft: '24px'}}>Airtable Timeline Component</h2>
    {/* Controls Section */}
    <div className="controls">
      <button 
        onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
        disabled={zoomLevel <= 0.5}
      >
        Zoom Out
      </button>
      <button 
        onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
        disabled={zoomLevel >= 3}
      >
        Zoom In
      </button>
      <button onClick={() => setZoomLevel(1)}>
        Reset Zoom
      </button>
      <button onClick={() => setItems(timelineItems)}>
        Reset Data
      </button>
      <button onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>
      <div className="zoom-info">Zoom: {(zoomLevel * 100).toFixed(0)}%</div>
      {draggedItem && <div className="drag-info">Dragging: {draggedItem.name}</div>}
    </div>
    <div className="timeline-wrapper">
      <div className="timeline-container" style={{ 
  width: `${Math.max(1500, totalDays * 30 * zoomLevel)}px`,
  fontSize: `${14 * zoomLevel}px`,
  ['--zoom']: zoomLevel
      }}>
        {/* Interval Scale at the Top */}
        <div className="interval-header">
          <div className="month-row">
            {monthIntervals.map((interval, index) => (
              <div 
                key={index}
                className="interval-marker month-marker"
                style={{ left: `${interval.leftPercent}%` }}
              >
                {interval.month} {interval.year}
              </div>
            ))}
          </div>
          <div className="day-row">
            {dayIntervals.map((dayInterval, index) => (
              <div 
                key={index}
                className={`day-marker${dayInterval.isFirstOfMonth ? ' first-of-month' : ''}${highlightedDayIdx === index ? ' highlighted' : ''}`}
                style={{ left: `${dayInterval.leftPercent}%` }}
              >
                <div className="day-number">{dayInterval.day}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Multi-lane rendering, no labels */}
        {lanes.map((laneItems, laneIdx) => (
          <div className="timeline-lane" key={laneIdx}>
            <div className="lane-items"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, laneItems)}
            >
              {laneItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`timeline-item ${draggedItem?.id === item.id ? 'dragging' : ''}`}
                  style={calculateItemStyle(item)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                >
                  {editingItem === item.id ? (
                    <input
                      className="item-name-input"
                      value={editingName}
                      onChange={handleNameChange}
                      onBlur={handleNameSubmit}
                      onKeyDown={handleNameKeyDown}
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="item-name"
                      onClick={(e) => handleNameClick(e, item)}
                      title="Click to edit"
                    >
                      {item.name}
                    </span>
                  )}
                  <span className="item-dates">{item.start} to {item.end}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Timeline />);