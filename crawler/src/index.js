import pLimit from "p-limit";
import { connectDB } from "./db.js";
import { seedFrontier, claimNextURL, pendingCount, getStats } from "./frontier.js";
import { processURL } from "./worker.js";
import { CONFIG } from "../config/settings.js";

let shuttingDown = false;

process.on("SIGINT",  () => { console.log("\nShutting down..."); shuttingDown = true; });
process.on("SIGTERM", () => { console.log("\nShutting down..."); shuttingDown = true; });

async function run() {
  await connectDB();

  await seedFrontier(CONFIG.SEEDS);

  const limit = pLimit(CONFIG.CONCURRENCY);

  console.log(`\n Crawler started | concurrency=${CONFIG.CONCURRENCY} | max_depth=${CONFIG.MAX_DEPTH}\n`);

  let idleRounds = 0;

  while (!shuttingDown) {
    const batch = [];
    for (let i = 0; i < CONFIG.CONCURRENCY; i++) {
      const entry = await claimNextURL();
      if (entry) batch.push(entry);
    }

    if (batch.length === 0) {
      idleRounds++;
      if (idleRounds >= 3) {
        console.log("\n Frontier exhausted. Crawl complete!");
        break;
      }
      await new Promise((res) => setTimeout(res, 2000));
      continue;
    }

    idleRounds = 0;

    await Promise.all(
      batch.map((entry) => limit(() => processURL(entry)))
    );

    const stats = await getStats();
    console.log(
      `\n Stats → pages_saved=${stats.pages_saved} | ` +
      `pending=${stats.pending} | done=${stats.done} | failed=${stats.failed}\n`
    );
  }

  const final = await getStats();
  console.log(`  Pages crawled : ${final.pages_saved}`);
  console.log(`  URLs done     : ${final.done}`);
  console.log(`  URLs failed   : ${final.failed}`);
  console.log(`  Still pending : ${final.pending}`);
  console.log("\n");

  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});