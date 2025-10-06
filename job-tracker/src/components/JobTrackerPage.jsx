// src/components/JobTrackerPage.jsx
import React, { useEffect, useState, useRef } from "react";
import "./job-tracker.css";
import JobColumn from "./JobColumn.jsx";
import { db } from "../lib/firebase.js";
import {
    collection,
    onSnapshot,
    query,
    where,
    //getDocs,
    orderBy,
    writeBatch, doc
} from "firebase/firestore";

const COLUMNS = [
    { id: "applied", label: "Applied" },
    { id: "assessment", label: "Assessment" },
    { id: "interview", label: "Interview" },
    { id: "offer", label: "Offer" },
    { id: "rejected", label: "Rejected" },
];
export default function JobTracker() {
  const [board, setBoard] = useState({
    applied: [], assessment: [], interview: [], offer: [], rejected: []
  });
  const [search, setSearch] = useState("");

  // keep drag source here
  const dragRef = useRef({ colId: null, index: null });

  // --- live subscriptions per column (ordered) ---
  useEffect(() => {
    const unsubs = COLUMNS.map(({ id }) => {
      const q = query(
        collection(db, "jobs"),
        where("status", "==", id),
        orderBy("order", "asc")
      );
      return onSnapshot(q, snap => {
        setBoard(prev => ({
          ...prev,
          [id]: snap.docs.map(d => ({ id: d.id, ...d.data() }))
        }));
      });
    });
    return () => unsubs.forEach(u => u());
  }, []);

  // ---------- DnD handlers ----------
  function handleDragStart(colId, index, e) {
    dragRef.current = { colId, index };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${colId}:${index}`); // Firefox
  }

  async function persistReorder(fromColId, toColId, nextBoardState) {
    // write new order (and possibly status) to Firestore
    const batch = writeBatch(db);

    // reindex both affected columns
    const colsToWrite = new Set([fromColId, toColId]);
    colsToWrite.forEach(colId => {
      nextBoardState[colId].forEach((card, idx) => {
        const ref = doc(db, "jobs", card.id);
        const payload = { order: idx };
        if (card.status !== colId) payload.status = colId; // safety
        batch.update(ref, payload);
      });
    });

    await batch.commit();
  }

  // drop BEFORE a specific index
  async function handleDropToPosition(targetColId, targetIndex, e) {
    e.preventDefault();
    const { colId: fromColId, index: fromIndex } = dragRef.current;
    if (fromColId == null || fromIndex == null) return;

    // optimistic update
    setBoard(prev => {
      const next = structuredClone(prev);

      const [moved] = next[fromColId].splice(fromIndex, 1);
      // when moving within same column and dropping after itself, adjust
      const insertIndex =
        fromColId === targetColId && fromIndex < targetIndex
          ? targetIndex - 1
          : targetIndex;

      moved.status = targetColId; // reflect new column in local state
      next[targetColId].splice(insertIndex, 0, moved);

      // persist in background
      persistReorder(fromColId, targetColId, next).catch(console.error);
      return next;
    });

    dragRef.current = { colId: null, index: null };
  }

  // drop to column END
  async function handleDropToEnd(targetColId, e) {
    e.preventDefault();
    const { colId: fromColId, index: fromIndex } = dragRef.current;
    if (fromColId == null || fromIndex == null) return;

    setBoard(prev => {
      const next = structuredClone(prev);
      const [moved] = next[fromColId].splice(fromIndex, 1);
      moved.status = targetColId;
      next[targetColId].push(moved);
      persistReorder(fromColId, targetColId, next).catch(console.error);
      return next;
    });

    dragRef.current = { colId: null, index: null };
  }

  // ---------- search helper ----------
  const filtered = (cards) => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(c =>
      (c.title||"").toLowerCase().includes(q) ||
      (c.company||"").toLowerCase().includes(q) ||
      (c.type||"").toLowerCase().includes(q) ||
      (c.description||"").toLowerCase().includes(q)
    );
  };

  return (
    <div className="jt-app">
      <aside className="jt-sidebar">
        <div className="jt-logo">job.tracker</div>
        <nav className="jt-nav">
          <a className="jt-nav-item active" href="#board"><span>Job Board</span></a>
          <a className="jt-nav-item" href="#search"><span>Job Search</span></a>
          <a className="jt-nav-item" href="#saved"><span>Saved Jobs</span></a>
        </nav>
        <div className="jt-logout">Log Out ⟶</div>
      </aside>

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
            <div className="jt-gear" title="Settings">⚙︎</div>
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
            />
          ))}
        </section>
      </main>
    </div>
  );
}