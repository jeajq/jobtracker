import React, { useEffect, useState, useRef } from "react";
import "../components/jobBoard.css";
import "../components/job-tracker.css";
import Sidebar from "../components/sidebar.jsx";
import JobColumn from "../components/JobColumn.jsx";
import { db } from "../lib/firebase.js";
import {
  collection,
  onSnapshot,
  writeBatch,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-regular-svg-icons";

const COLUMNS = [
  { id: "applied", label: "Applied" },
  { id: "assessment", label: "Assessment" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

export default function JobTrackerPage({ user, onLogout, avatarRef, onProfileClick }) {
  const [board, setBoard] = useState({
    applied: [],
    assessment: [],
    interview: [],
    offer: [],
    rejected: [],
  });

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const dragRef = useRef({ colId: null, index: null });
  const isUpdating = useRef(false);

  //load applied jobs
  useEffect(() => {
    if (!user?.uid) return;

    const jobsRef = collection(db, "users", user.uid, "applied_jobs");
    const unsubscribe = onSnapshot(
      jobsRef,
      (snapshot) => {
        if (isUpdating.current) return;

        const jobs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            status: data.status || "applied",
            position: data.position ?? 0,
          };
        });

        const newBoard = { applied: [], assessment: [], interview: [], offer: [], rejected: [] };
        jobs.forEach((job) => {
          const col = COLUMNS.find((c) => c.id === job.status) ? job.status : "applied";
          newBoard[col].push(job);
        });

        Object.keys(newBoard).forEach((col) => {
          newBoard[col].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        });

        setBoard(newBoard);
      },
      (err) => console.error("Error fetching applied_jobs:", err)
    );

    return () => unsubscribe();
  }, [user?.uid]);

  //Drag & drop
  const handleDragStart = (colId, index, e) => {
    dragRef.current = { colId, index };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropToPosition = (targetColId, targetIndex, e) => {
    e.preventDefault();
    e.stopPropagation();
    const { colId: fromColId, index: fromIndex } = dragRef.current || {};
    if (fromColId == null || fromIndex == null) return;

    setBoard((prev) => {
      const next = structuredClone(prev);
      const [moved] = next[fromColId].splice(fromIndex, 1);
      moved.status = targetColId;
      next[targetColId].splice(targetIndex, 0, moved);
      persistBoard(next);
      return next;
    });

    dragRef.current = { colId: null, index: null };
  };

  const handleDropToEnd = (toColId, e) => {
    e.preventDefault();
    const { colId: fromColId, index: fromIndex } = dragRef.current || {};
    if (fromColId == null || fromIndex == null) return;

    setBoard((prev) => {
      const next = structuredClone(prev);
      const [moved] = next[fromColId].splice(fromIndex, 1);
      moved.status = toColId;
      next[toColId].push(moved);
      persistBoard(next);
      return next;
    });

    dragRef.current = { colId: null, index: null };
  };

  const persistBoard = (nextBoard) => {
    isUpdating.current = true;
    const batch = writeBatch(db);
    Object.keys(nextBoard).forEach((col) =>
      nextBoard[col].forEach((job, idx) => {
        batch.update(doc(db, "users", user.uid, "applied_jobs", job.id), {
          status: job.status,
          position: idx,
          updatedAt: serverTimestamp(),
        });
      })
    );
    batch.commit().finally(() => setTimeout(() => (isUpdating.current = false), 300));
  };

  //delete job (also deletes saved job if linked)
  const handleDeleteJob = async () => {
    if (!jobToDelete || !user?.uid) return;

    //remove from UI immediately
    setBoard((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((col) => {
        next[col] = next[col].filter((j) => j.id !== jobToDelete.id);
      });
      return next;
    });

    try {
      await deleteDoc(doc(db, "users", user.uid, "applied_jobs", jobToDelete.id));

      if (jobToDelete.linkedSavedId) {
        await deleteDoc(doc(db, "users", user.uid, "saved_jobs", jobToDelete.linkedSavedId));
      }

      setToast("🗑️ Job deleted successfully!");
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Failed to delete job.");
    } finally {
      setJobToDelete(null);
      setShowDeletePopup(false);
    }
  };

  //save note
  const handleSaveNote = async (docId, noteText) => {
    if (!user?.uid || !docId || typeof noteText !== "string") return;

    setBoard((prev) => {
      const next = structuredClone(prev);
      Object.keys(next).forEach((col) => {
        next[col] = next[col].map((job) =>
          job.id === docId ? { ...job, note: noteText } : job
        );
      });
      return next;
    });

    isUpdating.current = true;
    try {
      const jobRef = doc(db, "users", user.uid, "applied_jobs", docId);
      await updateDoc(jobRef, { note: noteText, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error("Error saving note:", err);
      alert("Failed to save note.");
    } finally {
      setTimeout(() => (isUpdating.current = false), 300);
    }
  };

  return (
    <div className="jt-app">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="jt-main">
        <header className="jt-topbar">
          <div className="jt-welcome">
            <h2>Welcome, {user?.firstName} {user?.lastName}</h2>
          </div>
          <div className="jt-topbar-actions">
            <div title="Profile" ref={avatarRef} onClick={onProfileClick} style={{ cursor: "pointer" }}>
              <FontAwesomeIcon icon={faCircleUser} size="lg" />
            </div>
          </div>
        </header>

        {/* Toast popup */}
        {toast && <div className="toast-success">{toast}</div>}

        <section className="jt-board">
          {COLUMNS.map(({ id, label }) => (
            <JobColumn
              key={id}
              id={id}
              title={label}
              cards={board[id]}
              count={board[id].length}
              onDragStart={handleDragStart}
              onDropBefore={(index, e) => handleDropToPosition(id, index, e)}
              onDropEnd={(e) => handleDropToEnd(id, e)}
              onDelete={(job) => { setJobToDelete(job); setShowDeletePopup(true); }}
              onAddNote={handleSaveNote}
            />
          ))}
        </section>

        {showDeletePopup && (
          <div className="delete-popup-overlay">
            <div className="delete-popup">
              <div className="delete-popup-header">
                <h2>Confirm Deletion</h2>
                <button className="close-btn" onClick={() => setShowDeletePopup(false)}>×</button>
              </div>
              <div className="delete-popup-content">
                <p>Are you sure you want to delete this job?</p>
                <div className="delete-popup-buttons">
                  <button className="delete-job-btn" onClick={handleDeleteJob}>Yes, Delete</button>
                  <button className="cancel-btn" onClick={() => setShowDeletePopup(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
