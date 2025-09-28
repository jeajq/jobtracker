// src/pages/JobSearch.js
import React, { useState } from "react";

export default function JobSearch() {
  const [q, setQ] = useState("");

  // mock results; wire to real APIs later
  const results = [
    { id: 1, title: "Frontend Engineer", company: "Acme", platform: "Seek", url: "#" },
    { id: 2, title: "Backend Engineer", company: "Globex", platform: "Indeed", url: "#" },
  ].filter(j => j.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h2>Job Search (Seek / Indeed)</h2>
      <div style={{ marginBottom: 12 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search title…"
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd", marginRight: 8 }}
        />
        <button>Search</button>
      </div>

      <ul>
        {results.map(r => (
          <li key={r.id}>
            <strong>{r.title}</strong> — {r.company} ({r.platform}){" "}
            <a href={r.url} target="_blank" rel="noreferrer">Open</a>
          </li>
        ))}
      </ul>
      <p style={{ opacity: 0.7 }}>UI/UX coming soon — endpoints to be wired.</p>
    </div>
  );
}
