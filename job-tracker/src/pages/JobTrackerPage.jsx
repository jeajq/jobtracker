import React, { useEffect, useState, useRef } from "react";
import "../components/job-tracker.css";
import Sidebar from "../components/sidebar";
import { db } from "../lib/firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const COLUMNS = [
  { id: "applied", label: "Applied" },
  { id: "assessment", label: "Assessment" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

export default function JobTrackerPage({ user }) {
  const [board, setBoard] = useState({
    applied: [],
    assessment: [],
    interview: [],
    offer: [],
    rejected: [],
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  //prevent snapshot updates while drag is saving
  const isSaving = useRef(false);

  //real-time listener for applied jobs
  useEffect(() => {
    if (!user?.uid) return;

    const jobsRef = collection(db, "users", user.uid, "applied_jobs");
    const q = query(jobsRef, orderBy("position", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (isSaving.current) return;//skip updates while drag-save in progress

        const jobs = snapshot.docs.map((docSnap) => ({
          firestoreId: docSnap.id,
          ...docSnap.data(),
        }));

        //group jobs by status and sort by position
        const nextBoard = { applied: [], assessment: [], interview: [], offer: [], rejected: [] };
        jobs.forEach((job) => {
          const col = job.status || "applied";
          if (nextBoard[col]) nextBoard[col].push(job);
        });
        Object.keys(nextBoard).forEach((col) => {
          nextBoard[col].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        });

        setBoard(nextBoard);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading applied jobs:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  //drag and drop handler
  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newBoard = JSON.parse(JSON.stringify(board));
    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;

    //remove moved job from source and insert into destination
    const [movedJob] = newBoard[sourceColId].splice(source.index,1);
    movedJob.status = destColId;
    newBoard[destColId].splice(destination.index, 0, movedJob);

    //update board locally
    setBoard(newBoard);
    isSaving.current = true;

    try {
      const batch = writeBatch(db);

      //normalise positions in source column
      newBoard[sourceColId].forEach((job, idx) => {
        const ref = doc(db, "users", user.uid, "applied_jobs", job.firestoreId);
        batch.update(ref, { position: idx, updatedAt: serverTimestamp() });
      });

      //normalise positions & status in destination column
      newBoard[destColId].forEach((job, idx) => {
        const ref = doc(db, "users", user.uid, "applied_jobs", job.firestoreId);
        batch.update(ref, { position: idx, status: job.status, updatedAt: serverTimestamp() });
      });

      await batch.commit();
    } catch (err) {
      console.error("Error updating positions in Firestore:", err);
    } finally {
      //allow snapshot updates after short delay
      setTimeout(() => { isSaving.current = false; }, 300);
    }
  };

  //filter cards by search
  const filtered = (cards) => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.role || "").toLowerCase().includes(q)
    );
  };

  if (loading) return <div className="jt-loading-center">Loading…</div>;

  return (
    <div className="jt-app">
      <Sidebar user={user} />
      <main className="jt-main">
        <header className="jt-topbar">
          <input
            className="jt-search"
            placeholder="Search applied jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </header>

        {!user?.uid ? (
          <div className="jt-empty-center">
            Please log in to view your tracked jobs.
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="jt-board">
              {COLUMNS.map(({ id, label }) => (
                <Droppable key={id} droppableId={id}>
                  {(provided) => (
                    <div className="jt-column" ref={provided.innerRef} {...provided.droppableProps}>
                      <h3>{label} ({board[id].length})</h3>
                      {filtered(board[id]).map((job, index) => (
                        <Draggable key={job.firestoreId} draggableId={job.firestoreId} index={index}>
                          {(provided) => (
                            <div
                              className="jt-card"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <strong>{job.title}</strong> — {job.company}
                              <div>{job.role}</div>
                              {job.url && (
                                <a href={job.url} target="_blank" rel="noopener noreferrer">
                                  View Job
                                </a>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </main>
    </div>
  );
}
