// src/pages/JobTrackerPage.jsx
import React, { useEffect, useState, useRef } from "react";
import "../components/job-tracker.css";
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

const COLUMNS = [
  { id: "applied", label: "Applied" },
  { id: "assessment", label: "Assessment" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

export default function JobTrackerPage({ user, onLogout }) {
  const [board, setBoard] = useState({
    applied: [],
    assessment: [],
    interview: [],
    offer: [],
    rejected: [],
  });
  const [search, setSearch] = useState("");

  const dragRef = useRef({ colId: null, index: null });
  const isUpdating = useRef(false);

  // live snapshot per column
  useEffect(() => {
    const unsubs = COLUMNS.map(({ id }) => {
      const q = query(
        collection(db, "jobs"),
        where("status", "==", id),
        orderBy("order", "asc")
      );

      return onSnapshot(
        q,
        (snap) => {
          if (isUpdating.current) return; // avoid flicker during reorder
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setBoard((prev) => ({ ...prev, [id]: rows }));
        },
        (err) => console.error(`[JT] onSnapshot error for ${id}:`, err)
      );
    });

    return () => unsubs.forEach((u) => u && u());
  }, []);

  // drag start
  function handleDragStart(colId, index, e) {
    dragRef.current = { colId, index };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${colId}:${index}`); // firefox safety
  }

  // drop BEFORE a specific index
  function handleDropToPosition(targetColId, targetIndex, e) {
    e.preventDefault();
    e.stopPropagation();

    const { colId: fromColId, index: fromIndex } = dragRef.current || {};
    if (fromColId == null || fromIndex == null) return;

    // no-op drag (drop in same spot)
    if (
      fromColId === targetColId &&
      (fromIndex === targetIndex || fromIndex + 1 === targetIndex)
    ) {
      dragRef.current = { colId: null, index: null };
      return;
    }

    setBoard((prev) => {
      const next = structuredClone(prev);
      const fromCards = next[fromColId];
      const toCards = next[targetColId];

      if (!fromCards[fromIndex]) return prev;

      const [moved] = fromCards.splice(fromIndex, 1);

      // don't insert if it's somehow already in toCards
      if (toCards.some((c) => c.id === moved.id)) return prev;

      moved.status = targetColId;

      const insertIndex =
        fromColId === targetColId && fromIndex < targetIndex
          ? targetIndex - 1
          : targetIndex;

      toCards.splice(insertIndex, 0, moved);

      // persist new order for both affected columns
      isUpdating.current = true;
      const batch = writeBatch(db);
      const updateCols = new Set([fromColId, targetColId]);

      updateCols.forEach((cid) => {
        next[cid].forEach((card, idx) => {
          const ref = doc(db, "jobs", card.id);
          batch.update(ref, {
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

  // drop to END of a column
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

      // skip duplicate if already in target col
      if (toCards.some((c) => c.id === moved.id)) return prev;

      moved.status = toColId;
      toCards.push(moved);

      // persist new order for both cols
      isUpdating.current = true;
      const batch = writeBatch(db);
      const updateCols = new Set([fromColId, toColId]);

      updateCols.forEach((cid) => {
        next[cid].forEach((card, idx) => {
          const ref = doc(db, "jobs", card.id);
          batch.update(ref, {
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

  // delete job locally after Firestore delete (Firestore snapshot will also catch up)
  async function handleDeleteJob(id) {
    // remove immediately from UI so it feels snappy:
    setBoard((prev) => {
      const next = { ...prev };
      for (const col in next) {
        next[col] = next[col].filter((j) => j.id !== id);
      }
      return next;
    });

    // also delete in Firestore to make it permanent
    await deleteDoc(doc(db, "jobs", id));
  }

  // save note locally AND in Firestore
  async function handleSaveNote(jobId, noteText) {
    // optimistic UI update
    setBoard((prev) => {
      const next = structuredClone(prev);
      for (const col in next) {
        next[col] = next[col].map((j) =>
          j.id === jobId ? { ...j, note: noteText } : j
        );
      }
      return next;
    });

    // persist to Firestore
    try {
      await updateDoc(doc(db, "jobs", jobId), {
        note: noteText,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("note save failed:", err);
      alert("Couldn't save note");
    }
  }

  // search filter
  const filtered = (cards) => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.type || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  };

  return (
    <div className="jt-app">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="jt-main">
        <header className="jt-topbar">
          <input
            className="jt-search"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="jt-topbar-actions">
            <div className="jt-avatar" title="Profile" />
            <div className="jt-gear" title="Settings">
              ⚙︎
            </div>
          </div>
        </header>

        <section className="jt-board">
          {COLUMNS.map(({ id, label }) => (
            <JobColumn
              key={id}
              id={id}
              title={label}
              cards={filtered(board[id])}
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