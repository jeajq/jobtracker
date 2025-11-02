import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import JobTrackerPage from "./pages/JobTrackerPage";
import JobSearchPage from "./pages/JobSearchPage";
import SkillsPage from "./pages/SkillsPage";
import SavedJobsPage from "./pages/SavedJobsPage";
import EmployerJobsPage from "./pages/EmployerJobsPage";
import SkillsPage from "./pages/SkillsPage";  

export default function App() {
  const [user, setUser] = useState(null); //logged-in user info
  const [tab, setTab] = useState("");

  useEffect(() => {
    const onHashChange = () => setTab(window.location.hash || "");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function logout() {
    setUser(null);
    window.location.hash = "";

  }

  if (!user) return <Login onLogin={(userData) => setUser(userData)} />;

  //EMPLOYER
  if (user.type === "employer") {
    //redirects employers to their jobs page
    if (tab !== "#employer-jobs") {
      window.location.hash = "#employer-jobs";
      setTab("#employer-jobs");
    }
    return <EmployerJobsPage user={user} onLogout={logout} />;
  }

  //NORMAL USER
  switch (tab) {
    case "#search":
      return <JobSearchPage user={user} onLogout={logout} />;
    case "#saved":
      return <SavedJobsPage user={user}onLogout={logout}/>;
    case "#skills":
      return <SkillsPage user={user} onLogout={logout}/>;
    default:
      return <JobTrackerPage user={user} onLogout={logout}/>;
  }
}
