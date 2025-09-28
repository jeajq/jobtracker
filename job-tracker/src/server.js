const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

const ADZUNA_BASE =
  "https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=034eb061&app_key=625a239ec1df4c3dc57be11c3c0311b3";

function withPage(urlStr, page) {
  return urlStr.replace(/\/search\/\d+/, `/search/${page}`);
}

app.get("/api/jobs", async (req, res) => {
  try {
    const { q = "", location = "", type = "", sort = "date", page = "1", pageSize = "20" } = req.query;

    const pageNum = Math.max(parseInt(page, 10), 1);
    const size = Math.min(Math.max(parseInt(pageSize, 10), 1), 50);

    const url = new URL(withPage(ADZUNA_BASE, pageNum));
    url.searchParams.set("results_per_page", String(size));
    if (q) url.searchParams.set("what", q);
    if (location) url.searchParams.set("where", location);
    if (type) url.searchParams.set("contract_time", type);
    if (sort) url.searchParams.set("sort_by", sort);

    const response = await fetch(url.toString());
    const contentType = response.headers.get("content-type");

    if (!response.ok || !contentType.includes("application/json")) {
      const errorText = await response.text();
      return res.status(502).json({ error: "Adzuna API error", details: errorText.slice(0, 200) });
    }

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    const rows = results.map((j) => {
      const loc =
        j?.location?.display_name ||
        (Array.isArray(j?.location?.area) ? j.location.area.join(", ") : "") ||
        "";
      const company = j?.company?.display_name || "";
      const jobType = [j?.contract_type, j?.contract_time].filter(Boolean).join(" • ");
      return {
        id: String(j?.id || j?.adref || Math.random().toString(36).substring(2)),
        title: j?.title || "",
        company,
        location: loc,
        type: jobType,
        category: j?.category?.label || "",
        url: j?.redirect_url || "",
        salary_min: j?.salary_min ?? null,
        salary_max: j?.salary_max ?? null,
        salary_is_predicted: j?.salary_is_predicted === "1",
        posted_at: j?.created || null,
      };
    });

    res.json({
      total: Number.isFinite(data?.count) ? data.count : rows.length,
      mean: data?.mean ?? null,
      page: pageNum,
      pageSize: size,
      rows,
    });
  } catch (err) {
    res.status(500).json({ error: "Unexpected server error", details: String(err) });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
