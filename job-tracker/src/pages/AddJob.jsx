import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import "../components/job-tracker.css";

export default function AddJob({ onClose, onAdd, user }) {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    rate: "",
    deadline: "",
    address: "",
    state: "",
    postcode: "",
    description: "",
    phone: "",
    email: "",
    companySite: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");

  if (!user || user.type !== "employer") return null;

  // const handleChange = (e) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  const handleChange = (e) => {
  const { name, value } = e.target;

  // Restrict phone input to numbers only
  if (name === "phone") {
      // remove any non-digit characters
      const numericValue = value.replace(/\D/g, "");
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  //INPUT VALIDATION

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

    setError("");
    return true;
  };

  const handleAddJob = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const jobsCollection = collection(db, "jobs");

      const docRef = await addDoc(jobsCollection, {
        ...formData,
        createdBy: user.email,
        createdAt: new Date(),
      });

      if (onAdd) onAdd({ id: docRef.id, ...formData, createdBy: user.email });

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      setFormData({
        title: "",
        type: "",
        rate: "",
        deadline: "",
        address: "",
        state: "",
        postcode: "",
        description: "",
        phone: "",
        email: "",
        companySite: "",
      });
    } catch (err) {
      console.error("Error adding job:", err);
      setError("Failed to add job. Please try again.");
    }
  };

  return (
    <div className="popup-overlay">
      <div className="dark-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>Create New Job</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="popup-content">
          <form className="popup-form" onSubmit={handleAddJob}>
            <div className="form-grid">
              <input type="text" name="title" placeholder="Job Title" value={formData.title} onChange={handleChange} required />
              <input type="text" name="type" placeholder="Job Type" value={formData.type} onChange={handleChange} />
              <input type="text" name="rate" placeholder="Rate" value={formData.rate} onChange={handleChange} />
              <input type="text" name="deadline" placeholder="Deadline" value={formData.deadline} onChange={handleChange} />
              <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} />
              <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange} />
              <input type="text" name="postcode" placeholder="Postcode" value={formData.postcode} onChange={handleChange} />
              <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
            </div>

            <div className="form-section">
              <h4>Contact Details</h4>
              <input type="text" name="phone" placeholder="Phone (10 digits)" value={formData.phone} onChange={handleChange} />
              <input type="email" name="email" placeholder="Email (email@domain.com)" value={formData.email} onChange={handleChange} />
            </div>

            <div className="form-section">
              <h4>Additional Links</h4>
              <input type="text" name="companySite" placeholder="Company Site" value={formData.companySite} onChange={handleChange} />
            </div>

            <div className="popup-buttons">
              <button type="submit" className="publish-btn">Publish</button>
              <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            </div>

            {/* Error displayed at the bottom of the popup */}
            {error && (
              <div className="form-error" style={{ color: "red", marginTop: "15px", textAlign: "center" }}>
                {error}
              </div>
            )}
          </form>

          <div className="preview-section">
            <h4>Preview</h4>
            <div className="preview-box">
              <h3>{formData.title || "Job Preview"}</h3>
              {formData.type && <p><strong>Job Type:</strong> {formData.type}</p>}
              {formData.rate && <p><strong>Rate:</strong> {formData.rate}</p>}
              {formData.deadline && <p><strong>Deadline:</strong> {formData.deadline}</p>}
              {(formData.address || formData.state || formData.postcode) && (
                <p><strong>Address:</strong>{" "} {[formData.address, formData.state, formData.postcode].filter(Boolean).join(", ")}</p>
              )}
              <p>{formData.description || "Job description will appear here..."}</p>
              {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
              {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
              {formData.companySite && <p><strong>Company Site:</strong> {formData.companySite}</p>}
            </div>
          </div>

          {showToast && (
            <div className="toast-success">
              <span>✅ Job added successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
