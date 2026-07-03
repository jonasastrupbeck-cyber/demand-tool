# Decision-box redesign — production migration runbook

Retires the old decision layer (decision points / outcomes / capture fields /
manual milestone outcomes) in favour of milestone **subquestions** with implicit
completion + auto-close. Built expand-contract: **0042–0045 are additive/safe**;
**0046 is the only destructive step** and runs last, decoupled.

Migrations live in `drizzle/`. Applied to a target DB via `scripts/apply-migration.ts`,
which reads `DATABASE_URL`. **Do this outside field-test hours.**

Set the prod connection string once per shell (never put it in `.env.local`):

```bash
export PROD_DB="$(npx neonctl connection-string production --project-id curly-voice-20295099 --pooled)"
```

Apply a migration to prod:

```bash
DATABASE_URL="$PROD_DB" node --import tsx scripts/apply-migration.ts drizzle/<file>.sql
```

---

## Step 0 — Pre-flight recon (read-only)

```bash
DATABASE_URL="$PROD_DB" node --import tsx scripts/decisionbox-recon.ts
```

Note the output — especially:
- **A** — decision-point/outcome/field/decision/value counts (reconcile after 0042).
- **B** — orphan decision points (get a synthetic "Migrated decisions" milestone).
- **C** — ASAP anchors on decisions (re-pointed by 0044). Expect a small number.
- **D** — capability annotations on decision tokens (re-pointed; collisions deduped).
- **F** — `case_milestones` baseline **total** — write it down; it MUST be unchanged after 0042.

Nothing here is unusual = proceed. Anything surprising = check before migrating.

## Step 1 — Apply the additive migrations (0042 → 0045)

```bash
DATABASE_URL="$PROD_DB" node --import tsx scripts/apply-migration.ts drizzle/0042_subquestions.sql
DATABASE_URL="$PROD_DB" node --import tsx scripts/decisionbox-verify-0042.ts   # <-- must PASS
DATABASE_URL="$PROD_DB" node --import tsx scripts/apply-migration.ts drizzle/0043_case_closed_reason.sql
DATABASE_URL="$PROD_DB" node --import tsx scripts/apply-migration.ts drizzle/0044_repoint_decision_tokens.sql
DATABASE_URL="$PROD_DB" node --import tsx scripts/apply-migration.ts drizzle/0045_case_milestone_outcome_nullable.sql
```

**Verify-0042 must PASS** (answers backfill matches; `case_milestones` total ==
recon step-F baseline; no `answered_at` NULLs; no orphan subquestions). If it
FAILs, STOP — nothing destructive has run yet, so the old data is fully intact.

After 0044, confirm no decision tokens remain:

```bash
DATABASE_URL="$PROD_DB" node -e "const{neon}=require('@neondatabase/serverless');const s=neon(process.env.DATABASE_URL);s.query(\"SELECT count(*) FROM what_matters_types WHERE anchor_event LIKE 'decision:%'\").then(r=>{console.log('decision anchors left (want 0):',r[0].count);process.exit()})"
```

## Step 2 — Deploy the code

Merge `decisionbox-redesign` → `main` (Vercel deploys). The app now runs on the
new model; the old tables still physically exist but nothing reads them.

## Step 3 — Verify on live prod

Open a real study (e.g. **U6TFNW**) and confirm:
- Capture: the decision box shows milestone cards with subquestions; recorded
  decisions appear as answered subquestions (data intact); milestones you'd
  marked complete still show complete.
- Dashboard: capability charts look the same as before (point counts unchanged).
- Settings: milestone → subquestions editor renders with your existing config.
- Download-everything export has an **Answers** sheet.

This is the checkpoint. Everything so far is reversible (see Rollback).

## Step 4 — Drop the old layer (destructive, when confident)

Only after Step 3 looks right:

```bash
DATABASE_URL="$PROD_DB" node --import tsx scripts/apply-migration.ts drizzle/0046_drop_decision_layer.sql
```

Then re-open a study and confirm capture/dashboard/settings still work (the code
already ignores the dropped objects, so this should be a no-op UX-wise).

---

## Rollback

- **Code**: Vercel dashboard → Deployments → promote the previous deployment.
- **DB, before 0046**: 0042–0045 are additive; the old tables/data are untouched,
  so reverting the code deploy restores the old behaviour with no DB rollback.
- **DB, after 0046**: the drops are irreversible — which is why 0046 is last and
  gated on Step 3. If you need the old tables back after 0046, restore from the
  Neon point-in-time branch taken before the migration.

## What existing studies experience (summary)

- **No data loss** — 0042 copies every recorded value/decision/outcome into
  subquestion answers (original dates preserved) before 0046 drops anything.
- **History unchanged** — no milestone completions are fabricated; capability
  charts are identical. Decision-based capability/ASAP measures now read the
  decision's *milestone* instead (0044).
- **Behaviour change going forward** — milestone completion is implicit (all
  required subquestions answered), and completing the final milestone auto-closes
  the case (replacing manual achieved/not-achieved).
- **Visible UX change** — capture and settings screens look different; brief any
  active field-test users.
