import React, { useState, useEffect } from "react";
import "../components/job-tracker.css";
import Sidebar from "../components/sidebar";
import axios from "axios";
import { db } from "../lib/firebase";
import { addDoc, collection, serverTimestamp, writeBatch, doc } from "firebase/firestore";

export default function JobSearchPage({ user, onLogout }) {
  const [query, setQuery] = useState("");
  const [location] = useState("Australia");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const BASE_URL = "http://localhost:5000/api/jobs";

  async function fetchJobs() {
    if (!query) {
      alert("Please enter a search query.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(BASE_URL, { params: { q: query, loc: location } });
      const scrapedResults = response.data || [];
      const formatted = scrapedResults.map((job, idx) => ({
        id: idx,
        title: job.title,
        company: job.company,
        location: job.location || location,
        url: job.link,
        datePosted: "N/A",
        role: "N/A",
        description: "Click to view full listing.",
      }));
      setResults(formatted);
      saveJobsToFirestore(formatted);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function saveJob(job, userId) {
    if (!userId) return;
    try {
      await addDoc(collection(db, "users", userId, "saved_jobs"), {
        ...job,
        savedAt: serverTimestamp(),
      });
      alert("Job saved successfully!");
    } catch (err) {
      console.error("Error saving job:", err);
    }
  }

  async function saveJobsToFirestore(jobs) {
    try {
      const batch = writeBatch(db);
      const collectionRef = collection(db, "jobs");
      jobs.forEach((job) => batch.set(doc(collectionRef), { ...job, savedAt: serverTimestamp() }));
      await batch.commit();
    } catch (err) {
      console.error("Error saving jobs in batch:", err);
    }
  }

  function runSearch(e) {
    e?.preventDefault();
    fetchJobs();
  }

  useEffect(() => setResults([]), []);

  return (
    <div className="jt-app">
      <Sidebar user={user} onLogout={onLogout} />
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
              <div>searching jobs…</div>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="jt-empty-center">
              <div>nothing here!</div>
              <button className="jt-primary" onClick={runSearch}>find jobs</button>
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
                      <span className="jt-date">date posted: {job.datePosted}</span>
                      <div className="jt-actions">
                        <button className="jt-btn-apply" onClick={() => window.open(job.url, "_blank")}>Apply</button>
                        <button className="jt-btn-save" title="Save" onClick={() => saveJob(job, user?.uid)}>💾 Save</button>
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
