// src/components/JobCard.jsx
import React from "react";

export default function JobCard({ data, onDragStart }) {
  return (
    <div
      className="jt-card"
      draggable
      onDragStart={onDragStart}
      role="listitem"
      title="Drag to move"
    >
      <div className="jt-card-top">
        <div className="jt-card-title">{data.title || "Job Title"}</div>
        <span className={`jt-dot ${data.statusDot || "blue"}`} />
      </div>

      <div className="jt-card-main">
        <div className="jt-field">
          <span>{data.company || "Company"}</span>
          <span>{data.type || "Job Type"}</span>
        </div>
        <div className="jt-muted">{data.description || "Description"}</div>
        <div className="jt-date">Date Applied: {data.dateApplied || "00/00/0000"}</div>
      </div>

      <div className="jt-card-footer">⋯</div>
    </div>
  );
}