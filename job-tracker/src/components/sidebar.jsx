import React, { useEffect, useState } from "react";

<<<<<<< HEAD
export default function Sidebar({ user }) {
=======
export default function Sidebar({ user, onLogout }) {
>>>>>>> bf8cc0a57a01b06f6a8270eebb37543da3f6aff5
  const [hash, setHash] = useState(() => window.location.hash || "#board");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#board");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const item = (target) => `jt-nav-item${hash === target ? " active" : ""}`;

  return (
    <aside className="jt-sidebar">
      <div className="jt-logo">job.tracker</div>
      <nav className="jt-nav">
        <a className={item("#board")} href="#board"><span>Job Board</span></a>
        <a className={item("#search")} href="#search"><span>Job Search</span></a>
        <a className={item("#saved")} href="#saved"><span>Saved Jobs</span></a>
        <a className={item("#skills")} href="#skills"><span>Skills</span></a>
        {user?.type === "employer" && (
          <a className={item("#employer-jobs")} href="#employer-jobs">
            <span>View Added Jobs</span>
          </a>
        )}
      </nav>
<<<<<<< HEAD
      <div className="jt-logout">Log Out ⟶</div>
=======
      <div
        className="jt-logout"
        style={{ cursor: "pointer" }}
        onClick={onLogout}
      >
        Log Out ⟶
      </div>
>>>>>>> bf8cc0a57a01b06f6a8270eebb37543da3f6aff5
    </aside>
  );
}