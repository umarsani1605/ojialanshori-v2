type DateInput = string | Date | null | undefined;

const LOCALE = "id-ID";
const DISPLAY_TIMEZONE = "Asia/Jakarta";
const SQL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SQL_DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
const ISO_WITHOUT_TIMEZONE_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  if (typeof input === "string") {
    if (SQL_DATETIME_RE.test(input)) {
      const d = new Date(input.replace(" ", "T") + "+07:00");
      return isNaN(d.getTime()) ? null : d;
    }

    if (ISO_WITHOUT_TIMEZONE_RE.test(input)) {
      const d = new Date(`${input}+07:00`);
      return isNaN(d.getTime()) ? null : d;
    }

    if (SQL_DATE_RE.test(input)) {
      const d = new Date(`${input}T00:00:00+07:00`);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/** "10 Jan 2025" */
export function formatDate(input: DateInput, fallback = "-"): string {
  const d = toDate(input);
  if (!d) return fallback;
  return d.toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: DISPLAY_TIMEZONE,
  });
}

/** "10 Jan 2025, 08.30" */
export function formatDatetime(input: DateInput, fallback = "-"): string {
  const d = toDate(input);
  if (!d) return fallback;
  return d.toLocaleString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIMEZONE,
  });
}

/** "Sabtu, 10 Januari 2025" */
export function formatDateLong(input: DateInput, fallback = "-"): string {
  const d = toDate(input);
  if (!d) return fallback;
  return d.toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: DISPLAY_TIMEZONE,
  });
}

/** "Sabtu, 10 Januari 2025, 08.30" */
export function formatDatetimeLong(input: DateInput, fallback = "-"): string {
  const d = toDate(input);
  if (!d) return fallback;
  return d.toLocaleString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIMEZONE,
  });
}
