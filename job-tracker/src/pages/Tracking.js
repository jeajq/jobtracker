// src/pages/Tracking.js
import React from "react";

export default function Tracking() {
  const items = [
    { id: "a1", title: "Frontend @ Acme", status: "Applied" },
    { id: "a2", title: "Backend @ Globex", status: "Interview" },
  ];

  return (
    <div>
      <h2>Tracking</h2>
      <ul>
        {items.map(x => (
          <li key={x.id}>
            <strong>{x.title}</strong> — {x.status}
          </li>
        ))}
      </ul>
      <p style={{ opacity: 0.7 }}>Placeholder while UI is designed.</p>
    </div>
  );
}
