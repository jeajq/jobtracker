import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import JobTrackerPage from "./pages/JobTrackerPage";
import JobSearchPage from "./pages/JobSearchPage";
import SavedJobsPage from "./pages/SavedJobsPage";
import EmployerJobsPage from "./pages/EmployerJobsPage";

export default function App() {
  const [user, setUser] = useState(null); //logged-in user info
  const [tab, setTab] = useState("");

  useEffect(() => {
    const onHashChange = () => setTab(window.location.hash || "");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (!user) return <Login onLogin={(userData) => setUser(userData)} />;

  //EMPLOYER
  if (user.type === "employer") {
    //redirects employers to their jobs page
    if (tab !== "#employer-jobs") {
      window.location.hash = "#employer-jobs";
      setTab("#employer-jobs");
    }
    return <EmployerJobsPage user={user} />;
  }

  //NORMAL USER
  switch (tab) {
    case "#search":
      return <JobSearchPage user={user} />;
    case "#saved":
      return <SavedJobsPage user={user} />;
    default:
      return <JobTrackerPage user={user} />;
  }
}
