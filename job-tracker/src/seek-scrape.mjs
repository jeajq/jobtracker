import puppeteer from "puppeteer";

const term = process.argv[2] || "software engineer";
const location = process.argv[3] || "Sydney NSW";

const searchUrl = `https://www.seek.com.au/jobs?what=${encodeURIComponent(
  term
)}&where=${encodeURIComponent(location)}`;

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",            // use true if you prefer fully headless
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Helps reduce easy bot detection and loads faster
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1280, height: 900 });

  // Block images/fonts to speed it up (optional)
  await page.setRequestInterception(true);
  page.on("request", req => {
    if (["image", "font", "media"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  console.log("Navigating to:", searchUrl);
  await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 120000 });

  // Wait for job list container (fallbacks included)
  await page.waitForSelector('[data-automation="job-list"], [data-automation="searchResults"]', { timeout: 30000 })
    .catch(() => {}); // continue even if selector name changed

  // Extract jobs from first page
  const jobs = await page.evaluate(() => {
    // Helper to safely read text
    const txt = (root, selArr) => {
      for (const sel of selArr) {
        const el = root.querySelector(sel);
        if (el && el.textContent) return el.textContent.trim();
      }
      return "";
    };
    // Helper for href
    const href = (root, selArr) => {
      for (const sel of selArr) {
        const el = root.querySelector(sel);
        if (el && el.getAttribute) {
          const h = el.getAttribute("href") || "";
          if (h) return h.startsWith("http") ? h : `https://www.seek.com.au${h}`;
        }
      }
      return "";
    };

    // Try a few card selectors to be resilient to class changes
    const cardSelectors = [
      'article[data-automation="job-card"]',
      'article[data-automation="normalJob"]',
      'article', // broad fallback
    ];

    let cards = [];
    for (const sel of cardSelectors) {
      cards = Array.from(document.querySelectorAll(sel));
      if (cards.length > 5) break; // good enough
    }

    const results = cards.map(card => ({
      title: txt(card, ['a[data-automation="jobTitle"]', '[data-automation="jobTitle"]', 'h3']),
      company: txt(card, ['span[data-automation="jobCompany"]', '[data-automation="jobCompany"]']),
      location: txt(card, ['a[data-automation="jobLocation"]', 'span[data-automation="jobLocation"]']),
      salary: txt(card, ['span[data-automation="jobSalary"]']),
      listed: txt(card, ['span[data-automation="jobListingDate"]']),
      snippet: txt(card, ['span[data-automation="jobShortDescription"]', 'p']),
      link: href(card, ['a[data-automation="jobTitle"]', 'a[href*="/job/"]']),
    }));

    // Filter empty entries (no title)
    return results.filter(j => j.title && j.link);
  });

  console.log(JSON.stringify({ query: { term, location }, count: jobs.length, jobs }, null, 2));

  await browser.close();
})();
