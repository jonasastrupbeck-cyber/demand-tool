/**
 * subquestion-tree.ts — pure grouping of a milestone's subquestions into a tree
 * (decision-box builder UX, 2026-07-04). Used by BOTH the settings authoring
 * page and the capture view so what you build is exactly what collectors see.
 *
 * A subquestion is grouped as a CHILD under its parent's answer option iff ALL of:
 *   - it has exactly ONE visibility condition (conditions sorted by id first,
 *     since the DB doesn't order them),
 *   - the parent lives on the SAME milestone and is a choice question,
 *   - the trigger value matches one of the parent's current option labels.
 * Everything else is a ROOT, with a note explaining why when it has conditions:
 *   - crossMilestone: parent lives on another milestone → "shown when X = Y".
 *   - multiCondition: OR across several triggers — rendering it under an
 *     arbitrary "first" group would visually lie about OR semantics.
 *   - staleTrigger: points at a removed answer option. Today such a child
 *     silently never shows at capture; surfacing it is an improvement.
 * A cycle (A under B, B under A — self-reference is API-blocked but longer
 * loops aren't) leaves its members unreachable from any root; they are promoted
 * to roots with a crossMilestone-style note so nothing ever disappears.
 */

export interface TreeSubq {
  id: string;
  milestoneId: string;
  kind: string;
  sortOrder: number;
  options: { label: string; sortOrder: number }[];
  conditions: { id: string; parentSubquestionId: string; triggerValue: string }[];
}

export type RootNote =
  | { type: 'crossMilestone'; parentId: string; triggerValue: string }
  | { type: 'multiCondition'; conditions: { parentId: string; triggerValue: string }[] }
  | { type: 'staleTrigger'; parentId: string; triggerValue: string };

export interface SubqTreeNode<S extends TreeSubq = TreeSubq> {
  subq: S;
  // Children grouped by the parent option LABEL that reveals them. Iterate in
  // the parent's option order (options[].label) — lists are sortOrder-sorted.
  childrenByTrigger: Map<string, SubqTreeNode<S>[]>;
}

export function buildSubquestionTree<S extends TreeSubq>(
  milestoneSubqs: S[],
  allStudySubqs: TreeSubq[],
): { roots: SubqTreeNode<S>[]; rootNoteById: Map<string, RootNote> } {
  const byId = new Map(allStudySubqs.map((s) => [s.id, s]));
  const inMilestone = new Set(milestoneSubqs.map((s) => s.id));

  const rootNoteById = new Map<string, RootNote>();
  const childOf = new Map<string, { parentId: string; trigger: string }>();
  const rootIds = new Set<string>();

  for (const sq of milestoneSubqs) {
    if (sq.conditions.length === 0) { rootIds.add(sq.id); continue; }
    if (sq.conditions.length > 1) {
      rootIds.add(sq.id);
      const conds = [...sq.conditions].sort((a, b) => a.id.localeCompare(b.id));
      rootNoteById.set(sq.id, { type: 'multiCondition', conditions: conds.map((c) => ({ parentId: c.parentSubquestionId, triggerValue: c.triggerValue })) });
      continue;
    }
    const cond = [...sq.conditions].sort((a, b) => a.id.localeCompare(b.id))[0];
    const parent = byId.get(cond.parentSubquestionId);
    if (!parent || !parent.options.some((o) => o.label === cond.triggerValue)) {
      // Parent gone (shouldn't happen — conditions cascade) or option removed.
      rootIds.add(sq.id);
      rootNoteById.set(sq.id, { type: 'staleTrigger', parentId: cond.parentSubquestionId, triggerValue: cond.triggerValue });
      continue;
    }
    if (parent.milestoneId !== sq.milestoneId || !inMilestone.has(parent.id) || parent.kind !== 'choice') {
      rootIds.add(sq.id);
      rootNoteById.set(sq.id, { type: 'crossMilestone', parentId: parent.id, triggerValue: cond.triggerValue });
      continue;
    }
    childOf.set(sq.id, { parentId: parent.id, trigger: cond.triggerValue });
  }

  // Promote cycle members (children never reachable from a root) to roots.
  const attached = new Set(rootIds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, { parentId }] of childOf) {
      if (attached.has(id)) continue;
      if (attached.has(parentId)) { attached.add(id); changed = true; }
    }
  }
  for (const [id, { parentId, trigger }] of childOf) {
    if (attached.has(id)) continue;
    childOf.delete(id);
    rootIds.add(id);
    rootNoteById.set(id, { type: 'crossMilestone', parentId, triggerValue: trigger });
  }

  // Build nodes and attach children under their trigger label.
  const nodeById = new Map<string, SubqTreeNode<S>>(
    milestoneSubqs.map((s) => [s.id, { subq: s, childrenByTrigger: new Map<string, SubqTreeNode<S>[]>() }]),
  );
  for (const [id, { parentId, trigger }] of childOf) {
    const parentNode = nodeById.get(parentId)!;
    const list = parentNode.childrenByTrigger.get(trigger) ?? [];
    list.push(nodeById.get(id)!);
    parentNode.childrenByTrigger.set(trigger, list);
  }
  for (const node of nodeById.values()) {
    for (const list of node.childrenByTrigger.values()) list.sort((a, b) => a.subq.sortOrder - b.subq.sortOrder);
  }

  const roots = milestoneSubqs
    .filter((s) => rootIds.has(s.id))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => nodeById.get(s.id)!);

  return { roots, rootNoteById };
}
