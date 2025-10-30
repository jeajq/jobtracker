import React, { useState, useRef, useEffect } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function JobCard({ job, onDelete, onAddNote, onDragStart }) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [note, setNote] = useState(job?.note || "");

  const noteRef = useRef(null);

  useEffect(() => {
    if (isAddingNote && noteRef.current) {
      const el = noteRef.current;
      el.focus();
      // place caret at the end of the existing text
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [isAddingNote]);

  if (!job) {
    console.warn("⚠️ JobCard rendered without job data");
    return null;
  }

  async function handleSaveNote() {
    const trimmed = note.trim();
    const ref = doc(db, "jobs", job.id);

    await updateDoc(ref, {
      note: trimmed,
      updatedAt: new Date(),
    });

    if (onAddNote) onAddNote(job.id, trimmed);
    setIsAddingNote(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${job.title}"?`)) return;
    const ref = doc(db, "jobs", job.id);
    await deleteDoc(ref);
    if (onDelete) onDelete(job.id);
  }

  const statusDotClass = (() => {
    switch (job.status) {
      case "applied": return "blue";
      case "assessment": return "purple";
      case "interview": return "green";
      case "offer": return "pink";
      case "rejected": return "red";
      default: return "blue";
    }
  })();

  return (
    <div className="jt-card" draggable onDragStart={onDragStart}>
      {/* header row */}
      <div className="jt-card-top">
        <div className="jt-card-title">{job.title || "Untitled role"}</div>
        <div className={`jt-dot ${statusDotClass}`} />
      </div>

      {/* company + type */}
      <div className="jt-field">
        <span className="jt-muted">{job.company || "—"}</span>
        <span className="jt-muted">{job.employmentType || job.type || "—"}</span>
      </div>

      {/* description */}
      {job.description && (
        <div className="jt-description">{job.description}</div>
      )}

      {/* date applied */}
      <div className="jt-date">
        Date Applied: {job.dateApplied || "—"}
      </div>

      {/* existing note display */}
      {job.note && !isAddingNote && (
        <div className="jt-note">
          📝 <span>{job.note}</span>
        </div>
      )}

      {/* edit mode */}
      {isAddingNote ? (
        <div className="jt-note-edit">
          <textarea
            ref={noteRef}
            placeholder="Add a quick note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="jt-note-actions">
            <button className="jt-primary" onClick={handleSaveNote}>
              Save
            </button>
            <button
              className="jt-ghost"
              onClick={() => setIsAddingNote(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="jt-card-footer">
          <button
            className="jt-pill"
            onClick={() => {
              setNote(job.note || "");  
              setIsAddingNote(true);     
            }}
          >
            Add Note
          </button>
          <button className="jt-pill jt-btn-red" onClick={handleDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}