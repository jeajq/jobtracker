import React, { useRef, useState } from "react";
import "./job-tracker.css";
import JobColumn from "./JobColumn"; 

// Unique ID string for each Job Card
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const initialBoard = {
  applied: [
    { id: uid(), title: "Frontend Engineer", company: "Acme", type: "Full-time",
      description: "React • TypeScript • CSS", dateApplied: "2025-09-01", status: "blue" },
  ],
  assessment: [
    { id: uid(), title: "Graduate SWE", company: "Globex", type: "Graduate",
      description: "HackerRank scheduled", dateApplied: "2025-08-25", status: "pink" },
  ],
  interview: [],
  offer: [
    { id: uid(), title: "Junior Developer", company: "Initech", type: "Contract",
      description: "Offer pending", dateApplied: "2025-08-15", status: "green" },
  ],
   rejected: [ 
    {
      id: uid(),
      title: "Backend Engineer",
      company: "Umbrella Corp",
      type: "Permanent",
      description: "Rejected after coding test",
      dateApplied: "2025-07-20",
      status: "red",
    },
    {
      id: uid(),
      title: "QA Tester",
      company: "Hooli",
      type: "Contract",
      description: "No response after interview",
      dateApplied: "2025-06-10",
      status: "red",
    },
  ],
};

const COLUMNS = [
  { id: "applied", label: "Applied" },
  { id: "assessment", label: "Assessment" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" }, 
];

export default function JobTracker() {
  const [board, setBoard] = useState(initialBoard);
  const [search, setSearch] = useState("");

  const dragRef = useRef({ colId: null, index: null });

  function handleDragStart(colId, index, e) {
    dragRef.current = { colId, index };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${colId}:${index}`); 
  }

  function handleDropToPosition(targetColId, targetIndex, e) {
    e.preventDefault();
    const { colId: fromColId, index: fromIndex } = dragRef.current;
    if (fromColId == null || fromIndex == null) return;

    setBoard(prev => {
      const next = structuredClone(prev);
      const fromCol = next[fromColId];
      const toCol = next[targetColId];
      const [moved] = fromCol.splice(fromIndex, 1);

      const insertIndex =
        fromColId === targetColId && fromIndex < targetIndex
          ? targetIndex - 1
          : targetIndex;

      toCol.splice(insertIndex, 0, moved);
      return next;
    });

    dragRef.current = { colId: null, index: null };
  }

  // Drop at the end of a column
  function handleDropToEnd(targetColId, e) {
    e.preventDefault();
    const { colId: fromColId, index: fromIndex } = dragRef.current;
    if (fromColId == null || fromIndex == null) return;

    setBoard(prev => {
      const next = structuredClone(prev);
      const fromCol = next[fromColId];
      const toCol = next[targetColId];
      const [moved] = fromCol.splice(fromIndex, 1);
      toCol.push(moved);
      return next;
    });

    dragRef.current = { colId: null, index: null };
  }

  // Search filter
  function filteredCards(cards) {
    if (!search.trim()) return cards;
    const q = search.toLowerCase();
    return cards.filter(
      c =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.type || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }

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
              cards={filteredCards(board[id])}
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