import React, { useState, useEffect } from "react";
import "../components/job-tracker.css";
import axios from "axios";
import { db } from "../lib/firebase";
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDocs } from "firebase/firestore";

export default function JobSearchPage({ user }) {
  const [query, setQuery] = useState("");
  const [location] = useState("Australia");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const BASE_URL = "http://localhost:5000/api/jobs";

  //fetch jobs from API
  const fetchJobs = async () => {
    if (!query.trim()) return alert("Please enter a search query.");
    setLoading(true);
    try {
      const response = await axios.get(BASE_URL, { params: { q: query, loc: location } });
      const formatted = (response.data || []).map((job, idx) => ({
        id: idx,
        title: job.title,
        company: job.company,
        location: job.location || location,
        url: job.link,
        datePosted: "N/A",
        role: "N/A",
        description: "Click to view full listing.",
        applied: false,
        firestoreId: null,
      }));
      setResults(formatted);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  //save job to saved_jobs sub-collection
  const saveJob = async (job) => {
    if (!user?.uid) return alert("Please log in to save jobs.");
    try {
      const userJobsRef = collection(db, "users", user.uid, "saved_jobs");
      const docRef = await addDoc(userJobsRef, {
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        datePosted: job.datePosted,
        role: job.role,
        description: job.description,
        savedAt: serverTimestamp(),
        applied: job.applied || false,
        appliedAt: job.appliedAt || null,
      });

      setResults(prev =>
        prev.map(j => (j.id === job.id ? { ...j, firestoreId: docRef.id } : j))
      );

      setToast(`✅ Job "${job.title}" saved successfully!`);
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error("Error saving job:", err);
      setToast("❌ Failed to save job.");
      setTimeout(() => setToast(null), 4000);
    }
  };

  //apply job to applied_jobs sub-collection and update saved_jobs
  const applyJob = async (job) => {
    if (!user?.uid) return alert("Please log in to track applications.");
    try {
      const appliedJobsRef = collection(db, "users", user.uid, "applied_jobs");

      // Get current count to determine position
      const snapshot = await getDocs(appliedJobsRef);
      const nextPosition = snapshot.size; //zero-based index for position

      await addDoc(appliedJobsRef, {
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        datePosted: job.datePosted,
        role: job.role,
        description: job.description,
        appliedAt: serverTimestamp(),
        status: "applied",
        position: nextPosition,
      });

      if (job.firestoreId) {
        //update saved job
        const savedJobRef = doc(db, "users", user.uid, "saved_jobs", job.firestoreId);
        await updateDoc(savedJobRef, { applied: true, appliedAt: serverTimestamp() });
      } else {
        //create saved job entry if not already saved
        const savedJobsRef = collection(db, "users", user.uid, "saved_jobs");
        const savedDocRef = await addDoc(savedJobsRef, {
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          datePosted: job.datePosted,
          role: job.role,
          description: job.description,
          savedAt: serverTimestamp(),
          applied: true,
          appliedAt: serverTimestamp(),
        });

        setResults(prev =>
          prev.map(j => (j.id === job.id ? { ...j, firestoreId: savedDocRef.id, applied: true } : j))
        );
      }

      setToast(`✅ Application for "${job.title}" tracked!`);
      setTimeout(() => setToast(null), 4000);

      window.open(job.url, "_blank");
    } catch (err) {
      console.error("Error applying to job:", err);
      setToast("❌ Could not track application.");
      setTimeout(() => setToast(null), 4000);
    }
  };


  const runSearch = (e) => {
    e?.preventDefault();
    fetchJobs();
  };

  useEffect(() => setResults([]), []);

  return (
    <div className="jt-app">
      <aside className="jt-sidebar">
        <div className="jt-logo">job.tracker</div>
        <nav className="jt-nav">
          <a className="jt-nav-item" href="#board"><span>Job Board</span></a>
          <a className="jt-nav-item active" href="#search"><span>Job Search</span></a>
          <a className="jt-nav-item" href="#saved"><span>Saved Jobs</span></a>
        </nav>
        <div className="jt-logout">Log Out ⟶</div>
      </aside>

      <main className="jt-main">
        <header className="jt-topbar jt-topbar--search">
          <form onSubmit={runSearch} className="jt-search-row">
            <input
              className="jt-search"
              placeholder="Search jobs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="jt-btn-find" type="submit">Find Jobs</button>
          </form>
        </header>

        <section className="jt-results scrollable">
          {loading && (
            <div className="jt-loading-center">
              <div className="jt-spinner"></div>
              <div>Searching jobs…</div>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="jt-empty-center">
              <div>Search for jobs above 👆</div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="jt-results-head">Results found ({results.length})</div>
              <ul className="jt-list">
                {results.map((job) => (
                  <li className="jt-list-item" key={job.id}>
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
                      <span className="jt-date">Date posted: {job.datePosted}</span>
                      <div className="jt-actions">
                        <button className="jt-btn-apply" onClick={() => applyJob(job)}>
                          {job.applied ? "Applied ✅" : "Apply"}
                        </button>
                        <button className="jt-btn-save" title="Save" onClick={() => saveJob(job)}>💾 Save</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
      {toast && (
        <div className="toast-success">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
