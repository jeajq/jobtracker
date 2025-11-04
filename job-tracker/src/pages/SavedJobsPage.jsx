import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import ApplyJobPopup from "./ApplyJobPopup";
import "../components/job-tracker.css";

export default function SavedJobsPage({ user, onLogout }) {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [popupJob, setPopupJob] = useState(null);

  // Load saved jobs for the user
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
      async (snapshot) => {
        const jobs = snapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }));

        // Check which jobs still exist in Firestore (active jobs)
        const checkedJobs = await Promise.all(
          jobs.map(async (job) => {
            if (!job.jobId) return { ...job, deleted: false };
            const jobRef = doc(db, "jobs", job.jobId);
            const jobSnap = await getDoc(jobRef);
            return {
              ...job,
              deleted: !jobSnap.exists(),
            };
          })
        );

        setSavedJobs(checkedJobs);
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

  // Remove job from saved_jobs and applied_jobs
  const removeJob = async (job) => {
    if (!job?.firestoreId || !user?.uid) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "saved_jobs", job.firestoreId));

      // Delete from applied_jobs if same URL
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
                onClick={() => (window.location.hash = "#search")}
              >
                Find Jobs
              </button>
            </div>
          ) : (
            <>
              <div className="jt-results-head">
                Saved Jobs ({savedJobs.length})
              </div>
              <ul className="jt-list">
                {savedJobs.map((job) => (
                  <li
                    className={`jt-list-item ${job.deleted ? "jt-job-deleted" : ""}`}
                    key={job.firestoreId}
                  >
                    <div className="jt-list-main">
                      <div className="jt-line">
                        <span className="jt-jobtitle">{job.title}</span>
                        <span className="jt-dash">—</span>
                        <span className="jt-company">{job.company}</span>
                      </div>
                      <div className="jt-role">{job.role}</div>
                      <div className="jt-desc">{job.description}</div>

                      {/* Warning if job deleted */}
                      {job.deleted && (
                        <p className="jt-warning-text">
                          ⚠️ This job is no longer available or was deleted by the employer.
                        </p>
                      )}
                    </div>

                    <div className="jt-meta">
                      <span className="jt-date">
                        Date posted: {job.datePosted || "N/A"}
                      </span>
                      <div className="jt-actions">
                        {/* Apply button */}
                        <button
                          className="jt-btn-apply"
                          onClick={() => setPopupJob(job)}
                          disabled={job.applied || job.deleted}
                        >
                          {job.deleted
                            ? "Unavailable"
                            : job.applied
                            ? "Applied ✅"
                            : "Apply"}
                        </button>

                        {/* Only show View if job exists */}
                        {!job.deleted && (
                          <button
                            className="jt-btn-view"
                            onClick={() => window.open(job.url, "_blank")}
                          >
                            View
                          </button>
                        )}

                        {/* Delete button */}
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
      {popupJob && !popupJob.deleted && (
        <ApplyJobPopup
          job={popupJob}
          user={user}
          onClose={() => setPopupJob(null)}
          onApplied={(job) => {
            setSavedJobs((prev) =>
              prev.map((j) =>
                j.firestoreId === job.firestoreId ? { ...j, applied: true } : j
              )
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
