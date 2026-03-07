function parsePayload(req) {
  if (!req) return {};

  if (req.body && typeof req.body === "object") return req.body;
  if (req.payload && typeof req.payload === "object") return req.payload;

  const raw = req.payload || req.bodyRaw || req.body;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    return JSON.parse(trimmed);
  }

  return {};
}

module.exports = {
  parsePayload,
};
