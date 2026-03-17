import axios from "axios";
import * as cheerio from "cheerio";
import { CONFIG } from "../config/settings.js";
import { extractLinks } from "./utils/url.js";

export async function fetchPage(url) {
  const startTime = Date.now();

  const result = {
    url,
    title:          "",
    extracted_text: "",
    links_found:    [],
    metadata: {
      status_code:       0,
      crawl_duration_ms: 0,
      content_type:      "",
      error:             "",
    },
    success: false,
  };

  try {
    const response = await axios.get(url, {
      timeout: CONFIG.REQUEST_TIMEOUT,
      headers: {
        "User-Agent": CONFIG.USER_AGENT,
        "Accept":     "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      maxRedirects: 5,
      validateStatus: () => true,
    });

    result.metadata.crawl_duration_ms = Date.now() - startTime;
    result.metadata.status_code       = response.status;
    result.metadata.content_type      = response.headers["content-type"] ?? "";

    const isHTML = result.metadata.content_type.includes("text/html");
    if (!isHTML || response.status !== 200) {
      result.metadata.error = `Skipped: status=${response.status} type=${result.metadata.content_type}`;
      return result;
    }

    const $ = cheerio.load(response.data);

    result.title = $("title").first().text().trim()
      || $("h1").first().text().trim()
      || "";

    $(
      "script, style, noscript, nav, footer, header, " +
      "aside, .cookie-banner, .ads, iframe, svg"
    ).remove();

    const rawText = $("body").text();
    result.extracted_text = rawText
      .replace(/\s+/g, " ")    
      .trim()
      .slice(0, CONFIG.MAX_TEXT_LENGTH);

    result.links_found = extractLinks($, url)
      .slice(0, CONFIG.MAX_LINKS);

    result.success = true;

  } catch (err) {
    result.metadata.crawl_duration_ms = Date.now() - startTime;
    result.metadata.error = err.message ?? "Unknown error";
  }

  return result;
}