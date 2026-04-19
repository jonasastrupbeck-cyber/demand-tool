@AGENTS.md

# Project-specific guidance

Before touching the capture form, settings page, or anything UX-related,
read **`docs/design-system-and-patterns.md`**. It captures the colour
vocabulary, component patterns (PillSelect, InfoPopover, InlineTypeAdder,
CapabilityRadioGroup), iterative-build toggle model, and the conventions
that have converged across ~40 UX refinement commits. Skipping it will
cost you a round of "why doesn't this match?" iteration.

For architecture + data model, read `docs/technical-documentation.md`.

For recent work trajectory, `git log --oneline -40` is the fastest scan.

## Vanguard copy rule (hard requirement)

Any user-facing text referring to Vanguard Method concepts — **demand, value
demand, failure demand, purpose, system conditions, thinking, capability of
response, what matters, life problem to be solved, DECAT, P-M-M, check-plan-do,
one-stop, flow, work, variation** — must be sourced from Jonas's Obsidian vault
or the `anthropic-skills:vanguard-*` skills. **Never paraphrase Vanguard
definitions from training-data memory.** That's how drift creeps in.

Before adding or editing such copy:

1. Call `mcp__obsidian-mcp-tools__search_vault_smart` (or `_simple`) with the
   concept name — Jonas's vault has the canonical definitions.
2. If the vault isn't reachable, invoke one of the Vanguard skills:
   `anthropic-skills:vanguard-teaching` (terminology, definitions),
   `anthropic-skills:vanguard-method-coach` (framing), or
   `vanguard-method` (systems-thinking framing).
3. Use the returned definition verbatim in the English `en` i18n value.
   Write native da/sv/de — never translate from English. Short forms are fine
   as long as they're derived from the canonical text, not invented.

The i18n keys that currently carry Vanguard definitions (all under `capture.*`):

- `demandHelp`
- `workHelp`
- `demandClassificationHelp`
- `workClassificationHelp`
- `systemConditionsLabel`
- `thinkingLabel`
- `lifeProblemLabel`
- `originalValueDemandLabel`
- `handlingLabel`
- The `strand.*` separator labels (these are one-word and already canonical)

When any of these are touched, **consult the vault first.** If Obsidian isn't
reachable during the session, ask Jonas rather than guessing.

### Canonical terminology — EN / DA / SV

Cached from `03-Resources/concepts/vanguard-glossary.md` and
`Vanguard Terminologi (dansk).md` on 2026-04-19. Use **these exact strings**
for any label, heading, or user-facing copy touching these concepts. If a
concept isn't on this list, query Obsidian before writing. German has **no
canon yet** — the glossary marks DE as "being developed"; existing
`Wert-` / `Fehler-` composition is placeholder, don't invent new DE canon.

| Concept | EN | DA | SV |
|---|---|---|---|
| Value demand | Value demand | Værdiskabende efterspørgsel (VS) | Värdeskapande efterfrågan (VS) |
| Failure demand | Failure demand | Ikke-værdiskabende efterspørgsel (IVS) | Icke-värdeskapande efterfrågan (IVS) |
| Value work | Value work | Værdiskabende arbejde | Värdeskapande arbete |
| Failure work | Failure work | Ikke-værdiskabende arbejde | Icke-värdeskapande arbete |
| System conditions | System conditions | Systemforhold | Systemförhållanden |
| Systems thinking | Systems thinking | Systemtænkning | Systemtänkande |
| Capability | Capability | Kapabilitet | Kapabilitet |
| Flow | Flow | Flow | Flöde |
| Purpose (outside-in) | Purpose | Formål (udefra og ind) | Syfte (utifrån och in) |
| Purpose-Measures-Method | P-M-M | Formål-Måling-Metode | Syfte-Mått-Metod |
| Check-Plan-Do | Check-Plan-Do | Studér-Eksperimentér-Normalisér | Studera-Experimentera-Normalisera |
| Common cause variation | Common cause variation | Almindelig årsagsvariation | Vanliga orsaker |
| Special cause variation | Special cause variation | Speciel årsagsvariation | Speciella orsaker |
| Economies of flow | Economies of flow | Flow-økonomi | Flödesekonomi |

**Banned forms** — never write these, they are explicitly non-canonical per
the Danish authoritative note:

- `fejlefterspørgsel` (DA) — use `ikke-værdiskabende efterspørgsel`
- `felefterfrågan` (SV) — use `icke-värdeskapande efterfrågan`
- `fejlarbejde` (DA) — use `ikke-værdiskabende arbejde`
- `felarbete` (SV) — use `icke-värdeskapande arbete`
- `værdiefterspørgsel` (DA compact) — use `værdiskabende efterspørgsel`
- `värdeefterfrågan` (SV compact) — use `värdeskapande efterfrågan`
- `Fejl` / `Fel` as a classification pill/toggle label — use `Ikke-værdi` /
  `Icke-värde` to parallel `Værdi` / `Värde` (the short form of the canonical
  `Ikke-værdiskabende` / `Icke-värdeskapande`)
- `Systemtankegang` (DA) — use `Systemtænkning`

Before accepting any DA/SV string through a grep or edit, eyeball for these
forms. A sweep happened 2026-04-19 (commit `3a9df44`) and the file should be
clean; regressions are the main risk.
