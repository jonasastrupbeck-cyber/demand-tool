import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getStudyByCode, getCases, getEntries, getHandlingTypes, getDemandTypes,
  getContactMethods, getPointsOfTransaction, getWhatMattersTypes, getLifeProblems,
  getSystemConditions, getThinkings, getMilestones, getDecisionPointTypes, getWorkStepTypes,
  getWhatMattersForEntries, getSystemConditionsForEntries, getThinkingsForEntries, getWorkBlocksForEntries,
} from '@/lib/queries';
import { db } from '@/lib/db';
import { caseDecisionPoints, caseMilestones, capabilityAnnotations } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import * as XLSX from 'xlsx';

// R11 (2026-06-18): "download everything" — a multi-sheet workbook with all the
// input captured for a study (cases, touches, work blocks, decisions, milestones,
// capability annotations), labels resolved inline. Read-only. Works for flow
// (Cases/Decisions/Milestones populated) and transactional (those just empty).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const [
    cases, entries, hTypes, dTypes, cMethods, potTypes, wmTypes, lProblems,
    scTypes, thTypes, msTypes, dpTypes, wsTypes,
  ] = await Promise.all([
    getCases(study.id), getEntries(study.id), getHandlingTypes(study.id), getDemandTypes(study.id),
    getContactMethods(study.id), getPointsOfTransaction(study.id), getWhatMattersTypes(study.id),
    getLifeProblems(study.id), getSystemConditions(study.id), getThinkings(study.id),
    getMilestones(study.id), getDecisionPointTypes(study.id), getWorkStepTypes(study.id),
  ]);

  const caseRefById = new Map(cases.map((c) => [c.id, c.caseRef]));
  const hMap = new Map(hTypes.map((h) => [h.id, h.label]));
  const dMap = new Map(dTypes.map((d) => [d.id, d.label]));
  const cmMap = new Map(cMethods.map((c) => [c.id, c.label]));
  const potMap = new Map(potTypes.map((p) => [p.id, p.label]));
  const wmMap = new Map(wmTypes.map((w) => [w.id, w.label]));
  const lpMap = new Map(lProblems.map((l) => [l.id, l.label]));
  const scMap = new Map(scTypes.map((s) => [s.id, s.label]));
  const thMap = new Map(thTypes.map((t) => [t.id, t.label]));
  const msMap = new Map(msTypes.map((m) => [m.id, m.label]));
  const dpMap = new Map(dpTypes.map((d) => [d.id, d.label]));
  const wsMap = new Map(wsTypes.map((w) => [w.id, w.label]));

  // Resolve a capability event token to a readable label.
  const eventLabel = (token: string): string => {
    if (token === 'caseOpen') return 'Case opened';
    if (token === 'firstContact') return 'First contact';
    if (token === 'caseClose') return 'Case closed';
    if (token.startsWith('milestone:')) return msMap.get(token.slice('milestone:'.length)) || token;
    if (token.startsWith('decision:')) return dpMap.get(token.slice('decision:'.length)) || token;
    return token;
  };

  const entryIds = entries.map((e) => e.id);
  const caseIds = cases.map((c) => c.id);

  // Bulk junction reads (avoid N+1).
  const [wmJ, scJ, thJ, wbJ] = await Promise.all([
    entryIds.length ? getWhatMattersForEntries(entryIds) : Promise.resolve([]),
    entryIds.length ? getSystemConditionsForEntries(entryIds) : Promise.resolve([]),
    entryIds.length ? getThinkingsForEntries(entryIds) : Promise.resolve([]),
    entryIds.length ? getWorkBlocksForEntries(entryIds) : Promise.resolve([]),
  ]);
  const [decisions, milestones, annotations] = await Promise.all([
    caseIds.length ? db.select().from(caseDecisionPoints).where(inArray(caseDecisionPoints.caseId, caseIds)) : Promise.resolve([]),
    caseIds.length ? db.select().from(caseMilestones).where(inArray(caseMilestones.caseId, caseIds)) : Promise.resolve([]),
    caseIds.length ? db.select().from(capabilityAnnotations).where(inArray(capabilityAnnotations.caseId, caseIds)) : Promise.resolve([]),
  ]);

  const wmByEntry = new Map<string, string[]>();
  for (const j of wmJ) { const a = wmByEntry.get(j.demandEntryId) || []; const l = wmMap.get(j.whatMattersTypeId); if (l) a.push(l); wmByEntry.set(j.demandEntryId, a); }
  const scByEntry = new Map<string, { helps: string[]; hinders: string[] }>();
  for (const j of scJ) { const e = scByEntry.get(j.demandEntryId) || { helps: [], hinders: [] }; const l = scMap.get(j.systemConditionId); if (l) { (j.dimension === 'helps' ? e.helps : e.hinders).push(l); } scByEntry.set(j.demandEntryId, e); }
  const thByEntry = new Map<string, string[]>();
  for (const j of thJ) { const l = thMap.get(j.thinkingId); if (!l) continue; const a = thByEntry.get(j.demandEntryId) || []; a.push(j.logic && j.logic.trim() ? `${l}: ${j.logic.trim()}` : l); thByEntry.set(j.demandEntryId, a); }

  // ── Sheet: Cases ──
  const casesData = cases.map((c) => ({
    'Case Ref': c.caseRef,
    'Status': c.status,
    'Opened At': c.openedAt ? new Date(c.openedAt).toLocaleString() : '',
    'Closed At': c.closedAt ? new Date(c.closedAt).toLocaleString() : '',
    'Demand Type': c.demandTypeId ? dMap.get(c.demandTypeId) || '' : '',
    'Life Problem': c.lifeProblemId ? lpMap.get(c.lifeProblemId) || '' : '',
    'What Matters': (c.whatMattersTypeIds || '').split(',').map((id: string) => wmMap.get(id.trim()) || '').filter(Boolean).join(', '),
    'Entries': c.entryCount,
    'Last Touch': c.lastEntryAt ? new Date(c.lastEntryAt).toLocaleString() : '',
    'Created By': c.createdByCollector || '',
  }));

  // ── Sheet: Touches ──
  const touchesData = entries.map((e) => {
    const sc = scByEntry.get(e.id);
    return {
      'Case Ref': e.caseId ? caseRefById.get(e.caseId) || '' : '',
      'Date': new Date(e.createdAt).toLocaleString(),
      'Entry Type': e.entryType === 'work' ? 'Work' : 'Demand',
      'Verbatim': e.verbatim,
      'Classification': e.classification,
      'Demand Type': e.demandTypeId ? dMap.get(e.demandTypeId) || '' : '',
      'Capability of Response': e.handlingTypeId ? hMap.get(e.handlingTypeId) || '' : '',
      'Customer Felt': e.customerFelt == null ? '' : (e.customerFelt ? 'Yes' : 'No'),
      'Contact Method': e.contactMethodId ? cmMap.get(e.contactMethodId) || '' : '',
      'Point of Transaction': e.pointOfTransactionId ? potMap.get(e.pointOfTransactionId) || '' : '',
      'What Matters': (wmByEntry.get(e.id) || []).join(', '),
      'What Matters (Notes)': e.whatMatters || '',
      'Life Problem': e.lifeProblemId ? lpMap.get(e.lifeProblemId) || '' : '',
      'System Conditions (Hinders)': sc ? sc.hinders.join('; ') : '',
      'System Conditions (Helps)': sc ? sc.helps.join('; ') : '',
      'Thinkings': (thByEntry.get(e.id) || []).join('; '),
      'Collector': e.collectorName || '',
    };
  });

  // ── Sheet: Work blocks ──
  const dateByEntry = new Map(entries.map((e) => [e.id, e.createdAt]));
  const caseByEntry = new Map(entries.map((e) => [e.id, e.caseId]));
  const blocksData = wbJ.map((b) => ({
    'Case Ref': (() => { const cid = caseByEntry.get(b.demandEntryId); return cid ? caseRefById.get(cid) || '' : ''; })(),
    'Touch Date': (() => { const d = dateByEntry.get(b.demandEntryId); return d ? new Date(d).toLocaleString() : ''; })(),
    'Tag': b.tag,
    'Text': b.text,
    'Work Step Type': b.workStepTypeId ? wsMap.get(b.workStepTypeId) || '' : '',
    'Block System Condition': b.systemConditionId ? scMap.get(b.systemConditionId) || '' : '',
    'Order': b.sortOrder,
  }));

  // ── Sheet: Decisions ──
  const decisionsData = decisions.map((d) => ({
    'Case Ref': caseRefById.get(d.caseId) || '',
    'Decision': dpMap.get(d.decisionPointTypeId) || '',
    'Outcome': d.outcome,
    'Cleanliness': d.cleanliness,
    'Dirty Cause': d.dirtyCause || '',
    'Willingness To Pay': d.willingnessToPay == null ? '' : (d.willingnessToPay ? 'Yes' : 'No'),
    'Ability To Pay': d.abilityToPay == null ? '' : (d.abilityToPay ? 'Yes' : 'No'),
    'Decided At': d.decidedAt ? new Date(d.decidedAt).toLocaleString() : '',
    'Recorded By': d.recordedByCollector || '',
  }));

  // ── Sheet: Milestones ──
  const milestonesData = milestones.map((m) => ({
    'Case Ref': caseRefById.get(m.caseId) || '',
    'Milestone': msMap.get(m.milestoneId) || '',
    'Outcome': m.outcome,
    'Reached At': m.reachedAt ? new Date(m.reachedAt).toLocaleString() : '',
    'Recorded By': m.recordedByCollector || '',
  }));

  // ── Sheet: Capability annotations ──
  const annotationsData = annotations.map((a) => ({
    'Case Ref': caseRefById.get(a.caseId) || '',
    'From': eventLabel(a.fromEvent),
    'To': eventLabel(a.toEvent),
    'Excluded': a.excluded ? 'Yes' : 'No',
    'Excluded Reason': a.excludedReason || '',
    'Note': a.note || '',
  }));

  const wb = XLSX.utils.book_new();
  const add = (rows: Record<string, unknown>[], name: string) => {
    // json_to_sheet needs at least a header; for empty sheets seed one blank row's keys.
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  add(casesData, 'Cases');
  add(touchesData, 'Touches');
  add(blocksData, 'Work Blocks');
  add(decisionsData, 'Decisions');
  add(milestonesData, 'Milestones');
  add(annotationsData, 'Capability Annotations');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="study-all-${code}.xlsx"`,
    },
  });
}
