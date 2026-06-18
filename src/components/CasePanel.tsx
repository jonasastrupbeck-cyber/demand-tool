'use client';

/**
 * CasePanel — case stitching for flow-based demand (Skipton slice 1, 2026-06-11).
 *
 * One privacy-safe case reference number = one customer = one value demand.
 * Typing a reference finds-or-creates the case; the panel then shows its
 * timeline of touches (every entry saved against the case, oldest first) so a
 * collector picking the case up mid-flow sees what already happened. The
 * timeline ordered by time IS the repeatable Capability-of-Response sequence —
 * each touch carries its own CoR badge.
 *
 * The parent (capture page) owns the active case id and attaches it to every
 * saved entry; `refreshSignal` bumps after each save so the timeline refetches.
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale-context';
import PillSelect from '@/components/PillSelect';
import InfoPopover from '@/components/InfoPopover';
import CaseContextSection from '@/components/CaseContextSection';
import CaseDecisionPoints, { type CaseDecision, type DecisionPointType, type Milestone, type CaseMilestone } from '@/components/CaseDecisionPoints';

interface CaseRow {
  id: string;
  caseRef: string;
  demandTypeId: string | null;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
  // Flow-mode person context (slice B).
  contextSituation: string | null;
  lifeProblemId: string | null;
  whatMatters: string | null;
}

interface CaseEntry {
  id: string;
  createdAt: string;
  verbatim: string;
  classification: 'value' | 'failure' | 'unknown' | 'sequence';
  entryType: 'demand' | 'work';
  handlingTypeId: string | null;
  collectorName: string | null;
  // C5/R6 (2026-06-17): shown on the full saved-touch card in the freeze rail.
  customerFelt?: boolean | null;
  // 2026-06-18: distinct non-null system-condition ids on this touch's work
  // blocks (comma-joined by getCaseEntries), shown on top of the saved card.
  systemConditionIds?: string | null;
}

interface Props {
  code: string;
  demandTypes: { id: string; category: 'value' | 'failure'; label: string; operationalDefinition: string | null }[];
  handlingTypes: { id: string; label: string }[];
  collectorName: string;
  activeCaseId: string | null;
  onActiveCaseChange: (c: { id: string; caseRef: string } | null) => void;
  /** Bump after each saved entry so the timeline refetches. */
  refreshSignal: number;
  // Flow mode (slice B): when 'flow', the case carries the person context
  // (context & situation, P2BS, what matters) via CaseContextSection.
  systemType: 'transactional' | 'flow';
  lifeProblems: { id: string; label: string; operationalDefinition: string | null }[];
  whatMattersTypes: { id: string; label: string; operationalDefinition?: string | null }[];
  // 2026-06-18: SC taxonomy for the id→label lookup on the saved-touch card.
  systemConditions: { id: string; label: string }[];
  onTypesChanged?: () => Promise<void> | void;
  /** "Capture first, stitch when the number arrives": the id of the last
   *  saved entry if it has no case yet — renders a one-tap attach chip. */
  unattachedLastEntryId: string | null;
  onAttachedLast?: (caseId: string) => void;
  // Decision points (Skipton dotted box, 2026-06-12). Empty array hides the box.
  decisionPointsEnabled: boolean;
  decisionPointTypes: DecisionPointType[];
  // Milestones (2026-06-18): ordered containers grouping the decision points.
  milestones: Milestone[];
  /** Tap a previous touch to open its full detail/edit window (2026-06-14). */
  onOpenEntry?: (id: string) => void;
  /** When false, CasePanel is a pure passthrough rendering only children —
   *  lets the capture page wrap the composer unconditionally. */
  enabled: boolean;
  /** The composer (entry form). Flow mode renders it INSIDE the case card,
   *  between the timeline and the footer, so the page reads as one case
   *  object; transactional renders it below, exactly as before. */
  children?: React.ReactNode;
}

const CLASSIFICATION_DOT: Record<CaseEntry['classification'], string> = {
  value: 'bg-green-500',
  failure: 'bg-red-500',
  sequence: 'bg-amber-400',
  unknown: 'bg-gray-300',
};

export default function CasePanel({ code, demandTypes, handlingTypes, collectorName, activeCaseId, onActiveCaseChange, refreshSignal, systemType, lifeProblems, whatMattersTypes, systemConditions, onTypesChanged, unattachedLastEntryId, onAttachedLast, decisionPointsEnabled, decisionPointTypes, milestones, onOpenEntry, enabled, children }: Props) {
  const { t, tl } = useLocale();

  const [refInput, setRefInput] = useState('');
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
  const [entries, setEntries] = useState<CaseEntry[]>([]);
  const [wmIds, setWmIds] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<CaseDecision[]>([]);
  const [caseMilestones, setCaseMilestones] = useState<CaseMilestone[]>([]);
  const [attaching, setAttaching] = useState(false);
  // Previous touches collapse to the latest by default; expand reveals history.
  const [touchesExpanded, setTouchesExpanded] = useState(false);
  // Flow entry (2026-06-14): one unified type-ahead reference field. The
  // composer stays hidden until a customer is open. caseList backs the
  // combobox's recent-open list and its autocomplete matches.
  const isFlow = systemType === 'flow';
  const [caseList, setCaseList] = useState<{ id: string; caseRef: string; status: 'open' | 'closed'; openedAt: string; demandTypeId: string | null; lifeProblemId: string | null; whatMattersTypeIds: string | null; entryCount: number; lastEntryAt: string | null; lastEntryVerbatim: string | null }[]>([]);

  const loadCase = useCallback(async (caseId: string) => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseId)}`);
    if (!res.ok) return;
    const data = await res.json();
    setCaseRow(data);
    setEntries(data.entries || []);
    setWmIds(Array.isArray(data.whatMattersTypeIds) ? data.whatMattersTypeIds : []);
    setDecisions(Array.isArray(data.decisions) ? data.decisions : []);
    setCaseMilestones(Array.isArray(data.milestones) ? data.milestones : []);
  }, [code]);

  // Refetch the timeline when the active case changes or an entry was saved.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!activeCaseId) { setCaseRow(null); setEntries([]); return; }
    loadCase(activeCaseId);
  }, [activeCaseId, refreshSignal, loadCase]);

  // Flow chooser: load the customer (case) list so the chooser can show recent
  // open customers and enforce new-vs-existing. Reuses the existing list route.
  const loadCaseList = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases`);
    if (!res.ok) return;
    const data = await res.json();
    setCaseList(Array.isArray(data) ? data : []);
  }, [code]);

  useEffect(() => {
    if (!enabled || systemType !== 'flow' || activeCaseId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCaseList();
  }, [enabled, systemType, activeCaseId, refreshSignal, loadCaseList]);

  async function openCase(refArg?: string) {
    const ref = (refArg ?? refInput).trim();
    if (!ref || opening) return;
    setOpening(true);
    setError('');
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseRef: ref, collectorName: collectorName || undefined }),
      });
      if (!res.ok) { setError(t('capture.caseNotFound')); setOpening(false); return; }
      const data: CaseRow = await res.json();
      setRefInput('');
      onActiveCaseChange({ id: data.id, caseRef: data.caseRef });
    } catch {
      setError(t('capture.caseNotFound'));
    }
    setOpening(false);
  }

  async function patchCase(body: Record<string, unknown>) {
    if (!caseRow) return;
    // Optimistic local update; refetch on failure to re-sync. The what-matters
    // set lives in its own state (junction-backed), the rest on caseRow.
    const { whatMattersTypeIds: nextWmIds, ...rowFields } = body as { whatMattersTypeIds?: string[] } & Record<string, unknown>;
    if (nextWmIds !== undefined) setWmIds(nextWmIds);
    if (Object.keys(rowFields).length > 0) setCaseRow({ ...caseRow, ...rowFields } as CaseRow);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseRow.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) await loadCase(caseRow.id);
  }

  // "Capture first, stitch when the number arrives" (slice B3): attach the
  // last saved un-stitched entry to this case in one tap.
  async function attachLastEntry() {
    if (!caseRow || !unattachedLastEntryId || attaching) return;
    setAttaching(true);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${encodeURIComponent(unattachedLastEntryId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseRow.id }),
    });
    if (res.ok) {
      onAttachedLast?.(caseRow.id);
      await loadCase(caseRow.id);
    }
    setAttaching(false);
  }

  const handlingLabel = (id: string | null) => {
    if (!id) return null;
    const ht = handlingTypes.find((h) => h.id === id);
    return ht ? tl(ht.label) : null;
  };
  // Comma-joined SC ids on a touch → localized labels (drops unknown/empty).
  const scLabels = (ids: string | null | undefined) => (ids || '').split(',').filter(Boolean)
    .map((id) => { const x = systemConditions.find((s) => s.id === id); return x ? tl(x.label) : null; })
    .filter((l): l is string => !!l);

  // Case tracking off: pure passthrough (transactional studies without the
  // toggle see exactly the old page).
  if (!enabled) return <>{children}</>;

  // --- Flow closed state: one unified type-ahead reference field. What you
  //     type decides it — a match continues that customer, no match opens a new
  //     one. The composer (children) stays hidden until a customer is open. ---
  if (isFlow && (!activeCaseId || !caseRow)) {
    // Cold-start entry screen (Option A, 2026-06-17): one smart reference field
    {
      // [former freeze-only gate removed 2026-06-17 — freeze is the only flow
      //  layout now; the old stacked combobox card was deleted.]
      // that drives the primary action AND filters the recent list. In both the
      // new-case and resume paths the user types the same thing (the reference);
      // the screen decides new-vs-resume from whether it already exists — no
      // search-vs-create lane choice. Replaces the sparse 4-column table.
      const dtLabel = (id: string | null) => { const x = demandTypes.find((d) => d.id === id); return x ? tl(x.label) : ''; };
      const lpLabel = (id: string | null) => { const x = lifeProblems.find((l) => l.id === id); return x ? tl(x.label) : ''; };
      const wmLabel = (ids: string | null) => (ids || '').split(',').filter(Boolean)
        .map((i) => { const x = whatMattersTypes.find((w) => w.id === i); return x ? tl(x.label) : null; })
        .filter(Boolean).join(', ');
      // A one-line summary for a recent row / the found line: demand, else the
      // life problem, else what-matters (whatever the study actually populates).
      const summary = (c: typeof caseList[number]) => dtLabel(c.demandTypeId) || lpLabel(c.lifeProblemId) || wmLabel(c.whatMattersTypeIds);
      const touchLabel = (n: number) => n === 1 ? t('capture.customerTouchOne') : t('capture.customerTouches', { n: String(n) });
      // Last touch (2026-06-18): date + a clean excerpt of the latest entry's
      // work description (strip the [value]/[sequence]/[failure] block tags) so
      // users recognise the case. Null when the case has no entries yet.
      const lastTouch = (c: typeof caseList[number]) => {
        if (!c.lastEntryAt) return null;
        const text = (c.lastEntryVerbatim || '')
          .split('\n\n')
          .map((s) => s.replace(/^\[(value|sequence|failure)\]\s*/, '').trim())
          .filter(Boolean)
          .join(' · ');
        const excerpt = text.length > 60 ? `${text.slice(0, 60)}…` : text;
        return { date: new Date(c.lastEntryAt).toLocaleDateString(), excerpt };
      };
      const q = refInput.trim();
      const matched = q ? caseList.find((c) => c.caseRef.toLowerCase() === q.toLowerCase()) : undefined;
      // Recent list: open cases before closed, each group newest-first (caseList
      // already arrives createdAt-desc). Filter by what's typed (startsWith).
      const filtered = (q ? caseList.filter((c) => c.caseRef.toLowerCase().startsWith(q.toLowerCase())) : caseList);
      const recent = [...filtered].sort((a, b) => (a.status === b.status ? 0 : a.status === 'open' ? -1 : 1));
      return (
        <div className="max-w-2xl mx-auto mt-6">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <p className="text-lg font-semibold text-gray-800">{t('capture.customerRefHeading')}</p>
            <InfoPopover label={t('capture.customerRefHelp')}>{t('capture.customerRefHelp')}</InfoPopover>
          </div>

          {/* Smart field — drives the button and filters the list below. */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && q) { e.preventDefault(); openCase(q); } }}
              placeholder={t('capture.caseSearchPlaceholder')}
              aria-label={t('capture.caseSearchPlaceholder')}
              className="flex-1 px-3 py-2.5 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
            />
            <button
              type="button"
              onClick={() => q && openCase(q)}
              disabled={!q || opening}
              className={`shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
                matched
                  ? 'border border-sky-300 bg-white text-sky-700 hover:bg-sky-50 hover:border-sky-500'
                  : 'text-white bg-brand hover:bg-brand-hover'
              }`}
            >
              {matched
                ? t('capture.customerResume')
                : (q ? `+ ${t('capture.customerOpenAsNew', { ref: q })}` : t('capture.caseTableEnter'))}
            </button>
          </div>

          {/* Live feedback line — confirm the right customer before resuming, or
              that a new one will be created. Empty input shows nothing. */}
          {q && (
            <p className="mt-2 text-xs text-center min-h-[1rem]">
              {matched ? (
                <span className="text-sky-700">
                  {t('capture.customerFoundPrefix')}
                  {summary(matched) ? ` — ${summary(matched)}` : ''} · {touchLabel(matched.entryCount)} · {t('capture.customerOpenedOn', { date: new Date(matched.openedAt).toLocaleDateString() })}
                  {matched.status === 'closed' && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-500 align-middle">{t('capture.caseStatusClosed')}</span>}
                </span>
              ) : (
                <span className="text-gray-500">{t('capture.customerNewHint')}</span>
              )}
            </p>
          )}

          {/* Recent customers — clean rows, not a wide table. */}
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1.5 px-1">{t('capture.customerRecentOpen')}</p>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {caseList.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray-400">{t('capture.caseTableEmpty')}</p>
              ) : recent.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray-400">{t('capture.customerNoMatch')}</p>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {recent.map((c) => {
                    const lt = lastTouch(c);
                    return (
                    <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
                      <span className="font-medium text-gray-900 tabular-nums whitespace-nowrap min-w-[4.5rem] self-start mt-0.5">
                        #{c.caseRef}
                        {c.status === 'closed' && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-500">{t('capture.caseStatusClosed')}</span>}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-gray-600">{summary(c)}</p>
                        {lt && (
                          <p className="truncate text-xs text-gray-400">{lt.date}{lt.excerpt ? ` · ${lt.excerpt}` : ''}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-gray-400 tabular-nums self-start mt-0.5">{touchLabel(c.entryCount)}</span>
                      <button
                        type="button"
                        onClick={() => openCase(c.caseRef)}
                        disabled={opening}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border border-sky-300 bg-white text-sky-700 hover:bg-sky-50 hover:border-sky-500 disabled:opacity-50 transition-colors"
                      >
                        {t('capture.customerResume')}
                      </button>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-600 text-center">{error}</p>}
        </div>
      );
    }
  }

  // --- Transactional closed state: ref input, composer below (capture first,
  //     stitch later). Unchanged. ---
  if (!activeCaseId || !caseRow) {
    return (
      <>
      <div className="mb-4">
        <div className="flex items-center justify-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); openCase(); } }}
            placeholder={t('capture.caseRefPlaceholder')}
            aria-label={t('capture.caseRefPlaceholder')}
            className="w-56 px-3 py-1.5 rounded-full text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none text-center"
          />
          <button
            type="button"
            onClick={() => openCase()}
            disabled={!refInput.trim() || opening}
            className="px-3 py-1.5 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t('capture.caseOpenBtn')}
          </button>
          <InfoPopover label={t('capture.caseRefHelp')}>
            {t('capture.caseRefHelp')}
          </InfoPopover>
        </div>
        {error && <p className="mt-1 text-xs text-red-600 text-center">{error}</p>}
      </div>
      {children}
      </>
    );
  }

  // --- Open state: case card with timeline ---
  const valueDemandTypes = demandTypes.filter((d) => d.category === 'value');
  const isOpen = caseRow.status === 'open';

  // Shared sub-blocks — composed differently in flow vs transactional layouts.
  const headerRow = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="font-semibold text-gray-900 text-sm">#{caseRow.caseRef}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
        isOpen ? 'border-green-300 bg-green-50 text-green-700' : 'bg-gray-200 border-gray-300 text-gray-600'
      }`}>
        {isOpen ? t('capture.caseStatusOpen') : t('capture.caseStatusClosed')}
      </span>
      {/* Transactional case: the value demand stays in the header (no life
          problem to anchor it to). Flow mode renders it inside
          CaseContextSection, directly under the life problem. */}
      {!isFlow && valueDemandTypes.length > 0 && (
        <PillSelect
          ariaLabel={t('capture.caseDemandTypePlaceholder')}
          placeholder={t('capture.caseDemandTypePlaceholder')}
          value={caseRow.demandTypeId || ''}
          onChange={(id) => patchCase({ demandTypeId: id || null })}
          options={valueDemandTypes.map((dt) => ({ id: dt.id, label: tl(dt.label), operationalDefinition: dt.operationalDefinition ? tl(dt.operationalDefinition) : null }))}
          variant={caseRow.demandTypeId ? 'value' : 'valueLight'}
        />
      )}
      <label className="flex items-center gap-1 text-xs text-gray-500">
        {t('capture.caseOpenedAt')}
        <input
          type="date"
          value={caseRow.openedAt ? caseRow.openedAt.slice(0, 10) : ''}
          onChange={(e) => {
            if (!e.target.value) return;
            // Keep the original time-of-day; only the date is edited here.
            const time = caseRow.openedAt ? caseRow.openedAt.slice(10) : 'T09:00:00.000Z';
            patchCase({ openedAt: `${e.target.value}${time}` });
          }}
          className="px-2 py-1 rounded-lg text-xs text-gray-700 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
        />
      </label>
    </div>
  );

  const attachLastChip = unattachedLastEntryId ? (
    <div className="mt-2 flex justify-center">
      <button
        type="button"
        onClick={attachLastEntry}
        disabled={attaching}
        className="text-xs px-3 py-1.5 rounded-full font-medium border border-dashed border-gray-400 bg-white text-gray-700 hover:border-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
      >
        + {t(isFlow ? 'capture.customerAttachLast' : 'capture.caseAttachLast')}
      </button>
    </div>
  ) : null;

  // Timeline of touches — oldest first. Each touch = one entry with its own
  // collector and Capability of Response (sky badge). Tapping a touch opens
  // its full detail/edit window via onOpenEntry.
  const renderTouch = (e: CaseEntry) => (
    <button
      key={e.id}
      type="button"
      onClick={() => onOpenEntry?.(e.id)}
      className="w-full flex items-center gap-2 text-xs bg-white rounded-lg border border-gray-200 px-2 py-1.5 text-left hover:border-gray-400 hover:bg-gray-50 transition-colors"
    >
      <span className={`shrink-0 w-2 h-2 rounded-full ${CLASSIFICATION_DOT[e.classification]}`} aria-hidden="true" />
      <span className="shrink-0 text-gray-400 tabular-nums">{new Date(e.createdAt).toLocaleDateString()}</span>
      {e.collectorName && <span className="shrink-0 text-gray-600 font-medium">{e.collectorName}</span>}
      <span className="flex-1 min-w-0 truncate text-gray-700">{e.verbatim}</span>
      {handlingLabel(e.handlingTypeId) && (
        <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700">
          {handlingLabel(e.handlingTypeId)}
        </span>
      )}
    </button>
  );

  // C5/R6 (2026-06-17): a saved touch rendered IN FULL for the freeze rail —
  // the work steps exactly as captured (parsed from the stored `[tag] text`
  // verbatim, colour-coded value/sequence/failure, wrapped not truncated), plus
  // the COR and the customer-felt flag. Read-only; clicking opens the edit window.
  // Touches pile up left→right so the whole flow is visible end-to-end.
  const STEP_TAG_CLASS: Record<string, string> = {
    value: 'border-green-200 bg-green-50 text-green-800',
    sequence: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    failure: 'border-red-200 bg-red-50 text-red-800',
  };
  const renderTouchFull = (e: CaseEntry) => {
    const steps = e.verbatim.split('\n\n')
      .map((line) => {
        const m = line.match(/^\[(value|sequence|failure)\]\s*([\s\S]*)$/);
        return m ? { tag: m[1], text: m[2] } : { tag: 'value', text: line };
      })
      .filter((s) => s.text.trim().length > 0);
    const cor = handlingLabel(e.handlingTypeId);
    const scs = scLabels(e.systemConditionIds);
    // Small section header — a centered label flanked by thin lines, matching the
    // composer's flow separator (capture.strand.flow), so the card reads in clear
    // sections (2026-06-18).
    const sepHeader = (label: string) => (
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[10px] tracking-widest text-gray-400 font-medium uppercase whitespace-nowrap">{label}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    );
    return (
      // h-full so the card stretches to the row's height (= the composer), giving
      // an even overview. Sections: Conditions (if any) → Steps (grows) → CoR.
      <button
        key={e.id}
        type="button"
        onClick={() => onOpenEntry?.(e.id)}
        className="w-full h-full text-left rounded-xl border border-gray-200 bg-white p-2 hover:border-gray-400 transition-colors flex flex-col gap-1.5"
      >
        {/* 1. System condition(s) driving this touch — only when present. */}
        {scs.length > 0 && (
          <div className="flex flex-col gap-1">
            {sepHeader(t('capture.touchSecConditions'))}
            <div className="flex flex-wrap gap-1">
              {scs.map((label, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] leading-snug break-words">{label}</span>
              ))}
            </div>
          </div>
        )}
        {/* 2. What happened — colour-coded steps. flex-1 absorbs slack so the CoR
            section pins to the bottom on a stretched card. */}
        <div className="flex flex-col gap-1 flex-1">
          {sepHeader(t('capture.touchSecSteps'))}
          <div className="space-y-1">
            {steps.map((s, i) => (
              <div key={i} className={`px-1.5 py-1 rounded-md border text-[11px] leading-snug whitespace-pre-wrap break-words ${STEP_TAG_CLASS[s.tag] ?? STEP_TAG_CLASS.value}`}>
                {s.text}
              </div>
            ))}
          </div>
        </div>
        {/* 3. CoR + authoring (date, collector) at the bottom. */}
        <div className="flex flex-col gap-1">
          {sepHeader(t('capture.touchSecCor'))}
          <div className="flex flex-wrap items-center gap-1.5">
            {cor && <span className="px-1.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px]">{cor}</span>}
            <span className="text-[10px] text-gray-400 tabular-nums">{new Date(e.createdAt).toLocaleDateString()}</span>
            {e.collectorName && <span className="text-[10px] text-gray-500 font-medium truncate">{e.collectorName}</span>}
          </div>
        </div>
      </button>
    );
  };

  // Collapsed: only the latest touch + a "Show N earlier" control. Expanded:
  // earlier touches (oldest→latest) revealed above the latest, which stays
  // pinned at the bottom (nearest the composer) — no jump.
  const earlierTouches = entries.slice(0, -1);
  const latestTouch = entries.length > 0 ? entries[entries.length - 1] : null;
  const timelineList = entries.length === 0 ? (
    <p className="text-xs text-gray-400 text-center py-1">{t('capture.caseTimelineEmpty')}</p>
  ) : (
    <div className="space-y-1">
      {earlierTouches.length > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setTouchesExpanded((v) => !v)}
            className="text-[11px] text-gray-500 hover:text-gray-700 font-medium"
          >
            {touchesExpanded ? `⌃ ${t('capture.caseShowLess')}` : `⌄ ${t('capture.caseShowEarlierTouches', { count: String(earlierTouches.length) })}`}
          </button>
        </div>
      )}
      {touchesExpanded && earlierTouches.map(renderTouch)}
      {latestTouch && renderTouch(latestTouch)}
    </div>
  );

  const caseFooter = (
    <div className="mt-2 flex items-center justify-between gap-2">
      <p className="text-xs text-gray-400">{t(isFlow ? 'capture.customerAttachNote' : 'capture.caseAttachNote')}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => patchCase({ status: isOpen ? 'closed' : 'open' })}
          className="text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 bg-white text-gray-600 hover:border-gray-400 transition-colors"
        >
          {isOpen ? t(isFlow ? 'capture.customerCloseBtn' : 'capture.caseCloseBtn') : t('capture.caseReopenBtn')}
        </button>
        <button
          type="button"
          onClick={() => onActiveCaseChange(null)}
          className="text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 bg-white text-gray-600 hover:border-gray-400 transition-colors"
        >
          {t('capture.caseSetAside')}
        </button>
      </div>
    </div>
  );

  // C5 (2026-06-17): wide-screen freeze-pane layout. Two frozen panes —
  // customer context (left) and decision milestones (right) — with the touch
  // rail scrolling horizontally between them, the composer as the newest column.
  // Built for wide/curved screens; recomposes the same sub-blocks as the stacked
  // flow, so capture logic is identical.
  if (isFlow) {
    return (
      // Responsive (2026-06-17): wide screens (lg+) keep the three frozen-pane
      // columns (customer left · touch rail + composer middle · decisions right).
      // Below lg it stacks vertically — capture-first order: context → composer →
      // touches → decisions — so nothing collapses or scrolls off on a phone.
      // R2: lg:items-start so each pane is content-height. R5: dashed boundaries
      // (lg only — they read as zone separators across, not stacked).
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-0 lg:items-stretch min-h-[24rem]">
        {/* LEFT frozen pane — the customer. Full width on mobile, fixed on lg.
            Border-2 darker green, matching the composer's emphasis (2026-06-18). */}
        <aside className="order-1 w-full lg:w-80 shrink-0 rounded-xl border-2 border-green-600 bg-green-100/50 p-3">
          {/* R9: open another customer (a new reference) without leaving capture. */}
          <div className="flex justify-center mb-2">
            <button
              type="button"
              onClick={() => onActiveCaseChange(null)}
              className="text-xs px-3 py-1.5 rounded-full font-medium border border-dashed border-gray-400 bg-white text-gray-700 hover:border-gray-600 hover:bg-gray-50 transition-colors"
            >
              + {t('capture.openNewReference')}
            </button>
          </div>
          {headerRow}
          <CaseContextSection
            code={code}
            contextSituation={caseRow.contextSituation}
            lifeProblemId={caseRow.lifeProblemId}
            whatMatters={caseRow.whatMatters}
            whatMattersTypeIds={wmIds}
            lifeProblems={lifeProblems}
            whatMattersTypes={whatMattersTypes}
            demandTypeId={caseRow.demandTypeId}
            valueDemandTypes={valueDemandTypes}
            onPatch={patchCase}
            onTypesChanged={onTypesChanged}
          />
          {attachLastChip}
          <div className="mt-3 pt-2 border-t border-green-200/70">{caseFooter}</div>
        </aside>

        {/* ┊ LEFT dashed boundary — a dedicated vertical line, thicker (border-l-4)
            and slightly taller than the panes (protrudes ~10px top & bottom via the
            calc height + negative margin). lg only. */}
        <div aria-hidden className="hidden lg:flex shrink-0 self-stretch items-stretch mx-3 order-2">
          <div className="border-l-4 border-dashed border-gray-500 h-[calc(100%+1.25rem)] -my-2.5" />
        </div>

        {/* WORKING AREA — the flow AND the (pinned) Decisions, all left of the
            right dotted line. On lg: a row of [scrolling touch rail + composer]
            then Decisions, pinned so it stays in view while the rail scrolls.
            On mobile: composer → touches → decisions, stacked. */}
        <div className="order-2 flex-1 min-w-0 flex flex-col gap-3 lg:flex-row lg:gap-3 lg:items-stretch">
          {/* Touch rail + composer — the only horizontally-scrolling part. */}
          <div className="flex-1 min-w-0 lg:overflow-x-auto">
            <div className="flex flex-col gap-3 lg:flex-row lg:min-w-min lg:items-stretch pb-2">
              {entries.map((e) => (
                // ~half the old width (more touches fit). Stretches to the row
                // (composer) height for an even overview; sections fill it.
                <div key={e.id} className="order-2 lg:order-1 w-full lg:w-36 shrink-0 flex">
                  {renderTouchFull(e)}
                </div>
              ))}
              {children && (
                // R6: the composer is clearly "where I'm working now" (brand ring).
                // On lg it's content-width and grows right as blocks are added
                // (~2 blocks min); on mobile it's full width and comes first.
                <div className="order-1 lg:order-2 w-full lg:w-fit lg:min-w-[37rem] shrink-0 rounded-xl border-2 border-brand bg-white p-3 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{t('capture.caseComposerHeading')}</p>
                  {children}
                </div>
              )}
            </div>
          </div>
          {/* Decisions — pinned at the right of the working area, always visible
              (no divider before it; just left of the right dotted line). */}
          {decisionPointsEnabled && (
            <div className="w-full lg:w-80 shrink-0">
              <div className="rounded-xl bg-sky-50/70 border-2 border-sky-300 p-2">
                <p className="text-[10px] uppercase tracking-widest text-sky-700/70 font-medium mb-1 px-1 text-center">
                  {t('capture.caseDecisionsHeading')}
                </p>
                <CaseDecisionPoints
                  code={code}
                  caseId={caseRow.id}
                  decisionPointTypes={decisionPointTypes}
                  decisions={decisions}
                  milestones={milestones}
                  caseMilestones={caseMilestones}
                  collectorName={collectorName}
                  variant="overview"
                  onChanged={() => loadCase(caseRow.id)}
                />
              </div>
            </div>
          )}
        </div>

        {/* ┊ RIGHT dashed boundary — dedicated line (thicker + protruding), lg only. */}
        <div aria-hidden className="hidden lg:flex shrink-0 self-stretch items-stretch mx-3 order-3">
          <div className="border-l-4 border-dashed border-gray-500 h-[calc(100%+1.25rem)] -my-2.5" />
        </div>

        {/* RIGHT pane + COR list — each saved touch's Capability of Response in
            chronological order (oldest top → newest bottom). Read-only summary of
            the sequence of capabilities; click a row to open that touch. */}
        <aside className="order-3 w-full lg:w-72 shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-sky-700/70 font-medium mb-1 px-1 text-center">
            {t('capture.handlingLabel')}
          </p>
          <div className="space-y-1.5">
            {entries.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">—</p>
            ) : entries.map((e, i) => {
              const cor = handlingLabel(e.handlingTypeId);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpenEntry?.(e.id)}
                  className="w-full flex items-center gap-2 text-left"
                >
                  <span className="shrink-0 w-4 text-[10px] text-gray-400 tabular-nums text-right">{i + 1}</span>
                  {cor ? (
                    <span className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs truncate">{cor}</span>
                  ) : (
                    <span className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 text-xs italic">—</span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    );
  }

  // Transactional case (case tracking on, not flow): single card, composer
  // renders below — unchanged from before.
  return (
    <>
    <div className="mb-4 rounded-xl border border-gray-300 bg-gray-50 p-3">
      {headerRow}
      {attachLastChip}
      <div className="mt-2">{timelineList}</div>
      {caseFooter}
    </div>
    {children}
    </>
  );
}
