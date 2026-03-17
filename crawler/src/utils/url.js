import { URL } from "url";
 

export function normalizeURL(rawURL) {
  try {
    const u = new URL(rawURL);

    u.protocol = u.protocol.toLowerCase();
    u.hostname = u.hostname.toLowerCase();

    u.hash = "";

    const TRACKING_PARAMS = [
      "utm_source", "utm_medium", "utm_campaign",
      "utm_term",   "utm_content", "fbclid",
      "gclid",      "ref",         "source",
    ];
    for (const param of TRACKING_PARAMS) {
      u.searchParams.delete(param);
    }

    let path = u.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      u.pathname = path.slice(0, -1);
    }

    return u.toString();
  } catch {
    return null;
  }
}


export function getDomain(rawURL) {
  try {
    return new URL(rawURL).hostname;
  } catch {
    return null;
  }
}

const SKIP_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico",
  ".pdf", ".zip", ".gz", ".tar", ".mp4", ".mp3", ".avi",
  ".css", ".js",  ".woff", ".woff2", ".ttf", ".eot",
  ".xml", ".json", ".csv", ".xlsx", ".docx",
]);

export function isValidURL(rawURL) {
  try {
    const u = new URL(rawURL);
    if (!["http:", "https:"].includes(u.protocol)) return false;

    const ext = u.pathname.slice(u.pathname.lastIndexOf(".")).toLowerCase();
    if (SKIP_EXTENSIONS.has(ext)) return false;

    return true;
  } catch {
    return false;
  }
}

export function extractLinks($, baseURL) {
  const links = new Set();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;

    try {
      const absolute = new URL(href, baseURL).toString();
      const normalized = normalizeURL(absolute);
      if (normalized && isValidURL(normalized)) {
        links.add(normalized);
      }
    } catch {
        
    }
  });

  return [...links];
}