// src/components/JobColumn.jsx
import React from "react";
import JobCard from "./JobCard";

export default function JobColumn({
  id,
  title,
  cards,
  count,
  onDragStart,
  onDropBefore,
  onDropEnd,
  onDelete,
  onAddNote,
}) {
  return (
    <div
      className="jt-column"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDropEnd(e)} // drop to END of this column
    >
      <div className="jt-col-head">
        <div className="jt-col-title">
          {title} <span className="jt-badge">#{count}</span>
        </div>
      </div>

      <div className="jt-cards" role="list">
        {cards
          .filter(Boolean) // ignore null/undefined entries
          .map((card, idx) => (
            <React.Fragment key={card.id}>
              {/* drop zone BEFORE this card */}
              <div
                className="jt-drop"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.stopPropagation(); // don't bubble to column onDrop
                  onDropBefore(idx, e);
                }}
              />

              <JobCard
                job={card}
                onDragStart={(e) => onDragStart(id, idx, e)}
                onDelete={(jobId) => onDelete(jobId)}
                onAddNote={(jobId, noteText) => onAddNote(jobId, noteText)}
              />
            </React.Fragment>
          ))}

        {/* final drop zone for dropping to END of column */}
        <div
          className="jt-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropEnd}
        />
      </div>
    </div>
  );
}