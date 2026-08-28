export function toUruguayDateInput(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export function getUruguayCalendarBoundaries(date = new Date()) {
  const [year, month, day] = toUruguayDateInput(date).split("-").map(Number);
  const boundary = (y, m, d) => new Date(Date.UTC(y, m, d));
  return {
    today: boundary(year, month - 1, day),
    tomorrow: boundary(year, month - 1, day + 1),
    month: boundary(year, month - 1, 1),
    nextMonth: boundary(year, month, 1),
    previousMonth: boundary(year, month - 2, 1),
  };
}
