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
