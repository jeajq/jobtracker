// src/pages/SkillsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/sidebar";
import {
  collection,
  query as fsQuery,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import "../components/job-tracker.css";

const LEVELS = ["elementary", "intermediate", "advanced", "expert"];

// helper to guess type from skill text
function inferType(raw) {
  if (!raw) return "other";
  const s = raw.toLowerCase();
  if (["python","java","c++","c#","c ","javascript","js","typescript","html","css","sql","bash","linux","shell","go","rust","kotlin","swift"]
      .some(k => s.includes(k))) {
    return "language";
  }
  if (["react","react.js","vue","vue.js","angular","svelte","next","express","django","flask","spring","rails","laravel","tailwind","bootstrap"]
      .some(k => s.includes(k))) {
    return "library";
  }
  if (["figma","xd","sketch","ui","ux","wireframe","prototype"]
      .some(k => s.includes(k))) {
    return "design";
  }
  if (["excel","notion","jira","git","github"]
      .some(k => s.includes(k))) {
    return "other";
  }
  return "other";
}

export default function SkillsPage({ user, onLogout }) {
  // ui state
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // modal draft state
  const [draft, setDraft] = useState({ skill: "", level: "" });

  // table data from firestore
  const [skills, setSkills] = useState([]);

  // sort state
  const [sortField, setSortField] = useState(null); 
  const [sortAsc, setSortAsc] = useState(true);

  // keep hash sync w/ sidebar highlight (optional)
  const [, setHash] = useState(() => window.location.hash || "#board");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#board");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // subscribe to this user's skills in Firestore
  useEffect(() => {
    if (!user?.email) return; 

    const q = fsQuery(
      collection(db, "skills"),
      where("ownerEmail", "==", user.email)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,       
          ...d.data(),     
        }));
        setSkills(rows);
      },
      (err) => {
        console.error("[skills] onSnapshot error:", err);
      }
    );

    return () => unsub();
  }, [user?.email]);

  // filter + sort for display
  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let result = !q
      ? [...skills]
      : skills.filter(
          (s) =>
            (s.skill || "").toLowerCase().includes(q) ||
            (s.type || "").toLowerCase().includes(q) ||
            (s.level || "").toLowerCase().includes(q)
        );

    if (sortField) {
      result.sort((a, b) => {
        const A = (a[sortField] || "").toLowerCase();
        const B = (b[sortField] || "").toLowerCase();
        return sortAsc ? A.localeCompare(B) : B.localeCompare(A);
      });
    }

    return result;
  }, [searchText, skills, sortField, sortAsc]);

  // add new skill -> Firestore
  async function handleAddSkill(e) {
    e.preventDefault();
    if (!draft.skill || !draft.level) return;
    if (!user?.email) {
      alert("You must be logged in to add skills.");
      return;
    }

    const inferredType = inferType(draft.skill);

    try {
      await addDoc(collection(db, "skills"), {
        ownerEmail: user.email,
        skill: draft.skill.trim(),
        type: inferredType,
        level: draft.level,
        createdAt: serverTimestamp(),
      });
      // close + reset
      setDraft({ skill: "", level: "" });
      setIsModalOpen(false);
    } catch (err) {
      console.error("[skills] addDoc failed:", err);
      alert("Couldn't save skill. Check console.");
    }
  }

  // delete a skill -> Firestore
  async function handleDeleteSkill(row) {
    if (!row.id) {
      alert("Can't delete: missing document id");
      return;
    }

    if (!window.confirm(`Delete "${row.skill}" from your skills?`)) return;

    try {
      await deleteDoc(doc(db, "skills", row.id));
    } catch (err) {
      console.error("Error deleting skill:", err);
      alert("Error deleting skill. Check console.");
    }
  }

  // header click toggles sort
  function handleSortClick(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  return (
    <div className="jt-app">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="jt-main">
        {/* Top bar */}
        <header className="jt-topbar">
          <input
            className="jt-search"
            placeholder="search skills…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="jt-topbar-actions">
            <div className="jt-avatar" title="Profile" />
            <div className="jt-gear" title="Settings">⚙︎</div>
          </div>
        </header>

        {/* Skills Card */}
        <section className="jt-surface">
          <div className="jt-surface-head">Your Skills</div>

          <div className="jt-table">
            {/* header row */}
            <div className="jt-tr jt-tr--head">
              {[
                { key: "skill", label: "skill", width: "w-40" },
                { key: "type", label: "type", width: "w-30" },
                { key: "level", label: "proficiency", width: "w-20" },
              ].map(({ key, label, width }) => (
                <div
                  key={key}
                  className={`jt-td ${width}`}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSortClick(key)}
                >
                  <span className="jt-sort">
                    {sortField === key ? (sortAsc ? "▴" : "▾") : "▾"}
                  </span>{" "}
                  {label}
                </div>
              ))}

              <div className="jt-td w-10 ta-right"></div>
            </div>

            {/* rows */}
            {filtered.length === 0 ? (
              <div className="jt-tr">
                <div className="jt-td w-40" style={{ color: "var(--muted)" }}>
                  no skills yet
                </div>
              </div>
            ) : (
              filtered.map((row) => (
                <div key={row.id} className="jt-tr">
                  <div className="jt-td w-40">
                    <span className="jt-link">{row.skill}</span>
                  </div>
                  <div className="jt-td w-30">
                    <span className="jt-tag">{row.type}</span>
                  </div>
                  <div className="jt-td w-20">
                    <span className="jt-badge">{row.level}</span>
                  </div>
                  <div className="jt-td w-10 ta-right">
                    <button
                      className="jt-pill jt-btn-red"
                      type="button"
                      onClick={() => handleDeleteSkill(row)}
                    >
                      delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* floating + button */}
        <button
          className="jt-fab"
          title="Add Skill"
          onClick={() => setIsModalOpen(true)}
        >
          +
        </button>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="jt-modal">
          <div className="jt-modal-card">
            <div className="jt-modal-head">Add Skill</div>

            <form className="jt-form" onSubmit={handleAddSkill}>
              <div className="jt-form-row">
                <label>skill</label>
                <input
                  className="jt-input"
                  placeholder="e.g. React.js"
                  value={draft.skill}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, skill: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="jt-form-row">
                <label>proficiency level</label>
                <select
                  className="jt-select"
                  value={draft.level}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, level: e.target.value }))
                  }
                  required
                >
                  <option value="">select level…</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="jt-modal-actions">
                <button
                  type="button"
                  className="jt-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  cancel
                </button>
                <button type="submit" className="jt-primary">
                  add
                </button>
              </div>
            </form>
          </div>

          {/* invisible click-out backdrop (not dimming page since yours is transparent) */}
          <div
            className="jt-backdrop"
            onClick={() => setIsModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}