import React, { useState } from "react";
import { db, storage } from "../lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../components/job-tracker.css";

export default function ApplyJobPopup({ job, user, onClose, onApplied }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    state: "",
    postcode: "",
    phone: "",
    email: "",
    noticePeriod: "",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone" ? value.replace(/\D/g, "") : value,
    }));
    setError("");
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
      setError("");
    }
  };

  const validateForm = () => {
    for (const [key, value] of Object.entries(formData)) {
      if (!value.trim()) {
        setError(`${key.charAt(0).toUpperCase() + key.slice(1)} is required.`);
        return false;
      }
    }

    if (formData.phone.length < 10) {
      setError("Phone number must be at least 10 digits.");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Invalid email address.");
      return false;
    }

    if (!resumeFile) {
      setError("Please upload your resume.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!user?.uid) {
      setError("You must be logged in to apply.");
      return;
    }

    try {
      setUploading(true);

      //ensure job exists in Firestore db
      let jobRefId = job.jobId || job.firestoreId || null;
      if (!jobRefId) {
        const newJob = await addDoc(collection(db, "jobs"), {
          title: job.title || "Untitled Job",
          company: job.company || "Unknown Company",
          location: job.location || "N/A",
          url: job.url || "",
          description: job.description || "N/A",
          datePosted: job.datePosted || "N/A",
          role: job.role || "N/A",
          source: job.source || "seek",
          createdBy: job.createdBy || "system",
          createdAt: serverTimestamp(),
          status: "Active",
        });
        jobRefId = newJob.id;
      }

       //upload resume to Firebase storage
      const storageRef = ref(storage, `resumes/${user.uid}/${Date.now()}_${resumeFile.name}`);
      await uploadBytes(storageRef,resumeFile);
      const resumeUrl = await getDownloadURL(storageRef);

      //save job first in saved_jobs
      const savedRef = collection(db, "users", user.uid, "saved_jobs");
      const existing = await getDocs(query(savedRef, where("url", "==", job.url)));

      let savedJobId;
      if (!existing.empty) {
        const docRef = existing.docs[0].ref;
        await updateDoc(docRef, {
          applied: true,
          appliedAt: serverTimestamp(),
          jobId: jobRefId,
        });
        savedJobId = existing.docs[0].id;
      } else {
        const newSaved = await addDoc(savedRef, {
          jobId: jobRefId,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          datePosted: job.datePosted || "N/A",
          role: job.role || "N/A",
          description: job.description || "N/A",
          savedAt: serverTimestamp(),
          applied: true,
          appliedAt: serverTimestamp(),
        });
        savedJobId = newSaved.id;
      }

      //add to applied_jobs
      const appliedRef = collection(db, "users", user.uid, "applied_jobs");
      await addDoc(appliedRef, {
        jobId: jobRefId,
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url || "",
        appliedAt: serverTimestamp(),
        status: "applied",
        ...formData,
        resumeName: resumeFile.name,
        resumeUrl,
        linkedSavedId: savedJobId, 
      });

      //add to employer’s job record
      if (job.source === "employer" && jobRefId) {
        await addDoc(collection(db, "jobs", jobRefId, "applied_jobs"), {
          userId: user.uid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          resumeUrl,
          appliedAt: serverTimestamp(),
        });
      }

      //success feedback
      setSubmitted(true);
      if (onApplied)
        onApplied({ ...job, jobId: jobRefId, firestoreId: savedJobId, applied: true });

      setTimeout(onClose, 1500);
    } catch (err) {
      console.error("Error submitting application:", err);
      setError(`Failed to submit application: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="apply-popup-overlay">
      <div className="apply-dark-popup">
        <div className="apply-popup-header">
          <h2>Apply for {job.title}</h2>
          <button className="apply-close-btn" onClick={onClose}>×</button>
        </div>

        <form className="apply-popup-form" onSubmit={handleSubmit}>
          <div className="apply-form-grid">
            {Object.keys(formData).map((key) => (
              <input
                key={key}
                type={key === "email" ? "email" : "text"}
                name={key}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                value={formData[key]}
                onChange={handleChange}
                required
              />
            ))}

            <div className="apply-resume-upload">
              <button
                type="button"
                className="apply-jt-btn-upload"
                onClick={() => document.getElementById("resumeInput").click()}
              >
                Upload Resume
              </button>
              <span className="apply-resume-filename">
                {resumeFile ? resumeFile.name : "No file selected"}
              </span>
              <input
                type="file"
                id="resumeInput"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="apply-popup-buttons">
            <button type="submit" className="apply-publish-btn" disabled={uploading}>
              {uploading ? "Uploading..." : "Submit Application"}
            </button>
            <button type="button" className="apply-cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>

          {submitted && <div className="toast-success">✅ Application submitted!</div>}
        </form>
      </div>
    </div>
  );
}
