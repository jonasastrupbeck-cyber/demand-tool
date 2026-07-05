// Local-calendar-day helpers.
//
// The app renders dates with toLocaleDateString() (the user's LOCAL day), so
// date DEFAULTS and date-field seeds must use the local day too — not
// toISOString().slice(0,10), which is the UTC day and rolls over at 00:00 UTC.
// For a UTC+ user (e.g. Denmark, UTC+1/+2) between local midnight and 01:00–
// 02:00, the UTC day is still "yesterday", so a UTC-based default backdated a
// captured touch by a day — and the flow effective date (COALESCE(block_date,
// created_at)) drives the capability/XmR charts.

export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Local calendar day of a stored timestamp / date string ('' for null/blank).
export function localDayOf(v?: string | null): string {
  return v ? localDay(new Date(v)) : '';
}
