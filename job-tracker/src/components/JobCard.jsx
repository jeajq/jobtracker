import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
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

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const content = contentRef.current;
    if (!panel || !content) return;
    if (open) {
      panel.style.maxHeight = `${content.scrollHeight + 2}px`;
    } else {
      panel.style.maxHeight = "0px";
    }
  }, [open, job]);

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

  async function handleSaveNote() {
    const trimmed = note.trim();
    await updateDoc(doc(db, "jobs", job.id), {
      note: trimmed,
      updatedAt: serverTimestamp(),
    });
    onAddNote?.(job.id, trimmed);
    setIsAddingNote(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${job.title}"?`)) return;
    await deleteDoc(doc(db, "jobs", job.id));
    onDelete?.(job.id);
  }

  const statusDotClass =
    job.status === "assessment" ? "purple" :
    job.status === "interview"  ? "green"  :
    job.status === "offer"      ? "pink"   :
    job.status === "rejected"   ? "red"    :
                                  "blue";

  const detailsId = `card-details-${job.id}`;

  return (
    <div className="jt-card" draggable onDragStart={(e) => onDragStart?.(e)}>
      {/* Header (title + 3 dots) */}
      <div className="jt-card-top">
        <div className="jt-card-title">{job.title || "Untitled role"}</div>
        <button
          type="button"
          className="jt-kebab"
          aria-expanded={open}
          aria-controls={detailsId}
          title={open ? "Hide details" : "Show details"}
          onClick={() => setOpen(v => !v)}
        >
          ⋯
        </button>
      </div>

      {/* Company / status / type */}
      <div className="jt-field">
        <span className="jt-muted">{job.company || "—"}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className={`jt-dot ${statusDotClass}`} />
          <span className="jt-muted">{job.employmentType || job.type || "—"}</span>
        </div>
      </div>

      <div className="jt-date">Date Applied: {job.dateApplied || "—"}</div>

      {job.note && !isAddingNote && (
        <div className="jt-note">📝 <span>{job.note}</span></div>
      )}

      {isAddingNote ? (
        <div className="jt-note-edit">
          <textarea
            ref={noteRef}
            placeholder="Add a quick note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="jt-note-actions">
            <button className="jt-primary" onClick={handleSaveNote}>Save</button>
            <button className="jt-ghost" onClick={() => setIsAddingNote(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="jt-card-footer">
          <button className="jt-pill" onClick={() => { setNote(job.note || ""); setIsAddingNote(true); }}>
            Add Note
          </button>
          <button className="jt-pill jt-btn-red" onClick={handleDelete}>Delete</button>
        </div>
      )}

      {/* Inline details block under the card */}
      <div
        id={detailsId}
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