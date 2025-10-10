import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import JobTrackerPage from "./pages/JobTrackerPage";
import JobSearchPage from "./pages/JobSearchPage";
import SavedJobsPage from "./pages/SavedJobsPage";
import EmployerJobsPage from "./pages/EmployerJobsPage";

export default function App() {
  const [user, setUser] = useState(null); // logged-in user info
  const [tab, setTab] = useState("#board");

  useEffect(() => {
    const onHashChange = () => setTab(window.location.hash || "#board");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (!user) return <Login onLogin={(userData) => setUser(userData)} />;

  // Render employer-specific page
  if (user.type === "employer") {
    if (tab === "#employer-jobs") return <EmployerJobsPage user={user} />;
    if (tab === "#search") return <JobSearchPage user={user} />;
    if (tab === "#saved") return <SavedJobsPage user={user} />;
    return <JobTrackerPage user={user} />; // employer dashboard
  }

  // Normal user routes
  if (tab === "#search") return <JobSearchPage user={user} />;
  if (tab === "#saved") return <SavedJobsPage user={user} />;
  return <JobTrackerPage user={user} />; // user dashboard
  
}
