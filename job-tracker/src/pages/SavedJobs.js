// src/pages/SavedJobs.js
import React from "react";

export default function SavedJobs() {
  const saved = [
    { id: "s1", title: "Full-stack @ Initech", company: "Initech" },
    { id: "s2", title: "Mobile Dev @ Hooli", company: "Hooli" },
  ];

  return (
    <div>
      <h2>Saved Jobs</h2>
      <ul>
        {saved.map(j => (
          <li key={j.id}>
            <strong>{j.title}</strong> — {j.company}
          </li>
        ))}
      </ul>
    </div>
  );
}
