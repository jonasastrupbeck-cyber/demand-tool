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
import CaseDecisionPoints, { type CaseDecision, type DecisionPointType } from '@/components/CaseDecisionPoints';

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
  onTypesChanged?: () => Promise<void> | void;
  /** "Capture first, stitch when the number arrives": the id of the last
   *  saved entry if it has no case yet — renders a one-tap attach chip. */
  unattachedLastEntryId: string | null;
  onAttachedLast?: (caseId: string) => void;
  // Decision points (Skipton dotted box, 2026-06-12). Empty array hides the box.
  decisionPointsEnabled: boolean;
  decisionPointTypes: DecisionPointType[];
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

export default function CasePanel({ code, demandTypes, handlingTypes, collectorName, activeCaseId, onActiveCaseChange, refreshSignal, systemType, lifeProblems, whatMattersTypes, onTypesChanged, unattachedLastEntryId, onAttachedLast, decisionPointsEnabled, decisionPointTypes, enabled, children }: Props) {
  const { t, tl } = useLocale();

  const [refInput, setRefInput] = useState('');
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
  const [entries, setEntries] = useState<CaseEntry[]>([]);
  const [wmIds, setWmIds] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<CaseDecision[]>([]);
  const [attaching, setAttaching] = useState(false);

  const loadCase = useCallback(async (caseId: string) => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseId)}`);
    if (!res.ok) return;
    const data = await res.json();
    setCaseRow(data);
    setEntries(data.entries || []);
    setWmIds(Array.isArray(data.whatMattersTypeIds) ? data.whatMattersTypeIds : []);
    setDecisions(Array.isArray(data.decisions) ? data.decisions : []);
  }, [code]);

  // Refetch the timeline when the active case changes or an entry was saved.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!activeCaseId) { setCaseRow(null); setEntries([]); return; }
    loadCase(activeCaseId);
  }, [activeCaseId, refreshSignal, loadCase]);

  async function openCase() {
    const ref = refInput.trim();
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

  // Case tracking off: pure passthrough (transactional studies without the
  // toggle see exactly the old page).
  if (!enabled) return <>{children}</>;

  // --- Closed state: ref input, composer below (capture first, stitch later) ---
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
            onClick={openCase}
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
  const isFlow = systemType === 'flow';

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
        + {t('capture.caseAttachLast')}
      </button>
    </div>
  ) : null;

  // Timeline of touches — oldest first. Each touch = one entry with its own
  // collector and Capability of Response (sky badge).
  const timelineList = entries.length === 0 ? (
    <p className="text-xs text-gray-400 text-center py-1">{t('capture.caseTimelineEmpty')}</p>
  ) : (
    <ul className="space-y-1">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center gap-2 text-xs bg-white rounded-lg border border-gray-200 px-2 py-1.5">
          <span className={`shrink-0 w-2 h-2 rounded-full ${CLASSIFICATION_DOT[e.classification]}`} aria-hidden="true" />
          <span className="shrink-0 text-gray-400 tabular-nums">{new Date(e.createdAt).toLocaleDateString()}</span>
          {e.collectorName && <span className="shrink-0 text-gray-600 font-medium">{e.collectorName}</span>}
          <span className="flex-1 min-w-0 truncate text-gray-700">{e.verbatim}</span>
          {handlingLabel(e.handlingTypeId) && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700">
              {handlingLabel(e.handlingTypeId)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );

  const caseFooter = (
    <div className="mt-2 flex items-center justify-between gap-2">
      <p className="text-xs text-gray-400">{t('capture.caseAttachNote')}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => patchCase({ status: isOpen ? 'closed' : 'open' })}
          className="text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 bg-white text-gray-600 hover:border-gray-400 transition-colors"
        >
          {isOpen ? t('capture.caseCloseBtn') : t('capture.caseReopenBtn')}
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

  // Flow mode (2026-06-14): three legible zones so it's clear what's "already
  // there" (the case) vs "what I'm adding" (the composer):
  //   1. tinted case-state panel (constant — attached to the value demand & problem)
  //   2. previous touches (history)
  //   3. white "What's happening now?" composer card (the add zone)
  if (isFlow) {
    return (
      <>
        <div className="mb-3 rounded-xl border border-green-100 bg-green-50/40 p-3">
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
          {decisionPointsEnabled && (
            <CaseDecisionPoints
              code={code}
              caseId={caseRow.id}
              decisionPointTypes={decisionPointTypes}
              decisions={decisions}
              collectorName={collectorName}
              onChanged={() => loadCase(caseRow.id)}
            />
          )}
          {attachLastChip}
        </div>

        {/* Previous touches — the history of the flow. */}
        <div className="mb-3">
          {entries.length > 0 && (
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1 px-1">
              {t('capture.casePreviousTouches')}
            </p>
          )}
          {timelineList}
        </div>

        {/* The add zone — visually distinct white card so it's clear this is
            where you add the next touch. */}
        {children && (
          <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-sm font-semibold text-gray-900 mb-2">{t('capture.caseComposerHeading')}</p>
            {children}
          </div>
        )}

        {caseFooter}
      </>
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
