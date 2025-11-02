import React, { useState, useEffect } from "react";
import "../components/job-tracker.css";
import axios from "axios";
import { db } from "../lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query as firestoreQuery,
  where,
} from "firebase/firestore";
import ApplyJobPopup from "./ApplyJobPopup"; 

export default function JobSearchPage({ user }) {
  const [query, setQuery] = useState("");
  const [location] = useState("Australia");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [popupJob, setPopupJob] = useState(null); 

  const BASE_URL = "http://localhost:5000/api/jobs";

  //fetch employer + Seek jobs
  const fetchJobs = async () => {
    if (!query.trim()) return alert("Please enter a search query.");
    setLoading(true);

    try {
      //Firestore employer jobs
      const jobDocs = await getDocs(collection(db, "jobs"));
      const employerJobs = jobDocs.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            id: `employer-${docSnap.id}`,
            firestoreId: docSnap.id,
            title: data.title || "Untitled Job",
            company: data.company?.trim() || "Employer Job",
            location: data.location || "Australia",
            url: data.url || "",
            datePosted: data.datePosted || "N/A",
            role: data.role || data.type || "N/A",
            description: data.description || "No description provided.",
            applied: false,
            source: "employer",
          };
        })
        .filter(
          (job) =>
            job.title.toLowerCase().includes(query.toLowerCase()) ||
            job.company.toLowerCase().includes(query.toLowerCase())
        );

      //seek API jobs
      const response = await axios.get(BASE_URL, { params: { q: query, loc: location } });
      const seekJobs = (response.data || []).map((job, idx) => ({
        id: `seek-${idx}`,
        title: job.title,
        company: job.company || "Unknown Company",
        location: job.location || location,
        url: job.link || job.url || "",
        datePosted: "N/A",
        role: "N/A",
        description: "Click to view full listing.",
        applied: false,
        firestoreId: null,
        source: "seek",
      }));

      setResults([...employerJobs, ...seekJobs]);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

   //save job
  const saveJob = async (job) => {
    if (!user?.uid) return alert("Please log in to save jobs.");

    try {
      const savedJobsRef = collection(db, "users", user.uid, "saved_jobs");
      const q = firestoreQuery(savedJobsRef, where("url", "==", job.url));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setToast("⚠️ Job already saved!");
        setTimeout(() => setToast(null), 4000);
        return;
      }

      const docRef = await addDoc(savedJobsRef, {
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        datePosted: job.datePosted,
        role: job.role,
        description: job.description,
        savedAt: serverTimestamp(),
        applied: job.applied || false,
      });

      setResults((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, firestoreId: docRef.id } : j))
      );

      setToast(`✅ Job "${job.title}" saved!`);
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error("Error saving job:", err);
      setToast("❌ Failed to save job.");
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
          <a className="jt-nav-item" href="#board">Job Board</a>
          <a className="jt-nav-item active" href="#search">Job Search</a>
          <a className="jt-nav-item" href="#saved">Saved Jobs</a>
        </nav>
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
          {loading ? (
            <div className="jt-loading-center">
              <div className="jt-spinner"></div>
              <div>Searching jobs…</div>
            </div>
          ) : results.length === 0 ? (
            <div className="jt-empty-center">Search for jobs above 👆</div>
          ) : (
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
                        <button className="jt-btn-apply" onClick={() => setPopupJob(job)}>
                          {job.applied ? "Applied ✅" : "Apply"}
                        </button>
                        <button className="jt-btn-view" onClick={() => window.open(job.url, "_blank")}>
                          View
                        </button>
                        <button className="jt-btn-save" onClick={() => saveJob(job)}>
                          💾 Save
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
          <>
            {console.log("Current user passed to ApplyJobPopup:", user)}
            <ApplyJobPopup
              job={popupJob}
              user={user}
              onClose={() => setPopupJob(null)}
              onApplied={(job) => {
                setResults(prev =>
                  prev.map(j => j.id === job.id ? { ...j, applied: true } : j)
                );
                setToast(`✅ Applied to "${job.title}"`);
                setTimeout(() => setToast(null), 4000);
              }}
            />
          </>
        )}
        
      {toast && <div className="toast-success">{toast}</div>}
    </div>
  );
}
