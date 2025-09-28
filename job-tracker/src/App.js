// src/App.js
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import JobSearch from "./pages/JobSearch";
import Tracking from "./pages/Tracking";
import SavedJobs from "./pages/SavedJobs";
import NotFound from "./pages/NotFound";

export default function App() {
  const shell = { fontFamily: "system-ui", padding: 16 };
  const nav = { display: "flex", gap: 12, marginBottom: 16 };

  return (
    <div style={shell}>
      <nav style={nav}>
        <Link to="/">Home</Link>
        <Link to="/search">Job Search</Link>
        <Link to="/jobs">Jobs</Link>
        <Link to="/tracking">Tracking</Link>
        <Link to="/saved">Saved Jobs</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<JobSearch />} />
        <Route path="/jobs" element={<JobSearch />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/saved" element={<SavedJobs />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
