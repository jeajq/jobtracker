import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collectionGroup, query, where, onSnapshot } from "firebase/firestore";
import "../components/job-tracker.css";

export default function ViewApplicantsPopup({ job, onClose }) {
  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  useEffect(() => {
    if (!job?.id) return;

    const q = query(
      collectionGroup(db, "applied_jobs"),
      where("jobId", "==", job.id)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(), //includes all fields user entered when applying
      }));
      setApplicants(apps);
    });

    return () => unsub();
  }, [job]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="applicant-popup-overlay">
      <div className="applicant-popup popup-wide">
        <div className="applicant-popup-header">
          <h2>Applicants for {job.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* List of applicants */}
        <div className="applicant-popup-body">
          <div className="applicant-list-column">
            {applicants.length === 0 ? (
              <p style={{ color: "#aaa" }}>No applicants yet.</p>
            ) : (
              applicants.map((app) => (
                <div
                  key={app.id}
                  className="applicant-card"
                  onClick={() => setSelectedApplicant(app)}
                >
                  <strong>{app.firstName} {app.lastName}</strong>
                  <p>{app.email}</p>
                  <p style={{ fontSize: "0.85em", color: "#888" }}>
                    Applied: {formatDate(app.appliedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        
        {/* Selected applicant details */}
          {selectedApplicant && (
            <div className="applicant-details-column">
              <h3>Applicant Details</h3>
              <p><strong>Name:</strong> {selectedApplicant.firstName} {selectedApplicant.lastName}</p>
              <p><strong>Email:</strong> {selectedApplicant.email}</p>
              <p><strong>Phone:</strong> {selectedApplicant.phone || "N/A"}</p>
              <p><strong>Address:</strong> {selectedApplicant.address || "N/A"}</p>
              <p><strong>State:</strong> {selectedApplicant.state || "N/A"}</p>
              <p><strong>Postcode:</strong> {selectedApplicant.postcode || "N/A"}</p>
              <p><strong>Notice Period:</strong> {selectedApplicant.noticePeriod || "N/A"}</p>
              <p><strong>Applied:</strong> {formatDate(selectedApplicant.appliedAt)}</p>
              {selectedApplicant.resumeUrl && (
                <p>
                  <strong>Resume:</strong>{" "}
                  <a
                    href={selectedApplicant.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#5b4bfa" }}
                  >
                    View / Download Resume
                  </a>
                </p>
              )}
              <button
                className="cancel-btn"
                onClick={() => setSelectedApplicant(null)}
              >
                Back to List
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
