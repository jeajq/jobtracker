import React, { useState, useEffect } from "react";
import "../components/job-tracker.css";
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export default function SavedJobsPage({ user }) {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  //real-time listener for saved jobs
  useEffect(() => {
    if (!user?.uid) {
      setSaved([]);
      setLoading(false);
      return;
    }

    const savedRef = collection(db, "users", user.uid, "saved_jobs");
    const q = query(savedRef, orderBy("savedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobs = snapshot.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
        setSaved(jobs);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading saved jobs:", error);
        setSaved([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  //remove saved job (and applied job if exists)
  const removeSaved = async (job) => {
    if (!user?.uid || !job?.firestoreId) return;

    try {
      //delete from saved_jobs
      const savedJobRef = doc(db, "users", user.uid, "saved_jobs", job.firestoreId);
      await deleteDoc(savedJobRef);

      //delete from applied_jobs if it exists (match by URL)
      const appliedQuery = query(collection(db, "users", user.uid, "applied_jobs"));
      const appliedSnapshot = await getDocs(appliedQuery);

      const batchDeletes = [];
      appliedSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.url === job.url) {
          batchDeletes.push(deleteDoc(doc(db, "users", user.uid, "applied_jobs", docSnap.id)));
        }
      });

      await Promise.all(batchDeletes);

      setToast("✅ Job removed successfully!");
      setTimeout(() => setToast(null), 4000);

    } catch (err) {
      console.error("Error removing job:", err);
      alert("Failed to remove job.");
    }
  };

  //apply job
  const applyJob = async (job) => {
    if (!user?.uid) return alert("Please log in to track applications.");

    try {
      const appliedJobsRef = collection(db, "users", user.uid, "applied_jobs");
      const snapshot = await getDocs(appliedJobsRef);
      const nextPosition = snapshot.size;

      await addDoc(appliedJobsRef, {
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        datePosted: job.datePosted,
        role: job.role,
        description: job.description,
        appliedAt: serverTimestamp(),
        status: "applied",
        position: nextPosition,
      });

      //ensure job exists in saved_jobs
      if (job.firestoreId) {
        const savedJobRef = doc(db, "users", user.uid, "saved_jobs", job.firestoreId);
        await updateDoc(savedJobRef, { applied: true, appliedAt: serverTimestamp() });
      } else {
        //add to saved_jobs if not already there
        const savedJobsRef = collection(db, "users", user.uid, "saved_jobs");
        const savedDocRef = await addDoc(savedJobsRef, {
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          datePosted: job.datePosted,
          role: job.role,
          description: job.description,
          savedAt: serverTimestamp(),
          applied: true,
          appliedAt: serverTimestamp(),
        });

        job.firestoreId = savedDocRef.id; //update local job object
      }

      //update local state
      setSaved((prev) => {
        // Add job if it wasn’t in saved yet
        if (!prev.find((j) => j.url === job.url)) {
          return [{ firestoreId: job.firestoreId, ...job }, ...prev];
        }
        //otherwise update applied status
        return prev.map((j) =>
          j.url === job.url ? { ...j, applied: true, appliedAt: new Date() } : j
        );
      });

      setToast(`✅ Application for "${job.title}" tracked!`);
      setTimeout(() => setToast(null), 4000);

      window.open(job.url, "_blank");
    } catch (err) {
      console.error("Error applying to job:", err);
      alert("Could not track application.");
    }
  };


  return (
    <div className="jt-app">
      <aside className="jt-sidebar">
        <div className="jt-logo">job.tracker</div>
        <nav className="jt-nav">
          <a className="jt-nav-item" href="#board"><span>Job Board</span></a>
          <a className="jt-nav-item" href="#search"><span>Job Search</span></a>
          <a className="jt-nav-item active" href="#saved"><span>Saved Jobs</span></a>
        </nav>
        <div className="jt-logout">Log Out ⟶</div>
      </aside>

      <main className="jt-main">
        <header className="jt-topbar">
          <input className="jt-search" placeholder="Search saved jobs..." />
        </header>

        <section className="jt-results scrollable">
          {loading ? (
            <div className="jt-loading-center">
              <div className="jt-spinner"></div>
              <div>Loading saved jobs…</div>
            </div>
          ) : saved.length === 0 ? (
            <div className="jt-empty-center">
              <div>Nothing here!</div>
              <button
                className="jt-primary"
                onClick={() => (window.location.hash = "#search")}
              >
                Find Jobs
              </button>
            </div>
          ) : (
            <>
              <div className="jt-results-head">Saved Jobs ({saved.length})</div>
              <ul className="jt-list">
                {saved.map((job) => (
                  <li className="jt-list-item" key={job.firestoreId}>
                    <div className="jt-list-main">
                      <div className="jt-line">
                        <span className="jt-jobtitle">{job.title}</span>
                        <span className="jt-dash">—</span>
                        <span className="jt-company">{job.company}</span>
                      </div>
                      <div className="jt-role">{job.role}</div>
                      <div className="jt-desc">{job.description}</div>
                    </div>
                    <div className="jt-meta">
                      <span className="jt-date">Date posted: {job.datePosted || "N/A"}</span>
                      <div className="jt-actions">
                        <button
                          className="jt-btn-apply"
                          onClick={() => applyJob(job)}
                          disabled={job.applied}
                        >
                          {job.applied ? "Applied ✅" : "Apply"}
                        </button>
                        <button
                          className="jt-btn-remove jt-btn-red"
                          title="Remove"
                          onClick={() => removeSaved(job)}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>

      {toast && (
        <div className="toast-success">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
