import express from "express";
import puppeteer from "puppeteer-extra";
import cors from "cors";

const app = express();
app.use(cors());

//Helper to format search terms for Seek URL
const formatForURL = (text) => text.toLowerCase().trim().replace(/\s+/g, "-");

app.get("/api/jobs", async (req, res) => {
  const query = req.query.q;
  const location = req.query.loc;

  if (!query || !location) {
    return res.status(400).json({ error: "Query and location are required" });
  }

  const formattedQuery = formatForURL(query);
  const formattedLocation = formatForURL(location);
  const url = `https://www.seek.com.au/${formattedQuery}-jobs/in-${formattedLocation}`;
  console.log("Scraping URL:", url);

    const browser = await puppeteer.launch({
    headless: true, 
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  try {
    console.log("Opening page...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    console.log("Scrolling to trigger dynamic load...");
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise((r) => setTimeout(r, 2000)); //wait 2s after scroll

    //wit until at least one job card appears
    console.log("Waiting for job cards...");
    await page.waitForFunction(
      () => document.querySelectorAll("article").length > 0,
      { timeout: 15000 }
    );

    //scrape jobs from seek
    const jobs = await page.evaluate(() => {
      const results = [];
      const jobCards = document.querySelectorAll("article");

      jobCards.forEach((card) => {
        const titleEl = card.querySelector(
          "a[data-automation='jobTitle'], a.job-title, h1"
        );
        const companyEl = card.querySelector(
          "span[data-automation='jobCompany'], span.job-company, a[data-automation='jobCompany']"
        );
        const linkEl = card.querySelector(
          "a[data-automation='jobTitle'], a.job-title"
        );

        const title = titleEl?.innerText?.trim();
        const company = companyEl?.innerText?.trim();
        const link = linkEl?.href;

        if (title && company && link) {
          results.push({ title, company, link });
        }
      });

      return results;
    });

    console.log(`Found ${jobs.length} jobs`);
    await browser.close();

    res.json(jobs);
  } catch (err) {
    console.error("Error scraping jobs:", err);
    await browser.close();
    res.status(500).json({ error: "Failed to scrape jobs" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
