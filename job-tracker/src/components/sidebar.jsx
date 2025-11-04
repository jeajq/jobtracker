import React, { useEffect, useState } from "react";

export default function Sidebar({ user, onLogout }) {
  const [hash, setHash] = useState(() => window.location.hash || "#board");

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#board");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const item = (target) => `jt-nav-item${hash === target ? " active" : ""}`;

  //if role is employer, show employer tab
  const renderNav = () => {
    if (user?.role === "employer") {
      return (
        <a className={item("#employer-jobs")} href="#employer-jobs">
          <span>View Added Jobs</span>
        </a>
      );
    } else {
      //user tabs
      return (
        <>
          <a className={item("#board")} href="#board"><span>Job Board</span></a>
          <a className={item("#search")} href="#search"><span>Job Search</span></a>
          <a className={item("#saved")} href="#saved"><span>Saved Jobs</span></a>
          <a className={item("#skills")} href="#skills"><span>Skills</span></a>
        </>
      );
    }
  };

  return (
    <aside className="jt-sidebar">
      <div className="jt-logo">job.tracker</div>
      <nav className="jt-nav">
        {renderNav()}
      </nav>
      <div
        className="jt-logout"
        style={{ cursor: "pointer" }}
        onClick={onLogout}
      >
        Log Out ⟶
      </div>
    </aside>
  );
}
