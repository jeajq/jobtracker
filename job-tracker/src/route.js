import { NextResponse } from "next/server";

const ADZUNA_BASE =
  "https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=034eb061&app_key=625a239ec1df4c3dc57be11c3c0311b3";

function withPage(urlStr, page) {
  return urlStr.replace(/\/search\/\d+/, `/search/${page}`);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim() || "";
    const location = searchParams.get("location")?.trim() || "";
    const type = searchParams.get("type")?.trim() || "";
    const sort = searchParams.get("sort")?.trim() || "date";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "20", 10), 1), 50);

    const url = new URL(withPage(ADZUNA_BASE, page));
    url.searchParams.set("results_per_page", String(pageSize));
    if (q) url.searchParams.set("what", q);
    if (location) url.searchParams.set("where", location);
    if (type) url.searchParams.set("contract_time", type);
    if (sort) url.searchParams.set("sort_by", sort);

    const r = await fetch(url.toString(), { cache: "no-store" });

    const contentType = r.headers.get("content-type");
    if (!r.ok || !contentType?.includes("application/json")) {
      const errorText = await r.text();
      return NextResponse.json(
        { error: "Adzuna API error", details: errorText.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = await r.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    const rows = results.map((j) => {
      const loc =
        j?.location?.display_name ||
        (Array.isArray(j?.location?.area) ? j.location.area.join(", ") : "") ||
        "";
      const company = j?.company?.display_name || "";
      const jobType = [j?.contract_type, j?.contract_time].filter(Boolean).join(" • ");
      return {
        id: String(j?.id || j?.adref || crypto.randomUUID()),
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

    return NextResponse.json({
      total: Number.isFinite(data?.count) ? data.count : rows.length,
      mean: data?.mean ?? null,
      page,
      pageSize,
      rows,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected server error", details: String(err) },
      { status: 500 }
    );
  }
}
