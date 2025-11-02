import React, { useEffect, useState } from "react"; 
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import "../components/job-tracker.css";
import Sidebar from "../components/sidebar";
import AddJob from "./AddJob.jsx";

export default function EmployerJobsPage({ user, navigate, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [showAddJob, setShowAddJob] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false); 

  //redirect non-employers
  useEffect(() => {
    if (user && user.type?.toLowerCase() !== "employer") {
      if (navigate) navigate("/job-search");
      return;
    }
  }, [user, navigate]);

  //load jobs created by the employer
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "jobs"), where("createdBy", "==", user.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  //confirm delete popup
  const confirmDeleteJob = (jobId) => {
    setDeleteJobId(jobId);
    setShowDeletePopup(true);
  };

  const handleDeleteJob = async () => {
    if (!deleteJobId) return;
    try {
      await deleteDoc(doc(db, "jobs", deleteJobId));
      setJobs((prev) => prev.filter((job) => job.id !== deleteJobId));

      //delete success toast
      setShowDeleteToast(true);
      setTimeout(() => setShowDeleteToast(false), 3000);

    } catch (err) {
      console.error("Failed to delete job:", err);
      alert("Failed to delete job. Please try again.");
    } finally {
      setDeleteJobId(null);
      setShowDeletePopup(false);
    }
  };

  return (
    <div className="jt-app">
       <Sidebar user={user} onLogout={onLogout} />

      <main className="jt-main">
        <header className="jt-topbar">
          <h2>Jobs You Created</h2>
          {user?.type?.toLowerCase() === "employer" && (
            <button className="add-job-btn" onClick={() => setShowAddJob(true)}>
              <span className="add-job-circle">+</span> Add Job
            </button>
          )}
        </header>

        <section className="employer-jobs-list">
          {jobs.length === 0 ? (
            <p style={{ color: "#aaa" }}>No jobs created yet.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="jt-card">
                <h3>{job.title}</h3>
                {job.company && <p>{job.company}</p>}
                <p>{job.description}</p>
                <p>
                  <strong>Status:</strong> {job.status || "Active"}
                </p>
                <div className="job-card-buttons">
                  <button
                    className="view-applicants-btn"
                    onClick={() => alert("View Applicants feature not implemented yet")}
                  >
                    View Applicants
                  </button>
                  <button
                    className="delete-job-btn"
                    onClick={() => confirmDeleteJob(job.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Add Job Popup */}
        {showAddJob && (
          <AddJob
            user={user}
            onClose={() => setShowAddJob(false)}
            onAdd={(job) => setJobs((prev) => [job, ...prev])}
          />
        )}

        {/* Delete Confirmation Popup */}
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

        {/* Delete Success Toast */}
        {showDeleteToast && (
          <div className="toast-success">
            <span>🗑️ Job deleted successfully!</span>
          </div>
        )}
      </main>
    </div>
  );
}
