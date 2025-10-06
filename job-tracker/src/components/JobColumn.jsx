// src/components/JobColumn.jsx
import React from "react";
import JobCard from "./JobCard";

export default function JobColumn({
  id, title, cards, count,
  onDragStart, onDropBefore, onDropEnd
}) {
  return (
    <div
      className="jt-column"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDropEnd(e)}
    >
      <div className="jt-col-head">
        <div className="jt-col-title">
          {title} <span className="jt-badge">#{count}</span>
        </div>
      </div>

      <div className="jt-cards" role="list">
        {cards.map((card, idx) => (
          <React.Fragment key={card.id}>
            <div className="jt-drop" onDrop={(e) => onDropBefore(idx, e)} />
            <JobCard data={card} onDragStart={(e) => onDragStart(id, idx, e)} />
          </React.Fragment>
        ))}
        <div className="jt-drop" onDrop={onDropEnd} />
      </div>
    </div>
  );
}