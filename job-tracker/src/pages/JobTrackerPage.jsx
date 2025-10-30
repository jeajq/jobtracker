// src/components/JobTrackerPage.jsx
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
} from "firebase/firestore";

const COLUMNS = [
    { id: "applied", label: "Applied" },
    { id: "assessment", label: "Assessment" },
    { id: "interview", label: "Interview" },
    { id: "offer", label: "Offer" },
    { id: "rejected", label: "Rejected" },
];

export default function JobTrackerPage({ user }) {
    const [board, setBoard] = useState({
        applied: [], assessment: [], interview: [], offer: [], rejected: []
    });
    const [search, setSearch] = useState("");

    const dragRef = useRef({ colId: null, index: null });
    const isUpdating = useRef(false);

    // --- live subscriptions per column ---
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
                    if (isUpdating.current) return; 
                    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    setBoard((prev) => ({ ...prev, [id]: rows }));
                },
                (err) => console.error(`[JT] onSnapshot error for ${id}:`, err)
            );
        });

        return () => unsubs.forEach((u) => u());
    }, []);

    // ---------- DnD handlers ----------
    function handleDragStart(colId, index, e) {
        dragRef.current = { colId, index };
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `${colId}:${index}`);
    }

    async function persistReorder(fromColId, toColId, nextBoardState) {
        const batch = writeBatch(db);
        const colsToWrite = new Set([fromColId, toColId]);

        colsToWrite.forEach((colId) => {
            nextBoardState[colId].forEach((card, idx) => {
                const ref = doc(db, "jobs", card.id);
                const payload = { order: idx, updatedAt: serverTimestamp() };
                if (card.status !== colId) payload.status = colId;
                batch.update(ref, payload);
            });
        });

        await batch.commit();
    }

    function handleDropToPosition(targetColId, targetIndex, e) {
        e.preventDefault();
        e.stopPropagation(); 

        const { colId: fromColId, index: fromIndex } = dragRef.current || {};
        if (fromColId == null || fromIndex == null) return;
  
        if (
            fromColId === targetColId &&
            (fromIndex === targetIndex || fromIndex + 1 === targetIndex)
        ) {
            dragRef.current = { colId: null, index: null };
            return;
        }

        setBoard(prev => {
            const next = structuredClone(prev);
            const [moved] = next[fromColId].splice(fromIndex, 1);

            const insertIndex =
                fromColId === targetColId && fromIndex < targetIndex
                    ? targetIndex - 1
                    : targetIndex;

            moved.status = targetColId;
            next[targetColId].splice(insertIndex, 0, moved);

            isUpdating.current = true;
            persistReorder(fromColId, targetColId, next)
                .catch(console.error)
                .finally(() => setTimeout(() => (isUpdating.current = false), 300));

            return next;
        });

        dragRef.current = { colId: null, index: null };
    }

    function handleDropToEnd(toColId, e) {
        e.preventDefault();

        const { colId: fromColId, index } = dragRef.current || {};
        if (fromColId == null || index == null) return;

        if (fromColId === toColId && index === board[toColId].length - 1) {
            dragRef.current = { colId: null, index: null };
            return;
        }

        const moved = board[fromColId][index];
        if (!moved) return;

        const next = {
            ...board,
            [fromColId]: board[fromColId].filter((_, i) => i !== index),
            [toColId]: [...board[toColId], { ...moved, status: toColId }],
        };
        setBoard(next);

        isUpdating.current = true;
        updateDoc(doc(db, "jobs", moved.id), {
            status: toColId,
            order: next[toColId].length - 1,
            updatedAt: serverTimestamp(),
        })
            .catch(console.error)
            .finally(() => setTimeout(() => (isUpdating.current = false), 300));

        dragRef.current = { colId: null, index: null };
    }

    // ---------- search helper ----------
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
      <Sidebar user={user}/>

      <main className="jt-main">
        <header className="jt-topbar">
          <input
            className="jt-search"
            placeholder="Search jobs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
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
              onDropEnd={e => handleDropToEnd(id, e)}
            />
          ))}
        </section>
      </main>
    </div>
  );
}