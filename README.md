# Airtable Timeline Component

A React-based timeline visualization component inspired by Airtable's timeline view, designed for displaying project tasks in horizontal lanes with efficient space utilization.

## 🎯 Overview

This timeline component arranges items in horizontal lanes using a compact, space-efficient layout where items that don't overlap in time can share the same lane. The implementation focuses on clean, readable code and an intuitive user experience.

## ✨ Features

### Core Functionality
- **Horizontal lane layout** with automatic lane assignment based on date overlaps
- **Date-based positioning** using YYYY-MM-DD format
- **Compact space utilization** - non-overlapping items share lanes automatically
- **Responsive design** with proper scaling and positioning

### Interactive Enhancements
- **🔍 Zoom functionality** - Zoom in/out from 50% to 300% with smooth scaling
- **🖱️ Drag & drop** - Click and drag items to change their start/end dates
- **✏️ Inline editing** - Click item names to edit them directly
- **🌙 Dark/light mode** - Toggle between themes with smooth transitions

### User Experience
- **Visual feedback** during drag operations and hover states
- **Reset functionality** to restore original data and zoom levels
- **Keyboard shortcuts** - Enter to save, Escape to cancel during editing
- **Professional styling** with smooth animations and transitions

## 🎨 Design Inspiration

This implementation was inspired by **Airtable's timeline view**, which provides an excellent example of:
- Clean horizontal timeline visualization
- Efficient lane-based organization of overlapping tasks
- Intuitive date-based positioning and scaling
- Professional user interface design patterns

The goal was to recreate the core functionality and user experience of Airtable's timeline while building it from scratch using React and vanilla JavaScript.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation & Running

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd airtable-timeline
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser** to view the timeline (typically `http://localhost:1234`)

## 📊 Data Structure

The timeline works with simple data objects containing:

```javascript
{
  id: 1,                      // Unique identifier
  start: "2021-01-14",       // Start date (YYYY-MM-DD)
  end: "2021-01-22",         // End date (YYYY-MM-DD)
  name: "Recruit translators" // Task name
}
```

Sample data includes 16 lesson planning tasks spanning January to May 2021, representing a typical educational project timeline.

## 🏗️ Architecture

### Component Structure
- **Timeline Component** (`src/index.js`) - Main React component with state management
- **Lane Assignment Algorithm** (`src/assignLanes.js`) - Efficient O(n²) algorithm for organizing items into lanes
- **Timeline Data** (`src/timelineItems.js`) - Sample dataset of project tasks
- **Styling** (`src/app.css`) - CSS with variables for theming and responsive design

### Key Design Decisions
- **React functional components** with hooks for clean, modern code
- **CSS variables** for consistent theming and easy dark/light mode switching
- **Absolute positioning** for precise timeline item placement
- **Modular architecture** with separated concerns for maintainability

## 🧪 Testing Approach

If given more time, testing would focus on:

### Unit Testing
- **Lane assignment algorithm** - Test edge cases, overlapping scenarios, and performance
- **Date calculations** - Verify positioning accuracy across different time ranges
- **State management** - Test drag & drop, editing, and zoom functionality

### Integration Testing
- **User interactions** - Drag & drop workflows, editing flows, zoom operations
- **Data persistence** - Ensure changes are properly reflected in the timeline
- **Browser compatibility** - Cross-browser testing for consistent behavior

### Performance Testing
- **Large datasets** - Test with 100+ timeline items
- **Memory usage** - Monitor for memory leaks during interactions
- **Rendering performance** - Maintain 60fps during animations and zoom

## 💡 What I Like About This Implementation

- **Clean, readable code** using modern React patterns and functional programming
- **Efficient lane assignment** that minimizes vertical space usage
- **Smooth user interactions** with immediate visual feedback
- **Professional appearance** matching modern web application standards
- **Comprehensive feature set** covering all assignment requirements plus enhancements

## 🔄 What I Would Change

- **Algorithm optimization** - Current O(n²) lane assignment could be optimized to O(n log n)
- **Virtual scrolling** - For handling large datasets (1000+ items) more efficiently
- **Touch gestures** - Add mobile-specific touch interactions for drag & drop
- **Keyboard navigation** - Full keyboard accessibility for timeline navigation
- **Undo/redo functionality** - History management for user actions
- **Export capabilities** - Allow exporting timeline data or images

## 🛠️ Technologies Used

- **React 18** - Modern functional components with hooks
- **Parcel** - Fast, zero-configuration build tool
- **Vanilla JavaScript** - Native Date API and DOM manipulation
- **CSS3** - Variables, transforms, and modern layout techniques
- **HTML5** - Drag & drop API for interactive functionality

## 📁 Project Structure

```
src/
├── index.js          # Main Timeline React component
├── assignLanes.js    # Lane assignment algorithm
├── timelineItems.js  # Sample timeline data
├── app.css          # Component styling with theming
└── index.html       # Application entry point
```

---

*Built as part of the Airtable timeline assignment - demonstrating clean code, intuitive UI design, and comprehensive feature implementation.*