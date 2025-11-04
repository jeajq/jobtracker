import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-regular-svg-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ProfilePopup({ open, anchorRef, user, openUserDetails, onClose }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchUser = async () => {
      const collectionName = user.role === "employer" ? "employers" : "users";
      const docRef = doc(db, collectionName, user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserData(docSnap.data());
    };
    fetchUser();
  }, [user]);

  if (!open) return null;

  const rect = anchorRef?.current?.getBoundingClientRect();
  const top = (rect?.bottom ?? 0) + window.scrollY + 8;
  const left = (rect ? rect.right + window.scrollX - 280 : window.innerWidth - 300);

  return (
    <div
      style={{
        position: "fixed",
        top,
        left,
        background: "#3C3659",
        borderRadius: "10px",
        width: "270px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: "10px 12px",
        zIndex: 1000,
      }}
      onMouseLeave={onClose}
    >
      <FontAwesomeIcon
        icon={faCircleUser}
        size="2x"
        style={{ position: "absolute", left: "12px", top: "12px", color: "#fff" }}
      />

      <div style={{ marginLeft: "60px", marginTop: "5px" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#fff" }}>
          Name: {userData ? `${userData.firstName} ${userData.lastName}` : "Loading..."}
        </div>
        <div style={{ fontSize: "0.85rem", color: "#ddd", marginTop: "4px" }}>
          Email: {userData?.email || "Loading..."}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
        <button
          onClick={openUserDetails}
          style={{
            backgroundColor: "#5b4bfa",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "5px 10px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Customise Profile
        </button>
      </div>
    </div>
  );
}
