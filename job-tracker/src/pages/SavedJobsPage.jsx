import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import ApplyJobPopup from "./ApplyJobPopup";
import "../components/job-tracker.css";

export default function SavedJobsPage({ user, onLogout }) {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [popupJob, setPopupJob] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setSavedJobs([]);
      setLoading(false);
      return;
    }

    const savedRef = collection(db, "users", user.uid, "saved_jobs");
    const q = query(savedRef, orderBy("savedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobs = snapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }));
        setSavedJobs(jobs);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching saved jobs:", err);
        setSavedJobs([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  //remove job from saved_jobs and applied_jobs
  const removeJob = async (job) => {
    if (!job?.firestoreId || !user?.uid) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "saved_jobs", job.firestoreId));

      //delete from applied_jobs if exists (match by URL)
      const appliedSnapshot = await getDocs(
        collection(db, "users", user.uid, "applied_jobs")
      );
      const appliedDeletes = appliedSnapshot.docs
        .filter((d) => d.data().url === job.url)
        .map((d) => deleteDoc(doc(db, "users", user.uid, "applied_jobs", d.id)));

      await Promise.all(appliedDeletes);

      setToast("✅ Job removed successfully!");
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error("Error removing job:", err);
      alert("Failed to remove job.");
    }
  };

  if (loading) {
    return (
      <div className="jt-loading-center">
        <div className="jt-spinner"></div>
        <div>Loading saved jobs…</div>
      </div>
    );
  }

  return (
    <div className="jt-app">
       <Sidebar user={user} onLogout={onLogout} />

      <main className="jt-main">
        <aside className="jt-sidebar"></aside>
        <header className="jt-topbar">
          <input className="jt-search" placeholder="Search saved jobs..." />
        </header>

        <section className="jt-results scrollable">
          {savedJobs.length === 0 ? (
            <div className="jt-empty-center">
              <div>No saved jobs yet!</div>
              <button
                className="jt-primary"
                onClick={() => (window.location.hash ="#search")}
              >
                Find Jobs
              </button>
            </div>
          ) : (
            <>
              <div className="jt-results-head">Saved Jobs ({savedJobs.length})</div>
              <ul className="jt-list">
                {savedJobs.map((job) => (
                  <li className="jt-list-item" key={job.firestoreId}>
                    <div className="jt-list-main">
                      <div className="jt-line">
                        <span className="jt-jobtitle">{job.title}</span>
                        <span className="jt-dash">—</span>
                        <span className="jt-company">{job.company}</span>
                      </div>
                      <div className="jt-role">{job.role}</div>
                      <div className="jt-desc">{job.description}</div>
                    </div>

                    <div className="jt-meta">
                      <span className="jt-date">Date posted: {job.datePosted || "N/A"}</span>
                      <div className="jt-actions">
                        <button
                          className="jt-btn-apply"
                          onClick={() => setPopupJob(job)}
                          disabled={job.applied}
                        >
                          {job.applied ? "Applied ✅" : "Apply"}
                        </button>
                        <button
                          className="jt-btn-view"
                          onClick={() => window.open(job.url, "_blank")}
                        >
                          View
                        </button>
                        <button
                          className="jt-btn-save jt-btn-red"
                          title="Remove"
                          onClick={() => removeJob(job)}
                        >
                          🗑️ Delete
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

      {/* Apply Job Popup */}
      {popupJob && (
        <ApplyJobPopup
          job={popupJob}
          user={user}
          onClose={() => setPopupJob(null)}
          onApplied={(job) => {
            setSavedJobs((prev) =>
              prev.map((j) => (j.firestoreId === job.firestoreId ? { ...j, applied: true } : j))
            );
            setToast(`✅ Applied to "${job.title}"`);
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}

      {toast && <div className="toast-success">{toast}</div>}
    </div>
  );
}
