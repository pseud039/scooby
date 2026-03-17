import axios from "axios";
import robotsParser from "robots-parser";
import { CONFIG } from "../../config/settings.js";

const robotsCache = new Map();

async function getRobots(domain) {
  if (robotsCache.has(domain)) return robotsCache.get(domain);

  const robotsURL = `https://${domain}/robots.txt`;
  try {
    const res = await axios.get(robotsURL, {
      timeout: 5000,
      headers: { "User-Agent": CONFIG.USER_AGENT },
    });
    const parser = robotsParser(robotsURL, res.data);
    robotsCache.set(domain, parser);
    return parser;
  } catch {
    robotsCache.set(domain, null);
    return null;
  }
}


export async function isAllowed(url) {
  if (!CONFIG.RESPECT_ROBOTS_TXT) return true;

  try {
    const domain = new URL(url).hostname;
    const robots = await getRobots(domain);
    if (!robots) return true;

    return robots.isAllowed(url, CONFIG.USER_AGENT) !== false;
  } catch {
    return true;
  }
}


export async function getCrawlDelay(domain) {
  try {
    const robots = await getRobots(domain);
    if (!robots) return CONFIG.DELAY_MS;

    const delay = robots.getCrawlDelay(CONFIG.USER_AGENT);
        return delay ? delay * 1000 : CONFIG.DELAY_MS;
  } catch {
    return CONFIG.DELAY_MS;
  }
}