import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-regular-svg-icons";

export default function ProfilePopup({ open, anchorRef, user, onEdit, onClose }) {
  // 🔹 Hooks at the top (always run)
  const [hash, setHash] = useState(() => window.location.hash || "#board");

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#board");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // If not open, bail out AFTER hooks
  if (!open) return null;

  // 🔹 Position under the avatar (account for scroll)
  const rect = anchorRef?.current?.getBoundingClientRect();
  const top = (rect?.bottom ?? 0) + window.scrollY + 8;
  const left = (rect
    ? rect.right + window.scrollX - 280 // 280 ~ popup width
    : window.innerWidth - 300);

  const style = { position: "fixed", top, left, background: "#3C3659", borderRadius: "10px", height: "110px", width: "270px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"};

  const item = (target) => `jt-nav-item${hash === target ? " active" : ""}`;

  const handleEdit = () => {
    onClose?.();
    if (onEdit) onEdit();
    else window.location.hash = "#profile"; // fallback navigation
  };

  return (
    <div className="profile-popup" style={style} onMouseLeave={onClose}>
      <svg className="user-details-profile-pic" xmlns="http://www.w3.org/2000/svg" width="195" height="203" viewBox="0 0 195 203" fill="none" style={{ position: "absolute", width: "42px", height: "42px", left: "12px", top: "13px" }}>
        <FontAwesomeIcon icon={faCircleUser} size="lg" />
      </svg>
      <div className="profile-header" style={{position: "relative", top: "9px", left: "70px", paddingBottom: "5px"}}>
        <div className="profile-info">
          <div className="profile-name"><span style={{fontWeight: "bold"}}>Name: </span>{user?.displayName || "fname lname"}</div>
          <div className="profile-email"><span style={{fontWeight: "bold"}}>Email: </span>{user?.email || "fname.lname@mail.com"}</div>
          <div className="profile-location">
            <span style={{fontWeight: "bold"}}>Location: </span>
            {user?.location || "Sydney, Australia"}
          </div>
        </div>
      </div>
      <hr />
      <div className="profile-footer" onClick={handleEdit} role="button" tabIndex={0}>
        <a className={item("#profile")} href="#profile" style={{position: "relative", top: "0px", left: "50px", fontWeight: "bold"}}>
          <span>Customise Profile</span>
        </a>
      </div>
    </div>
  );
}
