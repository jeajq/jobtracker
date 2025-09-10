import React, { useState, useRef } from "react";
import "./column.css";

export default function Card() {
  const numColumns = 4; 

  const initialCols = Array.from({ length: numColumns }, (_, i) => ({
    id: `c${i + 1}`,
    label: `Column ${i + 1}`,
  }));

  const [cols, setCols] = useState(initialCols);

  const dragIndex = useRef(null);

  function handleDragStart(e, index) {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", cols[index].id); 
  }

  function handleDragOver(e) {
    e.preventDefault(); 
  }

  function handleDrop(e, index) {
    e.preventDefault();

    const from = dragIndex.current;
    const to = index;
    if (from === null || to === null || from === to) return;

    setCols(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

    dragIndex.current = null;
  }

  return (
    <div className="columns-container">
      {cols.map((col, i) => (
        <div
          key={col.id}
          className="column"
          draggable
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, i)}
        >
          {col.label}
          <div className="drag-hint">Drag to reorder</div>
        </div>
      ))}
    </div>
  );
}