import React, { useMemo, useState, useEffect } from "react";
import "../components/job-tracker.css";
import { db } from "../lib/firebase";
import {
  addDoc, collection, serverTimestamp,
} from "firebase/firestore";

// --- mock dataset until real API connection ---
const MOCK_JOBS = [
  {
    id: "m1",
    title: "UI/UX Developer",
    company: "Globex",
    role: "Designer / Frontend",
    description: "Design system, Figma, React",
    datePosted: "2025-08-01",
    industry: "Software",
    location: "Sydney",
    url: "https://example.com/jobs/uxui-dev",
  },
  {
    id: "m2",
    title: "Frontend Engineer",
    company: "Acme",
    role: "React",
    description: "React, TypeScript, CSS",
    datePosted: "2025-08-15",
    industry: "Software",
    location: "Remote",
    url: "https://example.com/jobs/frontend",
  },
  {
    id: "m3",
    title: "Junior QA Tester",
    company: "Umbrella",
    role: "QA",
    description: "Cypress / Playwright",
    datePosted: "2025-07-20",
    industry: "Software",
    location: "Melbourne",
    url: "https://example.com/jobs/qa",
  },
];

export default function JobSearchPage({ user }) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // fake “search” over MOCK_JOBS until API is connected
  const filteredMock = useMemo(() => {
    const q = query.toLowerCase();
    return MOCK_JOBS.filter(j =>
      (!q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q) || j.description.toLowerCase().includes(q)) &&
      (!industry || j.industry === industry) &&
      (!location || j.location.toLowerCase().includes(location.toLowerCase()))
    );
  }, [query, industry, location]);

  function runSearch(e) {
    e?.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setResults(filteredMock);
      setLoading(false);
    }, 350);
  }

  async function saveJob(job) {
    await addDoc(collection(db, "saved_jobs"), {
      ...job,
      savedAt: serverTimestamp(),
    });
  }

  useEffect(() => {
    setResults([]);
  }, []);

  return (
    <div className="jt-app">
      <aside className="jt-sidebar">
          <div className="jt-logo">job.tracker</div>
            <nav className="jt-nav">
              <a className="jt-nav-item active" href="#board"><span>Job Board</span></a>
              <a className="jt-nav-item" href="#search"><span>Job Search</span></a>
              <a className="jt-nav-item" href="#saved"><span>Saved Jobs</span></a>

              {/* Only show for employers */}
              {user?.type === "employer" && (
                  <a className="jt-nav-item" href="#employer-jobs"><span>View Added Jobs</span></a>
              )}
            </nav>
          <div className="jt-logout">Log Out ⟶</div>
        </aside>

      <main className="jt-main">
        <header className="jt-topbar jt-topbar--search">
          <form onSubmit={runSearch} className="jt-search-row">
            <input
              className="jt-search"
              placeholder=".search jobs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="jt-chip-select"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="">.what industry</option>
              <option>Software</option>
              <option>Finance</option>
              <option>Retail</option>
            </select>
            <input
              className="jt-chip-input"
              placeholder=".where"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button className="jt-primary" type="submit">find jobs</button>
          </form>
        </header>

        <section className="jt-results">
          {loading && <div className="jt-empty">searching…</div>}
          {!loading && results.length === 0 && (
            <div className="jt-empty-center">
            <div>nothing here!</div>
            <button className="jt-primary" onClick={runSearch}>find jobs</button>
         </div>
        )}

          {!loading && results.length > 0 && (
            <>
              <div className="jt-results-head">Results found</div>
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
                      <span className="jt-date">date posted: {job.datePosted || "00/00/0000"}</span>
                      <div className="jt-actions">
                        <button className="jt-ghost" onClick={() => window.open(job.url, "_blank")}>Apply</button>
                        <button className="jt-icon" title="Save" onClick={() => saveJob(job)}>💾</button>
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