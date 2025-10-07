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
    orderBy,          // keep if you want ordered columns
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

export default function JobTracker() {
    const [board, setBoard] = useState({
        applied: [], assessment: [], interview: [], offer: [], rejected: []
    });
    const [search, setSearch] = useState("");

    // ✅ Hooks must be inside the component
    const dragRef = useRef({ colId: null, index: null });
    const isUpdating = useRef(false);

    // --- live subscriptions per column (ordered) ---
    useEffect(() => {
        const unsubs = COLUMNS.map(({ id }) => {
            const q = query(
                collection(db, "jobs"),
                where("status", "==", id),
                orderBy("order", "asc")      // remove this if you haven't created the index yet
            );

            return onSnapshot(
                q,
                (snap) => {
                    if (isUpdating.current) return; // skip echo during writes
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
        e.dataTransfer.setData("text/plain", `${colId}:${index}`); // Firefox
    }

    async function persistReorder(fromColId, toColId, nextBoardState) {
        // write new order (and possibly status) to Firestore
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

    // drop BEFORE a specific index
    // BEFORE a specific index
    function handleDropToPosition(targetColId, targetIndex, e) {
        e.preventDefault();
        e.stopPropagation(); // 👈 prevent parent onDrop from firing

        const { colId: fromColId, index: fromIndex } = dragRef.current || {};
        if (fromColId == null || fromIndex == null) return;

        // 🔒 No-op moves:
        // - same column & same slot
        // - same column & "drop just after itself" (equivalent position)
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

    // drop to column END
    function handleDropToEnd(toColId, e) {
        e.preventDefault();

        const { colId: fromColId, index } = dragRef.current || {};
        if (fromColId == null || index == null) return;

        // 🔒 No-op: already at end of same column
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