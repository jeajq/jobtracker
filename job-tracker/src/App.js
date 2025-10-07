import React, { useEffect, useState } from "react";
import JobTrackerPage from "./components/JobTrackerPage";   // your existing board
import JobSearchPage from "./components/JobSearchPage";
import SavedJobsPage from "./components/SavedJobsPage";

export default function App() {
  const [tab, setTab] = useState(window.location.hash || "#board");

  useEffect(() => {
    const onHash = () => setTab(window.location.hash || "#board");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (tab === "#search") return <JobSearchPage />;
  if (tab === "#saved") return <SavedJobsPage />;
  return <JobTrackerPage />;
}