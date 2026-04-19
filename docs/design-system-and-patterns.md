# Design system & patterns

Companion to `technical-documentation.md` (architecture). This file captures
the design language, UX patterns, and conventions the project has converged on.
Read this before touching the capture form or the settings page — it will save
you a round of "why doesn't that match?" iteration.

Living doc. Update as conventions shift.

---

## 1. What this software is

A DECAT / P-M-M learning scaffold for Vanguard Method teams.

Each **entry** captures one moment — either a customer **demand** (what the
customer said / asked for) or a **work** episode (what the service did).
Teams enable capability *iteratively*: a fresh study starts minimal (just
verbatim), and each Vanguard concept — classification, demand types, what
matters, life problem, capability of response, system conditions, thinking,
work blocks — is toggled on as the team is ready to adopt it.

The software's job is not to store a dashboard. Its job is to scaffold the
team's thinking: every capture moment should feel like it maps to one
Vanguard concept. The logic should be legible *through* the form.

## 2. Colour vocabulary

The colour system is semantic, not decorative. It's the spine of the design.

| Colour | Tailwind | Meaning |
|---|---|---|
| **Green** | `green-*` | Value / purpose / what matters / life problem. The positive strand. |
| **Red** | `red-*` | Failure / waste / hinders. The negative strand. |
| **Sky blue** | `sky-*` | System conditions + capability of response. "What state the system is in / how it responds." |
| **True blue** | `blue-*` (NOT `indigo-*`) | Thinking (mental models). Related to system-state but distinct — deeper blue, not purple. |
| **Grey** | `gray-*` | Neutral / ambient / unknown. Class-neutral inputs. |
| **Brand red** | `#ac2c2d` | **Primary submit CTA only.** Do not use for failure semantics — that's `red-*`. |

Rule of thumb: when adding a new element, ask which strand it belongs to,
then use that strand's palette consistently (background wash, border, inner
pill, × button, focus ring, confirmation button).

### Strand → palette mapping

| Strand | Pill colour | Card wash | Inline add input | Confirm button |
|---|---|---|---|---|
| Value demand type | `green-600` solid + white | — | `green` variant | `bg-green-600` |
| Failure demand type | `red-600` solid + white | — | `red` (default) | `bg-[#ac2c2d]` |
| What Matters | `green-50` wash, `green-600` selected | — | `green` variant | `bg-green-600` |
| Life Problem | `green-50` card | `green-50` chip | `green` variant | `bg-green-600` |
| System Condition | sky `add` variant pill | `red-50` (hinders) / `green-50` (helps) card | `blue` variant | `bg-sky-600` |
| Thinking | true-blue (`indigo` variant in code, uses `blue-*` tokens) | same as SC | `indigo` variant | `bg-blue-700` |
| Capability of Response | sky pills + sky `add` variant | — | `blue` variant | `bg-sky-600` |
| Classification (Value / Failure / Sequence / ?) | green / red / emerald / grey soft→solid | — | — | — |

**Known inconsistency** (candidate for cleanup): the `PillSelect` /
`InlineTypeAdder` variant named `'indigo'` actually uses Tailwind `blue-*`
tokens. The name is historical — it was briefly real indigo and got re-tuned
when Jonas said it read too purple. A future refactor should rename to
`'thinking'` or `'deepBlue'` so token tuning doesn't strand the name.

## 3. Iterative build model

Every Vanguard strand is gated by a study-level boolean toggle in the
`studies` table (see `src/lib/schema.ts`). Feature visibility on the capture
form follows the toggle, not data presence.

- **Defaults**: `false` for every toggle on a fresh study. First visit to
  capture shows only verbatim (+ Demand/Work tabs if work tracking is on).
- **Existing studies**: backfilled on migration 0013 so nothing regressed.
- **Toggle sources of truth** (both write to the same field; sync is implicit
  via study state):
  - `CaptureTogglesPanel` (`src/components/CaptureTogglesPanel.tsx`) — the
    cog icon on the capture page, and embedded on the settings page.
  - Inline toggles in the settings page (`systemConditionsEnabled`,
    `demandTypesEnabled`, `workTypesEnabled` — the ones with their own
    management sections).
- **Capture gates respect toggles directly**, never `types.length > 0`. Every
  add-row falls back to a single-click zero-state pill so the first type
  can be seeded from capture, not only from settings.

## 4. Component patterns (what to reuse)

### `PillSelect` — `src/components/PillSelect.tsx`

Canonical pill-shaped dropdown. Click the pill → popover lists options.

Variants: `default` (grey), `value` (solid green + white), `valueLight`
(green-50 wash), `failure` (solid red + white), `add` (sky add-action),
`indigo` (true-blue twin for thinking; tokens are `blue-*`).

Props worth knowing:
- `onAddNew?: () => void` + `addNewLabel?: string` — adds a "+ new" action
  at the bottom of the popover. When the user's only way to seed a new
  taxonomy type is through capture, use this instead of a separate `+`
  button next to the pill.

### `InfoPopover` — `src/components/InfoPopover.tsx`

Click-to-reveal ⓘ trigger with a compact dark popover. Click-outside and
Escape dismiss. Use wherever you'd otherwise write a form label /
explanation paragraph. Everywhere we've dropped a headline, an ⓘ replaces it.

### `InlineTypeAdder` — `src/components/InlineTypeAdder.tsx`

Compact "+ Add new" pill that expands to an inline create-type form.

Props:
- `pillLabel?: string` — when set, renders as a full "+ Add X" pill
  (instead of the tiny dashed `+`).
- `pillVariant?: 'blue' | 'indigo' | 'green'` — sky / deep-blue / green.
- `inputVariant?: 'red' | 'green' | 'blue' | 'indigo'` — colours the
  expanded input + Add confirm button.
- `inputPlaceholder?: string` — self-explanatory placeholder for the input.

### `renderAddTypeInput` — `src/app/study/[code]/capture/page.tsx` ~line 318

The capture-page local twin of InlineTypeAdder's expanded state. Takes an
`options?: { variant?, placeholder? }` param with the same variant scheme.
Use for all add-new-type flows inside the capture form.

### `CapabilityRadioGroup` — `src/components/CapabilityRadioGroup.tsx`

Radio-pill row with a hover/tap tooltip that shows the
`operationalDefinition` + an example demand for the hovered CoR option.
Keep for CoR specifically — don't swap for a plain `PillSelect`. The
tooltip + example-on-demand flow is the whole point of this component.

### `SegmentedToggle` — `src/components/SegmentedToggle.tsx`

Two-option inline segmented switch. Used for the `helps`/`hinders`
dimension on SC + Thinking cards. Accepts `activeColor: 'red' | 'green'`
per option.

## 5. Data-model strands that matter

Recent migrations added:

- **0009** — SC attachments with 5 boolean flags per entry-SC junction
  (which field the SC helps/hinders — LifeProblem / Demand / WhatMatters /
  CoR / Work).
- **0010** — Work Step Types (managed taxonomy for Flow blocks; Phase 4).
- **0011** — `demand_entry_thinking_scs` junction. Thinking-to-SC
  attachments per entry.
- **0012** — Dimension moved from the thinking-SC attachment to the
  thinking row itself (thinkings have a single helps/hinders dimension,
  like SCs do).
- **0013** — Three new iterative-build toggles: `what_matters_enabled`,
  `thinkings_enabled`, `life_problems_enabled`. Defaults false; backfilled.

Read `src/lib/schema.ts` before proposing any new migration.

## 6. File map — where to edit for common changes

| Concern | File |
|---|---|
| Capture form (the big one) | `src/app/study/[code]/capture/page.tsx` |
| Edit modal (mirror most capture changes here) | `src/components/EntryEditModal.tsx` |
| Toggles UI (cog icon + settings panel) | `src/components/CaptureTogglesPanel.tsx` |
| Settings page | `src/app/study/[code]/settings/page.tsx` |
| Schema | `src/lib/schema.ts` |
| Queries (`createEntry`, `updateEntry`, etc.) | `src/lib/queries.ts` |
| Study API | `src/app/api/studies/[code]/route.ts` |
| Entries API | `src/app/api/studies/[code]/entries/route.ts` + `[entryId]/route.ts` |
| i18n | `src/lib/i18n.ts` — en / da / sv / de, natively written |
| Migrations | `drizzle/NNNN_name.sql` — applied inline via a one-off `tsx` runner using `@neondatabase/serverless` |

## 7. Conventions that have stuck

- **i18n copy is native, not translated.** Write Danish in Danish (Jonas's
  first language). Don't translate from English.
- **When dropping a header**, add an `aria-label` to the field so screen
  readers still get the semantics. Placeholders should then carry the
  prompt text.
- **Inline add-new-type inputs** follow their strand's colour:
  green (WM / LP / Original Value Demand), blue/sky (SC / CoR), indigo
  (Thinking), red (default — demand type / work type / other).
- **"+ Add" pill styling**: solid outline border for SC / Thinking / CoR;
  dashed border for WM / Life Problem (positive-strand add triggers feel
  more ambient).
- **Alignment**: rows that involve *picking* (pill rows, PoT/CM, Classification,
  What Matters, SC, Thinking, Life Problem) are `justify-center`. Rows that
  involve *typing* (verbatim, notes) stay left-aligned.
- **Brand red `#ac2c2d`**: only on the primary submit CTA. Never for failure
  semantic (use `red-*`).
- **Focus rings**: `ring-1` grey for class-neutral inputs. Semantic inputs
  (green/red/sky/blue) use `ring-2` in their strand colour.
- **Always run `npx tsc --noEmit` and `npm run lint` before committing.**
  The tree has never broken through ~40 commits because of this.
- **Commit messages**: short 1-line title + 1–3 paragraph body explaining
  the *why*. Co-author line with "Co-Authored-By: Claude Opus 4.7 (1M
  context) <noreply@anthropic.com>".

## 8. Anti-patterns — things that looked right but weren't

- **Gating features on `types.length > 0`** instead of on the toggle. Breaks
  iterative build — user can't seed the first type from capture. Fix: gate
  on toggle, render zero-state add pill inside.
- **A small grey `+` next to a labelled "+ Add X" pill** — redundant, pure
  fluff. Use `PillSelect.onAddNew` instead.
- **Colouring cards by dimension (helps/hinders)** when the strand already
  has a colour identity. Keep strand-colour on the wrapper, put
  dimension signal in the SegmentedToggle / inner pill. (Current SC/
  Thinking cards still colour by dimension — Jonas approved leaving this
  for now. Revisit later.)
- **Headers that duplicate the placeholder.** If the placeholder
  ("Point of transaction", "Life problem to be solved") carries the
  meaning, the header is duplication. Drop it; use aria-label on the field.
- **Using brand red for anything semantic.** The brand red `#ac2c2d`
  collides with failure semantics. Reserve for CTAs only.
- **Translating i18n copy from English.** Always awkward in Danish. Write
  native.

## 9. Known open items (candidates for future work)

- Variant naming cleanup: `'indigo'` → `'thinking'` (or `'deepBlue'`),
  `'blue'` → `'sc'` (or `'sky'`). Will mean touching PillSelect,
  InlineTypeAdder, capture page, Edit modal — but all mechanical.
- i18n key consolidation: `addX` keys could move to a `capture.add.*`
  namespace.
- Operational-definition ⓘ surfacing on more pills (currently only CoR).
- Performance — see the meta plan (Part 3) for the prioritised list.
- Dashboard/capture vocabulary + colour coherence audit.

---

## For future sessions

If you're Claude picking up this project after a gap, start here:

1. Read `AGENTS.md` — it warns that this is a non-standard Next.js.
2. Read this file for the design language + patterns.
3. Read `technical-documentation.md` for architecture + data model.
4. Run `git log --oneline -40` to see the recent trajectory.
5. Before any UX change, ask: which strand does this belong to? What's
   the strand's colour and pattern?
