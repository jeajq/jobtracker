import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "../components/job-tracker.css"; 
import AddJob from "./AddJob.jsx"; // import your AddJob popup

export default function EmployerJobsPage({ user }) {
  const [jobs, setJobs] = useState([]);
  const [showAddJob, setShowAddJob] = useState(false); // track popup

  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(db, "jobs"),
      where("createdBy", "==", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddJobClick = () => {
    setShowAddJob(true);
  };

  const handleCloseAddJob = () => {
    setShowAddJob(false);
  };

  const handleJobAdded = () => {
  setShowAddJob(false);
  // no need to setJobs here; onSnapshot will pick it up automatically
  };

  return (
    <div className="jt-app">
      <aside className="jt-sidebar">
        <div className="jt-logo">job.tracker</div>
        <nav className="jt-nav">
          <a className="jt-nav-item active" href="#board"><span>Job Board</span></a>
          <a className="jt-nav-item" href="#search"><span>Job Search</span></a>
          <a className="jt-nav-item" href="#saved"><span>Saved Jobs</span></a>
          {user?.type === "employer" && (
            <a className="jt-nav-item" href="#employer-jobs"><span>View Added Jobs</span></a>
          )}
        </nav>
        <div className="jt-logout">Log Out ⟶</div>
      </aside>

      <main className="jt-main">
        <header className="jt-topbar">
          <h2>Jobs You Created</h2>
          {user?.type === "employer" && (
            <button className="add-job-btn" onClick={handleAddJobClick}>
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
                <p><strong>Status:</strong> {job.status}</p>
            </div>
            ))
        )}
        </section>


        {/* Render AddJob popup conditionally */}
        {showAddJob && (
          <AddJob
            user={user}
            onClose={handleCloseAddJob}
            onAdd={handleJobAdded}
          />
        )}
      </main>
    </div>
  );
}
