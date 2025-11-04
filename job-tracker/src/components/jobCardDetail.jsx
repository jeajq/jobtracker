import React from "react";

function safeHref(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function JobDetailCard({ job, onClose }) {
  const postingLink = job.sourceLink || job.url || "";

  return (
    <div className="jt-popover-card">
      <div className="jt-popover-head">
        <div className="jt-job-title">{job.title || "Untitled role"}</div>
        <button className="jt-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="jt-job-sub">{job.company || "—"}{job.location ? ` • ${job.location}` : ""}</div>

      <div className="jt-job-meta small">
        <div><span className="label">Status:</span> {job.status || "—"}</div>
        <div><span className="label">Role:</span> {job.role || job.type || "—"}</div>
        <div><span className="label">Posted:</span> {job.datePosted || "—"}</div>
        <div className="span2">
          <span className="label">Source:</span> {postingLink ? (
            <a className="jt-link" href={safeHref(postingLink)} target="_blank" rel="noopener noreferrer">
              {new URL(safeHref(postingLink)).hostname} ↗
            </a>
          ) : "—"}
        </div>
      </div>

      <div className="jt-job-desc small">
        {(job.description || "").trim() || "No description provided."}
      </div>

      <div className="jt-popover-actions">
        {postingLink && (
          <a className="jt-pill" href={safeHref(postingLink)} target="_blank" rel="noopener noreferrer">
            View Posting ↗
          </a>
        )}
        <button className="jt-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}