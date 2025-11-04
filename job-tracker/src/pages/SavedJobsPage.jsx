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
} from "firebase/firestore";
import ApplyJobPopup from "./ApplyJobPopup";
import "../components/job-tracker.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-regular-svg-icons";

export default function SavedJobsPage({ user, onLogout, avatarRef, onProfileClick }) {
  const [savedJobs, setSavedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [popupJob, setPopupJob] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setSavedJobs([]);
      setFilteredJobs([]);
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
        setFilteredJobs(checkedJobs);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching saved jobs:", err);
        setSavedJobs([]);
        setFilteredJobs([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) {
      setFilteredJobs(savedJobs);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = savedJobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(lower) ||
        job.company?.toLowerCase().includes(lower) ||
        job.role?.toLowerCase().includes(lower)
    );
    setFilteredJobs(filtered);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilteredJobs(savedJobs);
  };

  const removeJob = async (job) => {
    if (!job?.firestoreId || !user?.uid) return;
    try {
      //delete from saved_jobs
      await deleteDoc(doc(db, "users", user.uid, "saved_jobs", job.firestoreId));

      //if this saved job was applied, delete applied job too
      if (job.linkedAppliedId) {
        await deleteDoc(doc(db, "users", user.uid, "applied_jobs", job.linkedAppliedId));
      }

      setToast("✅ Job removed successfully!");
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error("Error removing job:", err);
      alert("Failed to remove job.");
    }
  };

  const handleDeleteJob = () => {
    if (jobToDelete) {
      removeJob(jobToDelete); //uses existing removeJob function
      setJobToDelete(null);
    }
    setShowDeletePopup(false);
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
        <header className="saved-jobs-topbar">
          {/* left section: search bar + buttons */}
          <div className="saved-jobs-topbar-left">
            <form onSubmit={handleSearch} className="jt-search-form">
              <input
                className="jt-search"
                placeholder="Search saved or applied jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="jt-topbar-actions">
                <button type="submit" className="jt-btn-search">
                  🔍 Search
                </button>
                {searchTerm && (
                  <button
                    type="button"
                    className="jt-btn-clear"
                    onClick={clearSearch}
                  >
                    ✖ Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right section: profile */}
          <div
            title="Profile"
            ref={avatarRef}
            onClick={onProfileClick}
            style={{ cursor: "pointer" }}
          >
            <FontAwesomeIcon icon={faCircleUser} size="lg" />
          </div>
        </header>

        <section className="jt-results scrollable">
          {filteredJobs.length === 0 ? (
            <div className="jt-empty-center">
              <div>{searchTerm ? "No matching jobs found." : "No saved jobs yet!"}</div>
              {!searchTerm && (
                <button
                  className="jt-primary"
                  onClick={() => (window.location.hash = "#search")}
                >
                  Find Jobs
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="jt-results-head">Saved Jobs ({filteredJobs.length})</div>
              <ul className="jt-list">
                {filteredJobs.map((job) => (
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

                      {job.deleted && ( //if employer deletes job, give warning to user
                        <p className="jt-warning-text">
                          ⚠️ This job is no longer available or was deleted by the employer.
                        </p>
                      )}
                    </div>

                    <div className="jt-meta">
                      <span className="jt-date">Date posted: {job.datePosted || "N/A"}</span>
                      <div className="jt-actions">
                        <button
                          className="jt-btn-apply"
                          onClick={() => {
                            if (job.applied) { //if job exists in applied_jobs show toast -> user has to delete the job
                              setToast(`⚠️ You have already applied to "${job.title}"`);
                              setTimeout(() => setToast(null), 4000);
                            } else if (!job.deleted) {
                              setPopupJob(job);
                            }
                          }}
                          disabled={job.applied || job.deleted} //disables apply button
                        >
                          {job.deleted
                            ? "Unavailable"
                            : job.applied
                            ? "Applied ✅"
                            : "Apply"}
                        </button>

                        {!job.deleted && (
                          <button
                            className="jt-btn-view"
                            onClick={() => window.open(job.url, "_blank")}
                          >
                            View
                          </button>
                        )}

                        <button
                          className="jt-btn-save jt-btn-red"
                          title="Remove"
                          onClick={() => {
                            setJobToDelete(job);
                            setShowDeletePopup(true);
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {showDeletePopup && (
                <div className="delete-popup-overlay">
                  <div className="delete-popup">
                    <div className="delete-popup-header">
                      <h2>Confirm Deletion</h2>
                      <button
                        className="close-btn"
                        onClick={() => setShowDeletePopup(false)}
                      >
                        ×
                      </button>
                    </div>
                    {/* Delete confirmation */}
                    <div className="delete-popup-content"> 
                      <p>Are you sure you want to delete this job?</p>
                      <div className="delete-popup-buttons">
                        <button className="delete-job-btn" onClick={handleDeleteJob}>
                          Yes, Delete
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => setShowDeletePopup(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {popupJob && !popupJob.deleted && (
        <ApplyJobPopup
          job={popupJob}
          user={user}
          onClose={() => setPopupJob(null)}
          onApplied={(job) => {
            setSavedJobs((prev) =>
              prev.map((j) =>
                j.firestoreId === job.firestoreId
                  ? { ...j, applied: true, appliedId: job.appliedId }
                  : j
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
