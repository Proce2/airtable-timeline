# Airtable Timeline Exercise

## Running the project
1. Install dependencies: `npm install`
2. Start the dev server: `npm start`
3. Parcel will open `http://localhost:1234` with the interactive timeline.

## What I like about the current solution
- Horizontal timeline stays compact while honoring the "end < start" lane rule, so items never overlap.
- Inline drag, resize, and rename flows make the data feel tactile without leaving the timeline surface.
- Zoom controls, weekend shading, and a live today marker keep the schedule readable at different scales.

## What I would change next
- Persist edits (e.g., to local storage or an API) so changes survive reloads.
- Add keyboard affordances for moving and resizing items so the interactions are fully accessible.
- Introduce filtering/grouping to explore larger datasets without overwhelming the lanes.

## Design decisions & inspirations
- Lane assignment extends items by a few virtual days when labels need breathing room, mirroring Airtable's handling of long names while still avoiding overlaps.
- Drag/resize UX borrows from vis.js timeline conventions (dual handles, grab cursor) but implemented with vanilla pointer events per the no-third-party-timeline requirement.
- Palette, spacing, and typography reference Airtable's roadmap aesthetic from the provided inspiration image while respecting the repository's existing styling guidelines.

## How I would test with more time
- Unit test the lane assignment helper across edge cases (single-day items, invalid ranges, long labels).
- Component tests for the timeline to validate zooming, dragging, and editing flows via React Testing Library + Playwright.
- Performance profiling with large synthetic datasets (100+ items) to ensure scrolling and drag interactions remain smooth.
