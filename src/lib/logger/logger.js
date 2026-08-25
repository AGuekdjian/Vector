const blockedKeys = /password|hash|cookie|secret|token|authorization/i;

export function sanitizeLogContext(context = {}) {
  const sanitize = (value, key = "", depth = 0) => {
    if (blockedKeys.test(key)) return "[REDACTED]";
    if (depth > 5) return "[TRUNCATED]";
    if (typeof value === "string") return value.slice(0, 2_000);
    if (Array.isArray(value))
      return value.slice(0, 100).map((item) => sanitize(item, "", depth + 1));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .slice(0, 100)
          .map(([childKey, childValue]) => [
            childKey,
            sanitize(childValue, childKey, depth + 1),
          ]),
      );
    return value;
  };
  return sanitize(context);
}

export function log(level, message, context = {}) {
  const entry = JSON.stringify({
    level,
    message,
    ...sanitizeLogContext(context),
    timestamp: new Date().toISOString(),
  });
  if (level === "error") console.error(entry);
  else console.info(entry);
}
