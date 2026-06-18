#!/usr/bin/env bash
# One-shot: apply the additive schema migrations (0019–0027) to the PRODUCTION
# Neon database. Every migration is CREATE/ALTER ... IF NOT EXISTS, so it is
# additive and idempotent — existing demand data is untouched. Run once for the
# production merge (2026-06-18). Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Fetching the production connection string…"
PROD_URL="$(npx --yes neonctl connection-string production --project-id curly-voice-20295099 --pooled 2>/dev/null | grep -oE 'postgresql://[^ ]+' | head -1)"
if [ -z "${PROD_URL:-}" ]; then
  echo "ERROR: could not get the production connection string (neonctl not logged in?)."
  exit 1
fi

for f in 0019_case_stitching 0020_system_type_case_context 0021_decision_points \
         0022_work_block_system_condition 0023_cor_customer_felt 0024_decision_substates \
         0025_flow_layout 0026_milestones 0027_capability_annotations; do
  echo ""
  echo "=== applying $f ==="
  DATABASE_URL="$PROD_URL" node --import tsx scripts/apply-migration.ts "drizzle/$f.sql"
done

echo ""
echo "ALL DONE ✅  — production schema is up to date."
