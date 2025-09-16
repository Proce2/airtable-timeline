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
  
  // Test the assignLanes function
  const lanes = assignLanes(items);
  
  // Calculate date range for timeline scale
  const allDates = items.flatMap(item => [item.start, item.end]);
  const minDate = new Date(Math.min(...allDates.map(date => new Date(date))));
  const maxDate = new Date(Math.max(...allDates.map(date => new Date(date))));
  const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  
  // Generate date markers for the timeline scale
  const generateDateMarkers = () => {
    const markers = [];
    const currentDate = new Date(minDate);
    
    while (currentDate <= maxDate) {
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      const day = currentDate.getDate();
      const month = currentDate.toLocaleDateString('en-US', { month: 'short' });
      const year = currentDate.getFullYear();
      
      const daysFromStart = (currentDate - minDate) / (1000 * 60 * 60 * 24);
      const leftPercent = (daysFromStart / totalDays) * 100;
      
      markers.push({
        date: new Date(currentDate),
        dayOfWeek,
        day,
        month,
        year,
        leftPercent,
        isFirstOfMonth: day === 1,
        isMonday: dayOfWeek === 'Mon'
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return markers;
  };
  
  const dateMarkers = generateDateMarkers();
  
  // Function to calculate item position and width
  const calculateItemStyle = (item) => {
    const startDate = new Date(item.start);
    const endDate = new Date(item.end);
    const daysFromStart = (startDate - minDate) / (1000 * 60 * 60 * 24);
    const itemDuration = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1; // +1 to include end day
    
    const leftPercent = (daysFromStart / totalDays) * 100;
    const widthPercent = (itemDuration / totalDays) * 100;
    
    return {
      position: 'absolute',
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      minWidth: '60px', // Ensure text is readable
      cursor: 'grab'
    };
  };
  
  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.cursor = 'grabbing';
  };
  
  const handleDragEnd = (e) => {
    setDraggedItem(null);
    e.target.style.cursor = 'grab';
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e, laneItems) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const laneWidth = rect.width;
    const dropPercent = (x / laneWidth) * 100;
    
    // Calculate new start date based on drop position
    const newStartDay = Math.round((dropPercent / 100) * totalDays);
    const newStartDate = new Date(minDate);
    newStartDate.setDate(newStartDate.getDate() + newStartDay);
    
    // Calculate duration to maintain item length
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
      <h2>Airtable Timeline Component</h2>
      <p>We have {items.length} items organized into {lanes.length} lanes</p>
      
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
      
      <div className="timeline-container" style={{ transform: `scaleX(${zoomLevel})`, transformOrigin: 'left' }}>
        {/* Timeline Header with detailed date scale */}
        <div className="timeline-header">
          <div className="lane-label-header">Timeline</div>
          <div className="timeline-scale-container">
            {/* Month/Year indicators */}
            <div className="timeline-months">
              {dateMarkers.filter(marker => marker.isFirstOfMonth).map((marker, index) => {
                const nextMonth = dateMarkers.find(m => m.isFirstOfMonth && m.date > marker.date);
                const monthWidth = nextMonth 
                  ? nextMonth.leftPercent - marker.leftPercent 
                  : 100 - marker.leftPercent;
                
                return (
                  <div 
                    key={index}
                    className="month-marker"
                    style={{
                      left: `${marker.leftPercent}%`,
                      width: `${monthWidth}%`
                    }}
                  >
                    {marker.month} {marker.year}
                  </div>
                );
              })}
            </div>
            
            {/* Day markers */}
            <div className="timeline-days">
              {dateMarkers.map((marker, index) => (
                <div 
                  key={index}
                  className={`day-marker ${marker.isMonday ? 'monday' : ''} ${marker.isFirstOfMonth ? 'first-of-month' : ''}`}
                  style={{ left: `${marker.leftPercent}%` }}
                >
                  <div className="day-number">{marker.day}</div>
                  <div className="day-name">{marker.dayOfWeek}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Timeline Lanes */}
        {lanes.map((lane, laneIndex) => (
          <div key={laneIndex} className="timeline-lane">
            <div className="lane-label">Lane {laneIndex + 1}</div>
            <div 
              className="lane-items"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, lane)}
            >
              {lane.map(item => (
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
  );
}

function App() {
  return (
    <div>
      <Timeline />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);