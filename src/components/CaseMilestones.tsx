'use client';

/**
 * CaseMilestones — the redesigned decision box (2026-07-02).
 *
 * The decision-point layer is flattened away: each milestone simply holds a set
 * of SUBQUESTIONS (typed boxes). A milestone is COMPLETE for a case once all its
 * required subquestions are answered — no achieved/not-achieved toggle, no
 * outcome pills. Completion (and its date = the latest answer that completed it)
 * is derived server-side; this component only captures answers and reflects the
 * derived completion. Filling a subquestion linked to a what-matters ask both
 * records AND evaluates the delivered value (shared ask-verdict rules).
 *
 * Replaces CaseDecisionPoints. Drafts are seeded once from the case's answers;
 * the parent keys this component by caseId so switching cases reseeds cleanly
 * (no reseed effect → no clobber of in-progress typing).
 */

import { useState, useMemo, type ReactElement } from 'react';
import { useLocale } from '@/lib/locale-context';
import { askVerdict, type CaptureKind } from '@/lib/ask-verdict';
import SubquestionInput, { type Subquestion, type Draft, EMPTY_DRAFT } from '@/components/SubquestionInput';
import { parseAmountLoose, formatCurrency, currencyForSubquestion } from '@/lib/format-currency';
import { evalFormula, formatCalcResult, type Resolved } from '@/lib/formula';
import { visibleSubquestionIds } from '@/lib/subquestion-visibility';
import { buildSubquestionTree, type SubqTreeNode } from '@/lib/subquestion-tree';
import { localDay } from '@/lib/local-date';

export interface MilestoneWithSubqs {
  id: string;
  label: string;
  sortOrder: number;
  subquestions: Subquestion[];
  // Milestone demand-type EXCLUSIONS (0056): ids this milestone is skipped for.
  // Empty = applies to every case.
  demandTypeExclusions: string[];
}

export interface CaseSubquestionAnswer {
  subquestionId: string;
  valueNumber: number | null;
  valueDate: string | null;
  valueYears: number | null;
  valueMonths: number | null;
  valueChoice: string | null;
  valueText: string | null;
  answeredAt: string;
}

// The derived (or legacy) completion cache row for a milestone.
export interface CaseMilestone {
  id: string;
  milestoneId: string;
  reachedAt: string;
  derived?: boolean;
}

export interface AskValue {
  targetDate: string | null;
  amountSpecific: number | null;
  amountMin: number | null;
  amountMax: number | null;
  termYears: number | null;
  termMonths: number | null;
}
export interface LinkedWhatMattersType { id: string; label: string; }

interface Props {
  code: string;
  caseId: string;
  milestones: MilestoneWithSubqs[];
  answers: CaseSubquestionAnswer[];
  caseMilestones: CaseMilestone[];
  // Dynamic milestones (0051): this case's demand-type ids, to filter which
  // milestones apply.
  caseDemandTypeIds?: string[];
  whatMattersValues?: Record<string, AskValue>;
  whatMattersTypes?: LinkedWhatMattersType[];
  collectorName: string;
  onChanged: () => Promise<void> | void;
  compact?: boolean;
}

const draftFromAnswer = (a?: CaseSubquestionAnswer): Draft => ({
  num: a?.valueNumber != null ? String(a.valueNumber) : '',
  date: a?.valueDate ? a.valueDate.slice(0, 10) : '',
  years: a?.valueYears != null ? String(a.valueYears) : '',
  months: a?.valueMonths != null ? String(a.valueMonths) : '',
  choice: a?.valueChoice ?? '',
  text: a?.valueText ?? '',
});

const todayISO = () => localDay();

export default function CaseMilestones({ code, caseId, milestones, answers, caseMilestones, caseDemandTypeIds = [], whatMattersValues = {}, whatMattersTypes = [], collectorName, onChanged, compact = false }: Props) {
  const { t, tl, locale } = useLocale();

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const byId = new Map(answers.map((a) => [a.subquestionId, a]));
    const seed: Record<string, Draft> = {};
    for (const m of milestones) for (const sq of m.subquestions) seed[sq.id] = draftFromAnswer(byId.get(sq.id));
    return seed;
  });
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [completedOn, setCompletedOn] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  // Close prompt after picking a negative-polarity option (never auto-closes).
  const [closePrompt, setClosePrompt] = useState(false);
  const [closing, setClosing] = useState(false);

  const setDraft = (sqId: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [sqId]: { ...(prev[sqId] ?? EMPTY_DRAFT), ...patch } }));

  const completeByMilestone = new Map(caseMilestones.map((r) => [r.milestoneId, r]));

  // Conditional visibility (0050): resolve live from current drafts across ALL
  // milestones (a parent choice can gate a child on another milestone). Hidden
  // subquestions are neither rendered nor sent on save (the server also clears
  // any stale hidden answer).
  // allSubqsFlat + its id→subquestion index depend only on `milestones`, so
  // memoize them (they were rebuilt on every keystroke via the drafts-driven
  // re-render below). The id index also replaces an O(n²) `.find` inside the
  // visibility filter.
  const { allSubqsFlat, subqById } = useMemo(() => {
    const allSubqsFlat = milestones.flatMap((m) => m.subquestions);
    const subqById = new Map<string, Subquestion>();
    for (const s of allSubqsFlat) subqById.set(s.id, s);
    return { allSubqsFlat, subqById };
  }, [milestones]);
  const choiceBySubqId = new Map(allSubqsFlat.map((s) => [s.id, (drafts[s.id] ?? EMPTY_DRAFT).choice || null]));
  const conditionVisible = visibleSubquestionIds(allSubqsFlat.map((s) => ({ id: s.id, conditions: s.conditions })), choiceBySubqId);
  // Per-subquestion demand-type exclusions (0054): a subquestion whose exclusion
  // set intersects the case's demand types is hidden + not saved + non-gating —
  // fold it into the same visibility set the render and save paths use.
  const isExcluded = (s: Subquestion) => (s.demandTypeExclusions ?? []).some((id) => caseDemandTypeIds.includes(id));
  const visibleIds = new Set([...conditionVisible].filter((id) => {
    const s = subqById.get(id);
    return s ? !isExcluded(s) : true;
  }));

  // --- Save a milestone's answers (0042) ---------------------------------
  const parseNum = (s: string) => { const n = parseFloat(s); return Number.isFinite(n) ? n : null; };
  const parseInt10 = (s: string) => { const n = parseInt(s, 10); return Number.isInteger(n) ? n : null; };

  // Calculated subquestions derive their value from sibling drafts (see
  // src/lib/formula.ts). Resolve refs case-wide (subqById above); a `seen` set
  // prevents a cyclic calculated→calculated reference from looping.
  const computeCalc = (sq: Subquestion, seen: Set<string> = new Set()): number | null => {
    if (!sq.formula || seen.has(sq.id)) return null;
    const next = new Set(seen); next.add(sq.id);
    const resolve = (id: string): Resolved => {
      const s = subqById.get(id);
      if (s && s.kind === 'calculated') return { number: computeCalc(s, next), years: null, months: null, date: null };
      const dd = drafts[id] ?? EMPTY_DRAFT;
      const y = parseInt10(dd.years), mo = parseInt10(dd.months);
      // A duration_months sibling resolves to its total months for BOTH a bare
      // {sq:id} reference AND MONTHS({sq:id}).
      if (s?.kind === 'duration_months') {
        const total = (y != null || mo != null) ? (y ?? 0) * 12 + (mo ?? 0) : null;
        return { number: total, years: y, months: mo, date: null };
      }
      const num = s?.kind === 'currency' ? parseAmountLoose(dd.num) : parseNum(dd.num);
      return { number: num, years: y, months: mo, date: dd.date || null };
    };
    return evalFormula(sq.formula, resolve);
  };

  function toAnswer(sq: Subquestion, d: Draft, answeredAt: string) {
    return {
      subquestionId: sq.id,
      valueNumber: sq.kind === 'calculated' ? computeCalc(sq)
        : sq.kind === 'currency' ? parseAmountLoose(d.num)
        : (sq.kind === 'amount' || sq.kind === 'number' || sq.kind === 'percent') ? parseNum(d.num)
        : sq.kind === 'duration_months' ? ((parseInt10(d.years) != null || parseInt10(d.months) != null) ? (parseInt10(d.years) ?? 0) * 12 + (parseInt10(d.months) ?? 0) : null) : null,
      valueDate: sq.kind === 'date' && d.date ? `${d.date}T12:00:00.000Z` : null,
      valueYears: (sq.kind === 'duration' || sq.kind === 'duration_months') ? parseInt10(d.years) : null,
      valueMonths: (sq.kind === 'duration' || sq.kind === 'duration_months') ? parseInt10(d.months) : null,
      valueChoice: sq.kind === 'choice' && d.choice ? d.choice : null,
      valueText: sq.kind === 'text' && d.text.trim() ? d.text.trim() : null,
      answeredAt: `${answeredAt}T12:00:00.000Z`,
    };
  }

  async function saveMilestone(m: MilestoneWithSubqs) {
    if (savingId) return;
    setSavingId(m.id);
    const on = completedOn[m.id] ?? todayISO();
    const answersPayload = m.subquestions.filter((sq) => visibleIds.has(sq.id)).map((sq) => toAnswer(sq, drafts[sq.id] ?? EMPTY_DRAFT, on));
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseId)}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answersPayload, recordedByCollector: collectorName || undefined }),
    });
    if (res.ok) await onChanged();
    setSavingId(null);
  }

  async function closeCase() {
    if (closing) return;
    setClosing(true);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    });
    if (res.ok) { setClosePrompt(false); await onChanged(); }
    setClosing(false);
  }

  // --- Ask evaluation (linked subquestion: asked vs delivered) -----------
  const fmtDuration = (years: number | null, months: number | null) => {
    const parts: string[] = [];
    if (years != null && years !== 0) parts.push(`${years} ${t('capture.unitYearsShort')}`);
    if (months != null && months !== 0) parts.push(`${months} ${t('capture.unitMonthsShort')}`);
    return parts.length ? parts.join(' ') : `0 ${t('capture.unitYearsShort')}`;
  };
  const askText = (ask: AskValue): string | null =>
    ask.targetDate ? new Date(ask.targetDate).toLocaleDateString()
      : ask.amountSpecific != null ? `≤ ${ask.amountSpecific}`
      : (ask.amountMin != null || ask.amountMax != null) ? `${ask.amountMin ?? '…'}–${ask.amountMax ?? '…'}`
      : (ask.termYears != null || ask.termMonths != null) ? fmtDuration(ask.termYears, ask.termMonths)
      : null;

  const renderAskLine = (sq: Subquestion, d: Draft) => {
    if (!sq.linkedWhatMattersTypeId) return null;
    // text/choice/percent/calculated/duration_months aren't comparable to a timed/amount ask; number compares like amount.
    if (sq.kind === 'text' || sq.kind === 'choice' || sq.kind === 'percent' || sq.kind === 'calculated' || sq.kind === 'duration_months') return null;
    const ask = whatMattersValues[sq.linkedWhatMattersTypeId];
    if (!ask) return null;
    const text = askText(ask);
    if (!text) return null;
    const vkind: CaptureKind = (sq.kind === 'number' || sq.kind === 'currency') ? 'amount' : sq.kind;
    const num = sq.kind === 'currency' ? parseAmountLoose(d.num) : parseFloat(d.num);
    const y = parseInt(d.years, 10);
    const mo = parseInt(d.months, 10);
    const v = askVerdict(vkind, ask, {
      valueNumber: Number.isFinite(num) ? num : null,
      valueDate: d.date || null,
      valueYears: Number.isInteger(y) ? y : null,
      valueMonths: Number.isInteger(mo) ? mo : null,
    });
    const wmLabel = whatMattersTypes.find((w) => w.id === sq.linkedWhatMattersTypeId)?.label;
    let badge: string | null = null;
    let met: boolean | null = v.comparable ? v.met : null;
    if (v.comparable && v.met !== null) {
      if (vkind === 'date' && v.diffDays !== null) {
        badge = v.met ? (v.diffDays === 0 ? t('capture.evalMet') : `${-v.diffDays} ${t('capture.evalDaysEarly')}`) : `${v.diffDays} ${t('capture.evalDaysLate')}`;
      } else if (vkind === 'duration' && v.diffMonths !== null && !v.met) {
        const sign = v.diffMonths > 0 ? '+' : '−';
        badge = `${sign}${fmtDuration(Math.floor(Math.abs(v.diffMonths) / 12), Math.abs(v.diffMonths) % 12)}`;
      } else if (vkind === 'amount' && v.diffAmount !== null) {
        // Under / Met / Over budget + by how much. Currency fields format the
        // delta with their currency; plain amount/number use a grouped number.
        const abs = Math.abs(v.diffAmount);
        const amt = sq.kind === 'currency'
          ? formatCurrency(abs, currencyForSubquestion(sq.currencyCode, locale), locale)
          : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(abs);
        badge = v.diffAmount === 0 ? t('capture.evalMet')
          : v.diffAmount < 0 ? `${t('capture.evalUnderBudget')} ${amt}`
          : `${t('capture.evalOverBudget')} ${amt}`;
      } else {
        badge = v.met ? t('capture.evalMet') : t('capture.evalNotMet');
      }
    } else {
      met = null;
    }
    return (
      <p className="text-[10px] leading-tight text-center">
        <span className="text-gray-400">{t('capture.wmAskLabel')}{wmLabel ? ` (${tl(wmLabel)})` : ''}: </span>
        <span className="text-gray-600">{text}</span>
        {badge && (
          <span className={`ml-1 font-medium ${met ? 'text-green-700' : 'text-red-600'}`}>{met ? '✓' : '✗'} {badge}</span>
        )}
      </p>
    );
  };

  if (milestones.length === 0) return null;

  // Dynamic milestones (0051): only show milestones that apply to this case's
  // demand types (no scope = applies to all). Mirrors getApplicableMilestoneIds.
  const applicableMilestones = milestones.filter((m) => !(m.demandTypeExclusions ?? []).some((id) => caseDemandTypeIds.includes(id)));
  const ordered = [...applicableMilestones].sort((a, b) => a.sortOrder - b.sortOrder);
  const firstIncompleteIdx = ordered.findIndex((m) => !completeByMilestone.has(m.id));

  return (
    <div className="space-y-2">
      {ordered.map((m, idx) => {
        const rec = completeByMilestone.get(m.id);
        const complete = !!rec;
        const subqs = [...m.subquestions].filter((sq) => visibleIds.has(sq.id)).sort((a, b) => a.sortOrder - b.sortOrder);
        // Builder UX (2026-07-04): follow-ups render indented directly under
        // the answer that revealed them (same tree helper as settings). This is
        // render-only — visibility, drafts and the save payload are untouched.
        const tree = buildSubquestionTree(m.subquestions, allSubqsFlat);
        const renderNode = (node: SubqTreeNode<Subquestion>, depth: number): ReactElement | null => {
          const sq = node.subq;
          if (!visibleIds.has(sq.id)) return null;
          return (
            <div key={sq.id} className={depth > 0 && depth <= 2 ? 'ml-2 pl-2 border-l-2 border-sky-100 space-y-1.5' : 'space-y-1.5'}>
              <div className="flex flex-col items-center gap-0.5">
                <SubquestionInput
                  subquestion={sq}
                  draft={drafts[sq.id] ?? EMPTY_DRAFT}
                  onChange={(patch) => setDraft(sq.id, patch)}
                  compact={compact}
                  onNegativePick={() => setClosePrompt(true)}
                  computed={sq.kind === 'calculated' ? formatCalcResult(computeCalc(sq), sq.resultFormat) : undefined}
                />
                {renderAskLine(sq, drafts[sq.id] ?? EMPTY_DRAFT)}
              </div>
              {[...sq.options].sort((a, b) => a.sortOrder - b.sortOrder).flatMap((o) =>
                (node.childrenByTrigger.get(o.label) ?? []).map((c) => renderNode(c, depth + 1)))}
            </div>
          );
        };
        const defaultOpen = idx === firstIncompleteIdx;
        const isOpen = m.id in overrides ? overrides[m.id] : defaultOpen;
        const toggleOpen = (open: boolean) => setOverrides((o) => ({ ...o, [m.id]: open }));

        if (!isOpen) {
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleOpen(true)}
              aria-label={t('capture.milestoneExpand')}
              className={`w-full flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-left transition-colors ${complete ? 'border-green-300 bg-green-50/70 hover:bg-green-100/70' : 'border-sky-200 bg-sky-50/50 hover:bg-sky-100/50'}`}
            >
              <span className="shrink-0 w-4 text-[10px] text-gray-400 tabular-nums text-center">{idx + 1}</span>
              <span className={`flex-1 text-xs font-medium truncate ${complete ? 'text-green-800' : 'text-gray-500'}`}>{tl(m.label)}</span>
              {complete && rec && <span className="shrink-0 text-[10px] text-green-600 tabular-nums">{new Date(rec.reachedAt).toLocaleDateString()}</span>}
              <span className="shrink-0 text-[10px] text-gray-400">{complete ? '✓' : '+'}</span>
            </button>
          );
        }

        return (
          <div key={m.id} className={`rounded-xl border-2 p-2 space-y-1.5 ${complete ? 'border-green-300 bg-green-50/40' : 'border-sky-200 bg-white'}`}>
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 w-4 text-[10px] text-gray-400 tabular-nums text-center">{idx + 1}</span>
              <p className="flex-1 text-xs font-semibold text-gray-800 truncate">{tl(m.label)}</p>
              {complete && rec && <span className="shrink-0 text-[10px] text-green-600">✓ {new Date(rec.reachedAt).toLocaleDateString()}</span>}
              <button type="button" onClick={() => toggleOpen(false)} aria-label={t('capture.milestoneCollapse')} className="shrink-0 text-[10px] text-gray-400 hover:text-gray-700 px-1 leading-none">▾</button>
            </div>

            {subqs.length === 0 && (
              <p className="text-[10px] text-gray-400 text-center italic">{t('capture.milestoneNoSubquestions')}</p>
            )}
            {tree.roots.map((n) => renderNode(n, 0))}

            {subqs.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-center">
                  <label className="flex items-center gap-1 text-[10px] text-gray-500">
                    {t('capture.milestoneCompletedOnLabel')}
                    <input
                      type="date"
                      value={completedOn[m.id] ?? todayISO()}
                      onChange={(e) => setCompletedOn((o) => ({ ...o, [m.id]: e.target.value }))}
                      className="px-1.5 py-0.5 rounded text-[10px] text-gray-700 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <button type="button" onClick={() => saveMilestone(m)} disabled={savingId === m.id} className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50 transition-colors">{t('settings.save')}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {closePrompt && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50/60 p-2 space-y-1.5">
          <p className="text-[11px] text-red-800 text-center">{t('capture.closePromptTitle')}</p>
          <div className="flex items-center justify-center gap-1.5">
            <button type="button" onClick={closeCase} disabled={closing} className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">{t('capture.closePromptConfirm')}</button>
            <button type="button" onClick={() => setClosePrompt(false)} className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">{t('capture.closePromptCancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
