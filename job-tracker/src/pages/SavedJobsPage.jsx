import React, { useEffect, useState } from "react";
import "../components/job-tracker.css";
import Sidebar from "../components/sidebar";
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function SavedJobsPage({ user }) {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    //query the saved_jobs subcollection for the current user
    const savedRef = collection(db, "users", user.uid, "saved_jobs");
    const q = query(savedRef, orderBy("savedAt", "desc"));

    const off = onSnapshot(q, (snap) => {
      setSaved(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => off();
  }, [user]);

  async function removeSaved(id) {
    if (!user?.uid) return;

    await deleteDoc(doc(db, "users", user.uid, "saved_jobs", id));
  }

  return (
    <div className="jt-app">
      <aside className="jt-sidebar">
        <div className="jt-logo">job.tracker</div>
        <nav className="jt-nav">
          <a className="jt-nav-item active" href="#board">
            <span>Job Board</span>
          </a>
          <a className="jt-nav-item" href="#search">
            <span>Job Search</span>
          </a>
          <a className="jt-nav-item" href="#saved">
            <span>Saved Jobs</span>
          </a>
          {user?.type === "employer" && (
            <a className="jt-nav-item" href="#employer-jobs">
              <span>View Added Jobs</span>
            </a>
          )}
        </nav>
        <div className="jt-logout">Log Out ⟶</div>
      </aside>

      <main className="jt-main">
        <header className="jt-topbar">
          <input className="jt-search" placeholder="Search jobs..." />
        </header>

        <section className="jt-results scrollable">
          {saved.length === 0 ? (
            <div className="jt-empty-center">
              <div>nothing here!</div>
              <button
                className="jt-primary"
                onClick={() => (window.location.hash = "#search")}
              >
                return
              </button>
            </div>
          ) : (
            <>
              <div className="jt-results-head">Saved Jobs ({saved.length})</div>
              <ul className="jt-list">
                {saved.map((job) => (
                  <li className="jt-list-item" key={job.id}>
                    <div className="jt-list-main">
                      <div className="jt-line">
                        <span className="jt-jobtitle">{job.title || "Job Title"}</span>
                        <span className="jt-dash">—</span>
                        <span className="jt-company">{job.company || "Company"}</span>
                      </div>
                      <div className="jt-role">{job.role || "Role"}</div>
                      <div className="jt-desc">{job.description || "description"}</div>
                    </div>
                    <div className="jt-meta">
                      <span className="jt-date">
                        date posted: {job.datePosted || "00/00/0000"}
                      </span>
                      <div className="jt-actions">
                        <button
                          className="jt-btn-apply"
                          onClick={() => window.open(job.url, "_blank")}
                        >
                          Apply
                        </button>
                        <button
                          className="jt-btn-remove"
                          title="Remove"
                          onClick={() => removeSaved(job.id)}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
