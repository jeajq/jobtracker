import React, { useState, useEffect } from "react";
import "../components/job-tracker.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function UserDetailsPopup({ open, user, onClose }) {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user?.uid) return;

    const fetchData = async () => {
      try {
        const collectionName = user.role === "employer" ? "employers" : "users";
        const docRef = doc(db, collectionName, user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    fetchData();
    setEditing(false);
  }, [open, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const collectionName = user.role === "employer" ? "employers" : "users";
      await updateDoc(doc(db, collectionName, user.uid), userData);
      setEditing(false);
      onClose();
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="user-popup-overlay" onClick={onClose}>
      <div className="user-popup" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2>User Details</h2>

        <div className="user-row">
          <div className="user-label">Full Name:</div>
          <input
            type="text"
            name="firstName"
            value={userData.firstName}
            onChange={handleChange}
            disabled={!editing}
            placeholder="First Name"
          />
          <input
            type="text"
            name="lastName"
            value={userData.lastName}
            onChange={handleChange}
            disabled={!editing}
            placeholder="Last Name"
          />
        </div>

        <div className="user-row">
          <div className="user-label">Email:</div>
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            disabled={!editing}
          />
        </div>

        <div className="user-row">
          <div className="user-label">Password:</div>
          <input
            type="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            disabled={!editing}
          />
        </div>

        <div className="user-row">
          <div className="user-label">Phone:</div>
          <input
            type="text"
            name="phone"
            value={userData.phone}
            onChange={handleChange}
            disabled={!editing}
          />
        </div>

        <div className="button-group">
          {!editing ? (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              Edit
            </button>
          ) : (
            <>
              <button className="cancel-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
