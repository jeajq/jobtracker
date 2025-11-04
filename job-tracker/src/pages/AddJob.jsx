import React, { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import "../components/job-tracker.css";

export default function AddJob({ onClose, onAdd, user }) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    type: "",
    rate: "",
    deadline: "",
    address: "",
    state: "",
    postcode: "",
    description: "",
    phone: "",
    email: "",
    url: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");

  if (!user || user.type !== "employer") return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    const phoneRegex = /^\d{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      setError("Phone number must be exactly 10 digits.");
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setError("Please enter a valid email address (e.g., email@domain.com).");
      return false;
    }

    if (!formData.company.trim()) {
      setError("Company name is required.");
      return false;
    }

    setError("");
    return true;
  };

  const handleAddJob = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const jobsCollection = collection(db, "jobs");

      const jobData = {
        ...formData,
        company: formData.company.trim(),
        createdBy: user.email,
        createdAt: serverTimestamp(),
        source: "employer",
      };

      // Add job
      const docRef = await addDoc(jobsCollection, jobData);

      // Update jobId in the document
      await updateDoc(doc(db, "jobs", docRef.id), { jobId: docRef.id });

      // Notify parent (optional)
      if (onAdd) onAdd(); // just close popup if parent uses onSnapshot

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Reset form
      setFormData({
        title: "",
        company: "",
        type: "",
        rate: "",
        deadline: "",
        address: "",
        state: "",
        postcode: "",
        description: "",
        phone: "",
        email: "",
        url: "",
      });
      setError("");
    } catch (err) {
      console.error("Error adding job:", err);
      setError("Failed to add job. Please try again.");
    }
  };


  return (
    <div className="addjob-popup-overlay">
      <div className="addjob-dark-popup" onClick={(e) => e.stopPropagation()}>
        <div className="addjob-popup-header">
          <h2>Create New Job</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="addjob-popup-content">
          <form className="addjob-popup-form" onSubmit={handleAddJob}>
            <div className="addjob-form-grid">
              <input
                type="text"
                name="title"
                placeholder="Job Title"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="company"
                placeholder="Company Name"
                value={formData.company}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="type"
                placeholder="Job Type"
                value={formData.type}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="rate"
                placeholder="Rate"
                value={formData.rate}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="deadline"
                placeholder="Deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="postcode"
                placeholder="Postcode"
                value={formData.postcode}
                onChange={handleChange}
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="addjob-form-section">
              <h4>Contact Details</h4>
              <input
                type="text"
                name="phone"
                placeholder="Phone (10 digits)"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email (email@domain.com)"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="addjob-form-section">
              <h4>Additional Links</h4>
              <input
                type="text"
                name="url"
                placeholder="Company Site"
                value={formData.url}
                onChange={handleChange}
                required
              />
            </div>

            <div className="addjob-popup-buttons">
              <button type="submit" className="publish-btn">Publish</button>
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
            </div>

            {error && (
              <div
                className="form-error"
                style={{
                  color: "red",
                  marginTop: "15px",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}
          </form>

          <div className="addjob-preview-section">
            <h4>Preview</h4>
            <div className="addjob-preview-box">
              <h3>{formData.title || "Job Preview"}</h3>
              {formData.company && <p><strong>Company:</strong> {formData.company}</p>}
              {formData.type && <p><strong>Job Type:</strong> {formData.type}</p>}
              {formData.rate && <p><strong>Rate:</strong> {formData.rate}</p>}
              {formData.deadline && <p><strong>Deadline:</strong> {formData.deadline}</p>}
              {(formData.address || formData.state || formData.postcode) && (
                <p>
                  <strong>Address:</strong>{" "}
                  {[formData.address, formData.state, formData.postcode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              <p>{formData.description || "Job description will appear here..."}</p>
              {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
              {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
              {formData.url && <p><strong>Company Site:</strong> {formData.url}</p>}
            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="toast-success">
          <span>✅ Job added successfully!</span>
        </div>
      )}
    </div>
  );
}
