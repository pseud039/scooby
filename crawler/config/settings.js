
export const CONFIG = {
  MONGO_URI:process.env.MONGO_URL,
  DB_NAME:   "webcrawler",

  MAX_DEPTH:        3,       // how many hops from seed URLs
  CONCURRENCY:      5,       // how many pages to fetch in parallel
  REQUEST_TIMEOUT:  10000,   // ms before giving up on a page
  DELAY_MS:         1500,    // ms to wait between requests to the same domain

  USER_AGENT: "NicheCrawler/1.0 (learning project; be nice)",
  RESPECT_ROBOTS_TXT: true,

  MAX_TEXT_LENGTH:  100000,  // cap extracted text at 100k chars
  MAX_LINKS:        500,     // max links to store per page

  SEEDS: [
    "https://en.wikipedia.org/wiki/World_Wide_Web",
    "https://en.wikipedia.org/wiki/Web_crawler",
  ],
};