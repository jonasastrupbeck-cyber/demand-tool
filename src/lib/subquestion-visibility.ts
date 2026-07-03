/**
 * subquestion-visibility.ts — pure resolver for conditional subquestion
 * visibility (0050, 2026-07-03). Shared by the client (CaseMilestones, live from
 * drafts) and the server (queries recompute + hidden-answer clearing) so both
 * agree on exactly one rule.
 *
 * A subquestion is visible when it has NO conditions, OR at least one condition
 * whose parent's current choice equals the trigger value AND the parent is
 * itself visible (so a hidden parent hides its descendants). A fixed-point loop
 * handles nesting and can't infinite-loop — a node only ever flips hidden→visible
 * once; a true cycle simply leaves its members hidden.
 */

export interface VisibilityCondition {
  parentSubquestionId: string;
  triggerValue: string;
}

export interface VisibilitySubq {
  id: string;
  conditions: VisibilityCondition[];
}

export function visibleSubquestionIds(
  subqs: VisibilitySubq[],
  choiceBySubqId: Map<string, string | null | undefined>,
): Set<string> {
  const byId = new Map(subqs.map((s) => [s.id, s]));
  const visible = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const sq of subqs) {
      if (visible.has(sq.id)) continue;
      const noCond = sq.conditions.length === 0;
      const parentOk = sq.conditions.some((c) => {
        const parent = byId.get(c.parentSubquestionId);
        const parentVisible = !parent || parent.conditions.length === 0 || visible.has(parent.id);
        return parentVisible && choiceBySubqId.get(c.parentSubquestionId) === c.triggerValue;
      });
      if (noCond || parentOk) { visible.add(sq.id); changed = true; }
    }
  }
  return visible;
}
