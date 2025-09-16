import React from "react";
import ReactDOM from "react-dom/client";
import timelineItems from "./timelineItems.js";
import Timeline from "./Timeline.js";

function App() {
  return (
    <main className="app-shell">
      <Timeline items={timelineItems} />
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
