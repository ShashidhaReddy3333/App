type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  ) as Record<string, number>;

  return {
    year: parts.year ?? date.getUTCFullYear(),
    month: parts.month ?? date.getUTCMonth() + 1,
    day: parts.day ?? date.getUTCDate(),
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0
  };
}

function getOffsetMilliseconds(date: Date, timeZone: string) {
  const parts = getParts(date, timeZone);
  const zoneTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return zoneTime - date.getTime();
}

export function zonedDateTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getOffsetMilliseconds(utcGuess, timeZone);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - offset);
}

export function getBusinessDayRange(timeZone: string, sourceDate = new Date()) {
  const parts = getParts(sourceDate, timeZone);
  const start = zonedDateTimeToUtc(timeZone, parts.year, parts.month, parts.day, 0, 0, 0);
  const end = zonedDateTimeToUtc(timeZone, parts.year, parts.month, parts.day, 23, 59, 59);
  return { start, end, parts };
}

export function formatBusinessDateStamp(timeZone: string, sourceDate = new Date()) {
  const { parts } = getBusinessDayRange(timeZone, sourceDate);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}
