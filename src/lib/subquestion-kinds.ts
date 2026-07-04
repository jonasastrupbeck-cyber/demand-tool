// Client-safe field-type compatibility for EDITING a subquestion's kind (0054).
//
// A kind may be changed post-create only within its compatibility class — kinds
// that write the SAME answer column, so no captured answer is stranded. Only the
// 'number' and 'duration' classes are switchable; every other kind is a
// singleton (date/text/choice, and calculated which is formula-driven).
// Imported by both the client settings UI and the server (queries + PATCH route)
// so the two can never drift. No server-only deps — safe in a client bundle.

export const SWITCHABLE_KIND_CLASSES: string[][] = [
  ['amount', 'number', 'percent', 'currency'],
  ['duration', 'duration_months'],
];

// The kinds a given kind can be switched TO (includes itself). Length 1 = fixed.
export function compatibleKinds(kind: string): string[] {
  return SWITCHABLE_KIND_CLASSES.find((c) => c.includes(kind)) ?? [kind];
}

export function kindsCompatible(a: string, b: string): boolean {
  const c = compatibleKinds(a);
  return c.length > 1 && c.includes(b);
}
