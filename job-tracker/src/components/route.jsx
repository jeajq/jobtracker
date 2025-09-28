"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";

export default function Route() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("date");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [mean, setMean] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  // async function load(p = page) {
  const load = useCallback(
   async (p = page) => {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({
        q,
        location,
        type,
        sort,
        page: String(p),
        pageSize: String(pageSize),
      });
      // const res = await fetch(`/api/jobs?${params.toString()}`);
      const res = await fetch("https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=034eb061&app_key=625a239ec1df4c3dc57be11c3c0311b3");
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        if (contentType?.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "API error");
        } else {
          const text = await res.text();
          throw new Error("Unexpected response: " + text.slice(0, 100));
        }
      }

      const data = await res.json();
      // setRows(data.rows || []);
      // setTotal(data.total || 0);
      // setMean(data.mean ?? null);
      // setPage(data.page || p);
      const isAdzuna = Array.isArray(data?.results);
      const normalizedRows = isAdzuna ? data.results.map(adaptAdzuna) : (data.rows || []);
      setRows(normalizedRows);
      setTotal(isAdzuna ? (data.count ?? normalizedRows.length) : (data.total ?? normalizedRows.length));
      setMean(data.mean ?? null);
      setPage(isAdzuna ? p : (data.page || p));
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  },
   [q, location, type, sort, page, pageSize]
 );

  // useEffect(() => {
  //   load(1);
  // }, []);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    load(1);
  }, [load]);

  const meanDisplay = useMemo(() => {
    if (!mean) return "";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0,
      }).format(mean);
    } catch {
      return `${mean}`;
    }
  }, [mean]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Job Feed (Adzuna, No Database)</h1>

      <div className="grid gap-2 sm:grid-cols-5 mb-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Search (title/company/keywords)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Location (e.g. London, Remote)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
          title="contract_time"
        >
          <option value="">Any type</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="permanent">Permanent</option>
          <option value="temp">Temp</option>
          <option value="internship">Internship</option>
        </select>
        <select
          className="border rounded px-3 py-2"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          title="sort_by"
        >
          <option value="date">Sort: Newest</option>
          <option value="salary">Sort: Salary</option>
        </select>
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => load(1)}
        >
          Search
        </button>
      </div>

      {err && <div className="text-red-600 text-sm mb-2">{err}</div>}

      <div className="text-sm opacity-80 mb-2">
        {loading
          ? "Loading…"
          : `Showing ${rows.length} of ${total} results${meanDisplay ? ` • Mean salary ${meanDisplay}` : ""}`}
      </div>

      <ul className="space-y-3">
        {rows.map((j) => (
          <li key={j.id} className="border rounded-lg p-4">
            <div className="font-medium">{j.title}</div>
            <div className="text-sm opacity-80">
              {j.company || "—"} • {j.location || "—"} {j.category ? `• ${j.category}` : ""}
            </div>
            <div className="text-sm mt-1">
              {j.type ? <span>{j.type}</span> : null}
              {(j.salary_min || j.salary_max) ? (
                <span> • {formatSalaryRange(j.salary_min, j.salary_max)}</span>
              ) : null}
            </div>
            <a
              className="text-blue-600 underline text-sm mt-1 inline-block"
              href={j.url}
              target="_blank"
              rel="noreferrer"
            >
              View / Apply
            </a>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 mt-4">
        <button
          disabled={!canPrev || loading}
          onClick={() => { const p = page - 1; if (p >= 1) load(p); }}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm">Page {page}</span>
        <button
          disabled={!canNext || loading}
          onClick={() => { const p = page + 1; load(p); }}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </main>
  );
}

function formatSalaryRange(min, max) {
  const f = (n) => {
    if (!Number.isFinite(n)) return null;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return String(n);
    }
  };
  const a = f(min), b = f(max);
  if (a && b) return `${a} – ${b}`;
  if (a) return `${a}+`;
  if (b) return `${b}`;
  return "";
}

function adaptAdzuna(r) {
  return {
    id: r.id,
    title: r.title,
    company: r.company?.display_name ?? "",
    location: r.location?.display_name ?? "",
    category: r.category?.label ?? "",
    type: r.contract_time ?? "",
    salary_min: Number.isFinite(r.salary_min) ? r.salary_min : Number(r.salary_min),
    salary_max: Number.isFinite(r.salary_max) ? r.salary_max : Number(r.salary_max),
    url: r.redirect_url,
  };
}