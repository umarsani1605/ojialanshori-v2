type DateInput = string | Date | null | undefined;

const LOCALE = "id-ID";

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/** "10 Jan 2025" */
export function formatDate(input: DateInput, fallback = "-"): string {
  const d = toDate(input);
  if (!d) return fallback;
  return d.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
}

/** "10 Jan 2025, 08.30" */
export function formatDatetime(input: DateInput, fallback = "-"): string {
  const d = toDate(input);
  if (!d) return fallback;
  return d.toLocaleString(LOCALE, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** "Sabtu, 10 Januari 2025" */
export function formatDateLong(input: DateInput, fallback = "-"): string {
  const d = toDate(input);
  if (!d) return fallback;
  return d.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** "Sabtu, 10 Januari 2025, 08.30" */
export function formatDatetimeLong(input: DateInput, fallback = "-"): string {
  const d = toDate(input);
  if (!d) return fallback;
  return d.toLocaleString(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
