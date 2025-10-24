import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import JobTrackerPage from "./pages/JobTrackerPage";
import JobSearchPage from "./pages/JobSearchPage";
import SavedJobsPage from "./pages/SavedJobsPage";
import EmployerJobsPage from "./pages/EmployerJobsPage";
import SkillsPage from "./pages/SkillsPage";

export default function App() {
  const [user, setUser] = useState(null); // logged-in user info
  const [tab, setTab] = useState(window.location.hash || "#board");

  // track hash changes
  useEffect(() => {
    const onHashChange = () => setTab(window.location.hash || "#board");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // when user not logged in
  if (!user) {
    return <Login onLogin={(userData) => setUser(userData)} />;
  }

  // ensure user object always has an ID (uid or doc id)
  const userWithId = {
    ...user,
    id: user.id || user.uid || null,
  };

  // handle employer view safely
  if (userWithId.type === "employer") {
    // redirect once only, not on every render
    if (tab !== "#employer-jobs") {
      window.location.hash = "#employer-jobs";
      setTab("#employer-jobs");
      return null; // prevent flicker while redirecting
    }
    return <EmployerJobsPage user={userWithId} />;
  }

  // switch for normal user
  switch (tab) {
    case "#search":
      return <JobSearchPage user={userWithId} />;
    case "#saved":
      return <SavedJobsPage user={userWithId} />;
    case "#skills":
      return <SkillsPage user={userWithId} />;
    default:
      return <JobTrackerPage user={userWithId} />;
  }
}
