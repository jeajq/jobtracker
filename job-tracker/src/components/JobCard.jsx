import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import "../components/jobBoard.css";

function safeHref(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
function hostOf(url) {
  try { return new URL(safeHref(url)).hostname; } catch { return ""; }
}

export default function JobCard({ job, onDelete, onAddNote, onDragStart }) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [note, setNote] = useState(job?.note || "");
  const noteRef = useRef(null);

  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const panelRef = useRef(null);

  // Expand/collapse animation
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const content = contentRef.current;
    if (!panel || !content) return;
    panel.style.maxHeight = open ? `${content.scrollHeight + 2}px` : "0px";
  }, [open, job]);

  // Focus textarea when adding note
  useEffect(() => {
    if (isAddingNote && noteRef.current) {
      const el = noteRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [isAddingNote]);

  if (!job) return null;

  const postingLink = job.sourceLink || job.url || "";

  return (
    <div className="jt-card" draggable onDragStart={(e) => onDragStart?.(e)}>
      {/* Header */}
      <div className="jt-card-top">
        <div className="jt-card-title">{job.title || "Untitled role"}</div>
        <button
          type="button"
          className="jt-kebab"
          aria-expanded={open}
          aria-controls={`card-details-${job.id}`}
          title={open ? "Hide details" : "Show details"}
          onClick={() => setOpen(v => !v)}
        >
          ⋯
        </button>
      </div>

      {/* Company / Status */}
      <div className="jt-field">
        <span className="jt-muted">{job.company || "—"}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className={`jt-dot ${
            job.status === "assessment" ? "purple" :
            job.status === "interview" ? "green" :
            job.status === "offer" ? "pink" :
            job.status === "rejected" ? "red" : "blue"
          }`} />
          <span className="jt-muted">{job.employmentType || job.type || "—"}</span>
        </div>
      </div>

      <div className="jt-date">Date Applied: {job.dateApplied || "—"}</div>

      {/* Display note */}
      {job.note && !isAddingNote && (
        <div className="jt-note">📝 <span>{job.note}</span></div>
      )}

      {/* Add/Edit note */}
      {isAddingNote ? (
        <div className="jt-note-edit">
          <textarea
            ref={noteRef}
            placeholder="Add a quick note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="jt-note-actions">
            <button
              className="jt-primary"
              onClick={() => {
                const trimmed = note.trim();
                onAddNote?.(job.id, trimmed); // <-- parent handles Firestore update
                setIsAddingNote(false);
              }}
            >
              Save
            </button>
            <button className="jt-ghost" onClick={() => setIsAddingNote(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="jt-card-footer">
          <button className="jt-pill" onClick={() => { setNote(job.note || ""); setIsAddingNote(true); }}>
            Add Note
          </button>
          <button
            className="jt-pill jt-btn-red"
            onClick={() => onDelete?.(job)}
          >
            Delete
          </button>
        </div>
      )}

      {/* Inline details */}
      <div
        id={`card-details-${job.id}`}
        ref={panelRef}
        className={`jt-card-detail-inline ${open ? "open" : ""}`}
        role="region"
        aria-hidden={!open}
      >
        <div ref={contentRef} className="jt-detail-wrap">
          <div className="jt-detail-head">
            <div className="jt-detail-title">{job.title || "Untitled role"}</div>
            <div className="jt-detail-sub">
              {job.company || "—"}{job.location ? ` • ${job.location}` : ""}
            </div>
          </div>

          <div className="jt-detail-meta">
            <div><span className="label">Status:</span> {job.status || "—"}</div>
            <div><span className="label">Role:</span> {job.role || job.type || "—"}</div>
            <div><span className="label">Posted:</span> {job.datePosted || "—"}</div>
            <div><span className="label">Saved:</span> {job.savedAt?.toDate?.()?.toLocaleDateString?.() || "—"}</div>
            <div className="span2">
              <span className="label">Source:</span>{" "}
              {postingLink ? (
                <a className="jt-link" href={safeHref(postingLink)} target="_blank" rel="noopener noreferrer">
                  {hostOf(postingLink)} ↗
                </a>
              ) : "—"}
            </div>
          </div>

          <div className="jt-detail-actions">
            {postingLink && (
              <a className="jt-pill" href={safeHref(postingLink)} target="_blank" rel="noopener noreferrer">
                View posting ↗
              </a>
            )}
            <button className="jt-btn-red" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
