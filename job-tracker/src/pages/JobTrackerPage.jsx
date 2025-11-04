import React, { useEffect, useState } from "react";
import "../components/jobBoard.css";
import Sidebar from "../components/sidebar.jsx";
import JobColumn from "../components/JobColumn.jsx";
import { db } from "../lib/firebase.js";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
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

  const dragRef = React.useRef({ colId: null, index: null });
  const isUpdating = React.useRef(false);

  // Live snapshot per column
  useEffect(() => {
    const unsubs = COLUMNS.map(({ id }) => {
      const q = query(collection(db, "jobs"), where("status", "==", id), orderBy("order", "asc"));
      return onSnapshot(
        q,
        (snap) => {
          if (isUpdating.current) return;
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setBoard((prev) => ({ ...prev, [id]: rows }));
        },
        (err) => console.error(`[JT] onSnapshot error for ${id}:`, err)
      );
    });

    return () => unsubs.forEach((u) => u && u());
  }, []);

  // Drag & drop helpers
  function handleDragStart(colId, index, e) {
    dragRef.current = { colId, index };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${colId}:${index}`);
  }

  function handleDropToPosition(targetColId, targetIndex, e) {
    e.preventDefault();
    e.stopPropagation();
    const { colId: fromColId, index: fromIndex } = dragRef.current || {};
    if (fromColId == null || fromIndex == null) return;

    if (fromColId === targetColId && (fromIndex === targetIndex || fromIndex + 1 === targetIndex)) {
      dragRef.current = { colId: null, index: null };
      return;
    }

    setBoard((prev) => {
      const next = structuredClone(prev);
      const fromCards = next[fromColId];
      const toCards = next[targetColId];
      if (!fromCards[fromIndex]) return prev;
      const [moved] = fromCards.splice(fromIndex, 1);
      if (toCards.some((c) => c.id === moved.id)) return prev;

      moved.status = targetColId;
      const insertIndex =
        fromColId === targetColId && fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
      toCards.splice(insertIndex, 0, moved);

      // Persist changes
      isUpdating.current = true;
      const batch = writeBatch(db);
      [fromColId, targetColId].forEach((cid) => {
        next[cid].forEach((card, idx) => {
          batch.update(doc(db, "jobs", card.id), {
            order: idx,
            status: cid,
            updatedAt: serverTimestamp(),
          });
        });
      });
      batch
        .commit()
        .catch(console.error)
        .finally(() => setTimeout(() => (isUpdating.current = false), 300));

      return next;
    });

    dragRef.current = { colId: null, index: null };
  }

  function handleDropToEnd(toColId, e) {
    e.preventDefault();
    e.stopPropagation();
    const { colId: fromColId, index: fromIndex } = dragRef.current || {};
    if (fromColId == null || fromIndex == null) return;

    setBoard((prev) => {
      const next = structuredClone(prev);
      const fromCards = next[fromColId];
      const toCards = next[toColId];
      if (!fromCards[fromIndex]) return prev;

      const [moved] = fromCards.splice(fromIndex, 1);
      if (toCards.some((c) => c.id === moved.id)) return prev;
      moved.status = toColId;
      toCards.push(moved);

      isUpdating.current = true;
      const batch = writeBatch(db);
      [fromColId, toColId].forEach((cid) => {
        next[cid].forEach((card, idx) => {
          batch.update(doc(db, "jobs", card.id), {
            order: idx,
            status: cid,
            updatedAt: serverTimestamp(),
          });
        });
      });
      batch
        .commit()
        .catch(console.error)
        .finally(() => setTimeout(() => (isUpdating.current = false), 300));

      return next;
    });
  }

  async function handleDeleteJob(id) {
    setBoard((prev) => {
      const next = { ...prev };
      for (const col in next) next[col] = next[col].filter((j) => j.id !== id);
      return next;
    });
    await deleteDoc(doc(db, "jobs", id));
  }

  async function handleSaveNote(jobId, noteText) {
    setBoard((prev) => {
      const next = structuredClone(prev);
      for (const col in next) {
        next[col] = next[col].map((j) => (j.id === jobId ? { ...j, note: noteText } : j));
      }
      return next;
    });
    try {
      await updateDoc(doc(db, "jobs", jobId), { note: noteText, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error("note save failed:", err);
      alert("Couldn't save note");
    }
  }

  return (
    <div className="jt-app">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="jt-main">
        <header className="jt-topbar">
          <div className="jt-welcome">
            {user?.firstName && user?.lastName ? (
              <h2>
                Welcome, {user.firstName} {user.lastName}
              </h2>
            ) : (
              <h2>Welcome!</h2>
            )}
          </div>

          <div className="jt-topbar-actions">
            <div
              title="Profile"
              ref={avatarRef}
              onClick={onProfileClick}
              style={{ cursor: "pointer" }}
            >
              <FontAwesomeIcon icon={faCircleUser} size="lg" />
            </div>
          </div>
        </header>

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
              onDelete={handleDeleteJob}
              onAddNote={handleSaveNote}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
