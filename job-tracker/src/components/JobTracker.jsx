// src/components/JobTracker.jsx
import React, { useEffect, useState } from "react";
import "./job-tracker.css";
import JobColumn from "./JobColumn";
import { db } from "../lib/firebase.js";
import {
    collection,
    onSnapshot,
    query,
    where,
    getDocs,
    //orderBy,
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

    useEffect(() => {
        /*const unsubs = COLUMNS.map(({ id }) => {
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
        });*/
        const unsubs = COLUMNS.map(({ id }) => {
            const q = query(
                collection(db, "jobs"),
                where("status", "==", id)
            );
            return onSnapshot(
                q,
                (snap) => {
                    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    console.log(`[JT] ${id}: ${rows.length} docs`, rows);
                    setBoard(prev => ({ ...prev, [id]: rows }));
                },
                (err) => {
                    console.error(`onSnapshot erro for ${id}:`, err);
                }
            );
        });
        return () => unsubs.forEach(u => u());
    }, []);

    useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "jobs"));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("ALL JOBS:", all);
      } catch (e) {
        console.error("getDocs error:", e);
      }
    })();
  }, []);

    const filtered = (cards) => {
        const q = search.trim().toLowerCase();
        if (!q) return cards;
        return cards.filter(c =>
            (c.title || "").toLowerCase().includes(q) ||
            (c.company || "").toLowerCase().includes(q) ||
            (c.type || "").toLowerCase().includes(q) ||
            (c.description || "").toLowerCase().includes(q)
        );
    };
    return (
        <div className="jt-app">
            {/* Sidebar */}
            <aside className="jt-sidebar">
                <div className="jt-logo">job.tracker</div>
                <nav className="jt-nav">
                    <a className="jt-nav-item active" href="#board"><span>Job Board</span></a>
                    <a className="jt-nav-item" href="#search"><span>Job Search</span></a>
                    <a className="jt-nav-item" href="#saved"><span>Saved Jobs</span></a>
                </nav>
                <div className="jt-logout">Log Out ⟶</div>
            </aside>

            {/* Main */}
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
                        />
                    ))}
                </section>
            </main>
        </div>
    );
}