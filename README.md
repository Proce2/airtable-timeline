# Airtable Timeline Component

A React timeline component inspired by Airtable, for visualizing tasks in horizontal lanes with drag & drop, zoom, and smooth scaling.

## Features
- Multi-lane horizontal timeline
- Drag & drop to move items
- Zoom in/out with smooth scaling
- Inline editing of item names
- Dark/light mode toggle
- Visual feedback when dragging

## What I Like About My Implementation
- The overall UI and user experience
- The clean, interactive look

## What I Would Change If I Did It Again
- Use a UI with a broader color palette and a more professional, polished structure and design 
- Focus even more on excellent user experience and professional UI design 

## Design Decisions & Inspiration
- Inspired by Airtable's timeline view for layout and interactions
- Focused on compact, readable code and a professional UI

## How I Would Test With More Time
- Use React Testing Library for unit and integration tests
- Add automated UI tests for accessibility and responsiveness
- Test with larger datasets and edge cases

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm start
   ```
3. Open in your browser (usually http://localhost:1234)

## Data Format
Each timeline item:
```js
{
  id: 1,
  start: "2021-01-14",
  end: "2021-01-22",
  name: "Recruit translators"
}
```

## Project Files
- `src/index.js` – Main component
- `src/assignLanes.js` – Lane assignment logic
- `src/timelineItems.js` – Sample data
- `src/app.css` – Styling

---
*Built for the Airtable timeline assignment.*