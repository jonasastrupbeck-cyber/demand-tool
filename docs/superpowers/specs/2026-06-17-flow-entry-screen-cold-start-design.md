# Flow capture — entry-screen cold start (Option A)

Date: 2026-06-17 · Branch: `entry-screen-cold-start` (off `f4t-capture-changes`)

## Problem

The first thing a user meets in the freeze flow-capture tool is the **"Which
customer is this?"** screen (shown before any case is open). Today it is a
search/create field plus a four-column table (Account Number / P2BS / Demand /
What Matters). Issues at this very first step:

- The table shows columns that are empty for most studies (P2BS, What Matters
  are blank for Help Me Stay) — it looks broken/sparse.
- Searching a non-matching reference shows *"No customers yet — type a reference
  number above to start one"* even when customers exist. The message is about an
  empty study, but it fires on "no search match" — misleading.
- It is not obvious whether typing **searches** or **creates**; the morphing
  button helps but the mental model is muddy.

In real use the frontline person is **~50/50** starting a new case vs resuming an
existing one — and in **both** cases they type the same thing: the account /
reference number. The only difference is whether it already exists. So the screen
should take the number and tell *them* new-vs-resume, not make them pick a lane.

## Governing constraints

- **Fast, clean capture — not teaching.** No guidance, hints, or step scaffolding.
- **Freeze-only and additive.** Change only the freeze closed-state branch in
  `CasePanel.tsx`. Stacked flow (Skipton) keeps its combobox card; transactional
  unchanged. No schema, no API, no migration.
- **Vanguard copy rule.** Reuse existing canonical i18n keys; any new strings that
  touch Vanguard concepts come from the vault, not paraphrase. (The strings here
  are operational UI copy, not concept definitions.)

## Data available (no new query needed)

`getCases(studyId)` already returns, newest-first: `caseRef`, `demandTypeId`,
`lifeProblemId`, `whatMattersTypeIds`, `status`, `openedAt`, `closedAt`,
`createdAt`, and **`entryCount`** (the touch count). That covers everything the
design needs.

## Design (Option A — smart field + recent list)

### The field
- One reference input; keep the **"Which customer is this?"** heading + info popover.
- Typing does two jobs: drives the primary button **and** filters the recent list.
- Button state from the trimmed input:
  - empty → disabled;
  - no exact match → **"+ Open #X as new"** (brand red);
  - exact match → **"Resume"** (sky, today's Enter-Case styling).
  - Enter key triggers the primary action (`openCase`).
- **Live feedback line** under the field (rich variant, owner-chosen):
  - exact match → *"Found — {demand} · {N} touches · opened {date}"*
    (omit demand if unset; "{N} touch/touches" pluralised; add a "closed" note
    if the matched case is closed);
  - non-empty, no match → *"New customer — starts a fresh case"*;
  - empty → nothing.

### The recent list (replaces the 4-column table)
- Clean rows, not a wide table. Each row: `#ref` · one-line summary
  (demand, else what-matters, if set) · `{N} touches` · **Resume** button.
- Newest-first; **open cases before closed**; closed rows carry a small "closed" tag.
- Height-capped with internal scroll so a long history doesn't push the field
  off-screen; typing in the field filters the rows (`caseRef` startsWith).

### Empty states (fixes the bug)
- Study with **no cases at all** → *"No customers yet — type a reference number
  above to start the first one."*
- Typed with **no match** → no misleading message; the **Open as new** button is
  the answer; the list area shows a quiet *"No existing match."*

## Out of scope

The composer/decisions cold-start (the screen *after* a case opens), C-Open-1/2/3,
and the parked consultant create-form work. Those stay untouched.

## Acceptance

- Freeze entry screen shows the field + recent list; no empty P2BS/What-Matters
  columns.
- Typing an existing ref → "Resume" + a correct "Found …" line; typing a new ref →
  "Open as new" + "New customer" line; empty → disabled button, no line.
- The misleading "No customers yet" no longer appears on a no-match search; it only
  appears when the study genuinely has zero cases.
- Resume opens the existing timeline; Open-as-new creates and opens the case.
- Stacked flow study (e.g. `B34QYE`) and transactional studies are visually
  unchanged. `npx tsc --noEmit` clean; no console errors.
