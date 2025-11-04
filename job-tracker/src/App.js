import React, { useState, useEffect, useRef } from "react";
import Login from "./pages/Login";
import JobTrackerPage from "./pages/JobTrackerPage";
import JobSearchPage from "./pages/JobSearchPage";
import SkillsPage from "./pages/SkillsPage";
import SavedJobsPage from "./pages/SavedJobsPage";
import EmployerJobsPage from "./pages/EmployerJobsPage";
import ProfilePopup from "./pages/ProfilePopup";
import UserDetailsPopup from "./pages/UserDetailsPopup";

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState(window.location.hash || "#board");

  // Popups
  const [openPopup, setOpenPopup] = useState({
    profile: false,
    userDetails: false,
  });

  const avatarRef = useRef();

  // Track hash
  useEffect(() => {
    const onHashChange = () => setTab(window.location.hash || "#board");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const logout = () => {
    setUser(null);
    window.location.hash = "";
  };

  if (!user) return <Login onLogin={setUser} />;

  const userWithId = { ...user, id: user.id || user.uid || null };

  // Determine current page
  let CurrentPage;
  if (userWithId.type === "employer") {
    CurrentPage = EmployerJobsPage;
    if (tab !== "#employer-jobs") {
      window.location.hash = "#employer-jobs";
      setTab("#employer-jobs");
      return null;
    }
  } else {
    switch (tab) {
      case "#search":
        CurrentPage = JobSearchPage;
        break;
      case "#saved":
        CurrentPage = SavedJobsPage;
        break;
      case "#skills":
        CurrentPage = SkillsPage;
        break;
      default:
        CurrentPage = JobTrackerPage;
    }
  }

  // Functions to toggle popups
  const openProfile = () => setOpenPopup({ profile: true, userDetails: false });
  const openUserDetails = () =>
    setOpenPopup({ profile: false, userDetails: true });
  const closeAll = () => setOpenPopup({ profile: false, userDetails: false });

  return (
    <>
      <CurrentPage
        user={userWithId}
        onLogout={logout}
        avatarRef={avatarRef}
        onProfileClick={openProfile} // open profile popup
      />

      <ProfilePopup
        open={openPopup.profile}
        anchorRef={avatarRef}
        user={userWithId}
        openUserDetails={openUserDetails} // <-- direct function
        onClose={closeAll}
      />

      <UserDetailsPopup
        open={openPopup.userDetails}
        user={userWithId}
        onClose={closeAll}
      />
    </>
  );
}
