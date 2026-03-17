import { Page } from "./db.js";
import { fetchPage } from "./fetcher.js";
import { addToFrontier, markDone, markFailed } from "./frontier.js";
import { isAllowed, getCrawlDelay } from "./utils/robots.js";
import { throttle } from "./utils/throttle.js";
import { getDomain } from "./utils/url.js";
import { CONFIG } from "../config/settings.js";

/**
 Process a single frontier entry:
 1. Check robots.txt
 2. Throttle per domain
 3. Fetch + parse
 4. Save to MongoDB
 5. Add new links to frontier
 */
export async function processURL(entry) {
  const { url, depth } = entry;
  const domain = getDomain(url);

  const allowed = await isAllowed(url);
  if (!allowed) {
    console.log(`robots.txt blocked: ${url}`);
    await markDone(url); 
    return;
  }

  const delay = await getCrawlDelay(domain);
  await throttle(domain, delay);

  console.log(` [depth=${depth}] ${url}`);
  const result = await fetchPage(url);

  if (result.success) {
    await Page.findOneAndUpdate(
      { url },
      {
        $set: {
          url,
          title:          result.title,
          extracted_text: result.extracted_text,
          links_found:    result.links_found,
          metadata:       result.metadata,
          status:         "crawled",
        },
      },
      { upsert: true }
    );

    console.log(
      `  Saved | "${result.title.slice(0, 50)}" | ` +
      `${result.links_found.length} links | ${result.metadata.crawl_duration_ms}ms`
    );

    if (depth < CONFIG.MAX_DEPTH) {
      let added = 0;
      for (const link of result.links_found) {
        await addToFrontier(link, depth + 1);
        added++;
      }
      if (added) console.log(`${added} URLs queued`);
    }

    await markDone(url);

  } else {
    await Page.findOneAndUpdate(
      { url },
      {
        $set: {
          url,
          metadata: result.metadata,
          status: "failed",
        },
      },
      { upsert: true }
    );

    console.log(` Failed: ${result.metadata.error}`);
    await markFailed(url);
  }
}