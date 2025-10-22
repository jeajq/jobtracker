import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "../components/job-tracker.css";
import AddJob from "./AddJob.jsx";

export default function EmployerJobsPage({ user, navigate }) {
  const [jobs, setJobs] = useState([]);
  const [showAddJob, setShowAddJob] = useState(false);

  //only for employers
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

  return (
    <div className="jt-app">
      <aside className="jt-sidebar">
        <div className="jt-logo">job.tracker</div>
        <nav className="jt-nav">
          <a className="jt-nav-item active" href="#employer-jobs">
            <span>View Added Jobs</span>
          </a>
        </nav>
        <div className="jt-logout">Log Out ⟶</div>
      </aside>

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
              </div>
            ))
          )}
        </section>

        {/* Add job popup */}
        {showAddJob && (
          <AddJob
            user={user}
            onClose={() => setShowAddJob(false)}
            onAdd={() => setShowAddJob(false)}
          />
        )}
      </main>
    </div>
  );
}
