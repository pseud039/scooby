import { Frontier, Page } from "./db.js";
import { getDomain } from "./utils/url.js";

export async function addToFrontier(url, depth = 0) {
  const crawled = await Page.exists({ url, status: "crawled" });
  if (crawled) return;

  try {
    await Frontier.updateOne(
      { url },
      {
        $setOnInsert: {
          url,
          depth,
          domain: getDomain(url) ?? "",
          status: "pending",
          added_at: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
}


export async function seedFrontier(seeds) {
  for (const url of seeds) {
    await addToFrontier(url, 0);
  }
  console.log(` Seeded ${seeds.length} URLs into frontier`);
}

export async function claimNextURL() {
  return Frontier.findOneAndUpdate(
    { status: "pending" },
    { $set: { status: "processing" } },
    { sort: { depth: 1, added_at: 1 }, new: true }
  );
}

export async function markDone(url) {
  await Frontier.updateOne({ url }, { $set: { status: "done" } });
}

export async function markFailed(url) {
  await Frontier.updateOne({ url }, { $set: { status: "failed" } });
}


export async function pendingCount() {
  return Frontier.countDocuments({ status: "pending" });
}

export async function getStats() {
  const [pending, processing, done, failed, pages] = await Promise.all([
    Frontier.countDocuments({ status: "pending" }),
    Frontier.countDocuments({ status: "processing" }),
    Frontier.countDocuments({ status: "done" }),
    Frontier.countDocuments({ status: "failed" }),
    Page.countDocuments({ status: "crawled" }),
  ]);
  return { pending, processing, done, failed, pages_saved: pages };
}