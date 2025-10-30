// src/pages/SkillsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/sidebar";
import "../components/job-tracker.css";

const DEFAULT_SKILLS = [
  { id: "s1", skill: "python",     type: "language", level: "intermediate" },
  { id: "s2", skill: "html",       type: "language", level: "advanced" },
  { id: "s3", skill: "java",       type: "language", level: "elementary" },
  { id: "s4", skill: "javascript", type: "language", level: "intermediate" },
  { id: "s5", skill: "c++",        type: "language", level: "intermediate" },
  { id: "s6", skill: "figma",      type: "design",   level: "elementary" },
  { id: "s7", skill: "react.js",   type: "library",  level: "intermediate" },
  { id: "s8", skill: "excel",      type: "other",    level: "advanced" },
  { id: "s9", skill: "linux",      type: "language", level: "advanced" },
];

const LEVELS = ["elementary", "intermediate", "advanced", "expert"];

export default function SkillsPage({ user }) {
  const [skills, setSkills] = useState(DEFAULT_SKILLS);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState({ skill: "", level: "" });

  // Sorting state
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Sync hash with sidebar (optional)
  const [, setHash] = useState(() => window.location.hash || "#board");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#board");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Auto-detect type based on skill name
  function inferType(skillName) {
    const s = skillName.toLowerCase();
    if (["python", "java", "c++", "html", "css", "javascript"].some(k => s.includes(k))) return "language";
    if (["react", "angular", "vue"].some(k => s.includes(k))) return "library";
    if (["figma", "xd", "sketch"].some(k => s.includes(k))) return "design";
    if (["excel", "word", "notion"].some(k => s.includes(k))) return "other";
    return "other";
  }

  // Filter + sort logic
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = !q
      ? [...skills]
      : skills.filter(
          (s) =>
            s.skill.toLowerCase().includes(q) ||
            s.type.toLowerCase().includes(q) ||
            s.level.toLowerCase().includes(q)
        );

    if (sortField) {
      result.sort((a, b) => {
        const A = a[sortField].toLowerCase();
        const B = b[sortField].toLowerCase();
        return sortAsc ? A.localeCompare(B) : B.localeCompare(A);
      });
    }

    return result;
  }, [query, skills, sortField, sortAsc]);

  // Add skill form submit
  function addSkill(e) {
    e.preventDefault();
    if (!draft.skill || !draft.level) return;
    const inferredType = inferType(draft.skill);
    setSkills((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        skill: draft.skill,
        type: inferredType,
        level: draft.level,
      },
    ]);
    setDraft({ skill: "", level: "" });
    setIsModalOpen(false);
  }

  return (
    <div className="jt-app">
      <Sidebar user={user} />

      <main className="jt-main">
        {/* Topbar */}
        <header className="jt-topbar">
          <input
            className="jt-search"
            placeholder="search skills…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="jt-topbar-actions">
            <div className="jt-avatar" title="Profile" />
            <div className="jt-gear" title="Settings">⚙︎</div>
          </div>
        </header>

        {/* Skills Table Card */}
        <section className="jt-surface">
          <div className="jt-surface-head">Your Skills</div>

          <div className="jt-table">
            {/* Clickable table header */}
            <div className="jt-tr jt-tr--head">
              {[
                { key: "skill", label: "skill", width: "w-40" },
                { key: "type", label: "type", width: "w-30" },
                { key: "level", label: "proficiency", width: "w-20" },
              ].map(({ key, label, width }) => (
                <div
                  key={key}
                  className={`jt-td ${width} jt-sortable`}
                  onClick={() => {
                    if (sortField === key) setSortAsc(!sortAsc);
                    else {
                      setSortField(key);
                      setSortAsc(true);
                    }
                  }}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  <span className="jt-sort">
                    {sortField === key ? (sortAsc ? "▴" : "▾") : "▾"}
                  </span>{" "}
                  {label}
                </div>
              ))}
              <div className="jt-td w-10 ta-right"></div>
            </div>

            {/* Skills rows */}
            {filtered.map((row) => (
              <div key={row.id} className="jt-tr">
                <div className="jt-td w-40"><span className="jt-link">{row.skill}</span></div>
                <div className="jt-td w-30"><span className="jt-tag">{row.type}</span></div>
                <div className="jt-td w-20"><span className="jt-badge">{row.level}</span></div>
                <div className="jt-td w-10 ta-right">
                  <button className="jt-pill" type="button">upskill</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add (+) floating button */}
        <button className="jt-fab" title="Add Skill" onClick={() => setIsModalOpen(true)}>+</button>
      </main>

      {/* Add Skill Modal */}
      {isModalOpen && (
        <div className="jt-modal">
          <div className="jt-modal-card">
            <div className="jt-modal-head">Add Skill</div>
            <form className="jt-form" onSubmit={addSkill}>
              <div className="jt-form-row">
                <label>skill</label>
                <input
                  className="jt-input"
                  placeholder="e.g. python"
                  value={draft.skill}
                  onChange={(e) => setDraft((d) => ({ ...d, skill: e.target.value }))}
                />
              </div>

              <div className="jt-form-row">
                <label>proficiency level</label>
                <select
                  className="jt-select"
                  value={draft.level}
                  onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value }))}
                >
                  <option value="">select level…</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="jt-modal-actions">
                <button type="button" className="jt-ghost" onClick={() => setIsModalOpen(false)}>cancel</button>
                <button type="submit" className="jt-primary">add</button>
              </div>
            </form>
          </div>

          <div className="jt-backdrop" onClick={() => setIsModalOpen(false)} />
        </div>
      )}
    </div>
  );
}