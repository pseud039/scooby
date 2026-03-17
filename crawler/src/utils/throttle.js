
const lastRequestTime = new Map();

export async function throttle(domain, delayMs) {
  const last = lastRequestTime.get(domain) ?? 0;
  const now  = Date.now();
  const wait = delayMs - (now - last);

  if (wait > 0) {
    await new Promise((res) => setTimeout(res, wait));
  }

  lastRequestTime.set(domain, Date.now());
}
