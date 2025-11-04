import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/sidebar";
import {
  collection,
  query as fsQuery,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import "../components/skills.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-regular-svg-icons";

const LEVELS = ["elementary", "intermediate", "advanced", "expert"];

function inferType(raw) {
  if (!raw) return "other";
  const s = raw.toLowerCase();
  if (["python","java","c++","c#","c ","javascript","js","typescript","html","css","sql","bash","linux","shell","go","rust","kotlin","swift"].some(k => s.includes(k))) return "language";
  if (["react","react.js","vue","vue.js","angular","svelte","next","express","django","flask","spring","rails","laravel","tailwind","bootstrap"].some(k => s.includes(k))) return "library";
  if (["figma","xd","sketch","ui","ux","wireframe","prototype"].some(k => s.includes(k))) return "design";
  if (["excel","notion","jira","git","github"].some(k => s.includes(k))) return "other";
  return "other";
}

export default function SkillsPage({ user, onLogout, avatarRef, onProfileClick }) {
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState({ skill: "", level: "" });
  const [skills, setSkills] = useState([]);
  const [sortField, setSortField] = useState(null); 
  const [sortAsc, setSortAsc] = useState(true);
  const [skillToDelete, setSkillToDelete] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const skillsRef = collection(db, "users", user.uid, "skills");
    const unsub = onSnapshot(
      fsQuery(skillsRef),
      snap => setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error("[skills] onSnapshot error:", err)
    );
    return () => unsub();
  }, [user?.uid]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let result = !q ? [...skills] : skills.filter(s =>
      (s.skill || "").toLowerCase().includes(q) ||
      (s.type || "").toLowerCase().includes(q) ||
      (s.level || "").toLowerCase().includes(q)
    );
    if (sortField) {
      result.sort((a,b) => {
        const A = (a[sortField] || "").toLowerCase();
        const B = (b[sortField] || "").toLowerCase();
        return sortAsc ? A.localeCompare(B) : B.localeCompare(A);
      });
    }
    return result;
  }, [searchText, skills, sortField, sortAsc]);

  async function handleAddSkill(e) {
    e.preventDefault();
    if (!draft.skill || !draft.level || !user?.uid) return;
    const inferredType = inferType(draft.skill);
    try {
      await addDoc(collection(db, "users", user.uid, "skills"), {
        skill: draft.skill.trim(),
        type: inferredType,
        level: draft.level,
        createdAt: serverTimestamp(),
      });
      setDraft({ skill: "", level: "" });
      setIsModalOpen(false);
    } catch (err) {
      console.error("[skills] addDoc failed:", err);
      alert("Couldn't save skill. Check console.");
    }
  }

  //triggers when user confirms delete
  const handleDeleteSkill = async () => {
    if (!skillToDelete || !user?.uid) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "skills", skillToDelete.id));
    } catch (err) {
      console.error("Error deleting skill:", err);
      alert("Error deleting skill. Check console.");
    } finally {
      setSkillToDelete(null);
      setShowDeletePopup(false);
    }
  };

  function handleSortClick(field) {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  return (
    <div className="jt-app">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="jt-main">
        <header className="jt-topbar">
          <input
            className="jt-search"
            placeholder="search skills…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <div className="jt-topbar-actions">
            <div title="Profile" ref={avatarRef} onClick={onProfileClick} style={{ cursor: "pointer" }}>
              <FontAwesomeIcon icon={faCircleUser} size="lg" />
            </div>
          </div>
        </header>

        <section className="jt-surface">
          <div className="jt-surface-head">Your Skills</div>

          <div className="jt-table">
            <div className="jt-tr jt-tr--head">
              {[{ key: "skill", label: "skill", width: "w-40" },
                { key: "type", label: "type", width: "w-30" },
                { key: "level", label: "proficiency", width: "w-20" }]
              .map(({ key, label, width }) => (
                <div key={key} className={`jt-td ${width}`} style={{ cursor: "pointer", userSelect: "none" }}
                     onClick={() => handleSortClick(key)}>
                  <span className="jt-sort">{sortField === key ? (sortAsc ? "▴" : "▾") : "▾"}</span> {label}
                </div>
              ))}
              <div className="jt-td w-10 ta-right"></div>
            </div>

            {filtered.length === 0 ? (
              <div className="jt-tr">
                <div className="jt-td w-40" style={{ color: "var(--muted)" }}>no skills yet</div>
              </div>
            ) : (
              filtered.map(row => (
                <div key={row.id} className="jt-tr">
                  <div className="jt-td w-40"><span className="jt-link">{row.skill}</span></div>
                  <div className="jt-td w-30"><span className="jt-tag">{row.type}</span></div>
                  <div className="jt-td w-20"><span className="jt-badge">{row.level}</span></div>
                  <div className="jt-td w-10 ta-right">
                    <button
                      className="jt-pill jt-btn-red"
                      type="button"
                      onClick={() => {
                        setSkillToDelete(row);
                        setShowDeletePopup(true);
                      }}
                    >
                      delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <button className="jt-fab" title="Add Skill" onClick={() => setIsModalOpen(true)}>+</button>
      </main>

      {/* Add Skill Modal */}
      {isModalOpen && (
        <div className="jt-modal">
          <div className="jt-modal-card">
            <div className="jt-modal-head">Add Skill</div>
            <form className="jt-form" onSubmit={handleAddSkill}>
              <div className="jt-form-row">
                <label>skill</label>
                <input className="jt-input" placeholder="e.g. React.js" value={draft.skill} 
                       onChange={e => setDraft(d => ({ ...d, skill: e.target.value }))} required />
              </div>
              <div className="jt-form-row">
                <label>proficiency level</label>
                <select className="jt-select" value={draft.level} 
                        onChange={e => setDraft(d => ({ ...d, level: e.target.value }))} required>
                  <option value="">select level…</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
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

      {/* Delete Skill Confirmation Popup */}
      {showDeletePopup && skillToDelete && (
        <div className="delete-popup-overlay">
          <div className="delete-popup">
            <div className="delete-popup-header">
              <h2>Confirm Deletion</h2>
              <button className="close-btn" onClick={() => setShowDeletePopup(false)}>×</button>
            </div>
            <div className="delete-popup-content">
              <p>Are you sure you want to delete "{skillToDelete.skill}"?</p>
              <div className="delete-popup-buttons">
                <button className="delete-job-btn" onClick={handleDeleteSkill}>Yes, Delete</button>
                <button className="cancel-btn" onClick={() => setShowDeletePopup(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
