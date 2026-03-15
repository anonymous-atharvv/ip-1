export function createSocketRateLimiter({ windowMs, maxEvents }) {
  const events = new Map();

  return function isAllowed(socketId) {
    const now = Date.now();
    const times = events.get(socketId) ?? [];
    const active = times.filter((stamp) => now - stamp < windowMs);
    if (active.length >= maxEvents) {
      events.set(socketId, active);
      return false;
    }
    active.push(now);
    events.set(socketId, active);
    return true;
  };
}
