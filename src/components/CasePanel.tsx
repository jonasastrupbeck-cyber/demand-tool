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

import { memo, useCallback, useEffect, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useLocale } from '@/lib/locale-context';
import PillSelect from '@/components/PillSelect';
import SegmentedToggle from '@/components/SegmentedToggle';
import InfoPopover from '@/components/InfoPopover';
import CaseContextSection, { type WmValue } from '@/components/CaseContextSection';
import { useSyncedTopScrollbar, TopScrollbar } from '@/components/TopScrollbar';
import CaseMilestones, { type MilestoneWithSubqs, type CaseMilestone, type CaseSubquestionAnswer } from '@/components/CaseMilestones';
import { localDay, localDayOf } from '@/lib/local-date';

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
  // Multi-select sets (2026-07-02); lifeProblemId/demandTypeId above stay as the
  // primary (first) for the summary row + dashboards.
  lifeProblemIds?: string[];
  demandTypeIds?: string[];
  whatMatters: string | null;
  // Broker/Direct channel (0061). channel null = not set; firm/broker only when broker.
  channel: 'broker' | 'direct' | null;
  firmName: string | null;
  brokerName: string | null;
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
  // Drag-reorder (migration 0034): explicit position + effective date (earliest
  // block date, else created_at) — what the rail displays and orders by.
  sortOrder?: number | null;
  effectiveAt?: string;
  // Captured value-creation-capability (0059), shown as a pill beside the CoR in
  // the Capability-of-Response rail. Null = not captured / not applicable.
  valueCreationCapability?: 'created' | 'maintained' | 'missed' | null;
  // Worked-on-by (0065): who did the work; shown beside the collector when set
  // and different from the collector.
  workedByName?: string | null;
}

interface Props {
  code: string;
  /** Study name — shown as a quiet centred title atop the flow panes (R, 2026-06-19). */
  studyName?: string;
  demandTypes: { id: string; category: 'value' | 'failure'; label: string; operationalDefinition: string | null }[];
  handlingTypes: { id: string; label: string }[];
  collectorName: string;
  /** Pencil action in the flow action bar — clears the name to re-ask "Who
   *  are you?". Undefined = no pencil (name shown read-only). */
  onEditName?: () => void;
  activeCaseId: string | null;
  onActiveCaseChange: (c: { id: string; caseRef: string } | null) => void;
  /** Bump after each saved entry so the timeline refetches. */
  refreshSignal: number;
  // Flow mode (slice B): when 'flow', the case carries the person context
  // (context & situation, P2BS, what matters) via CaseContextSection.
  systemType: 'transactional' | 'flow';
  lifeProblems: { id: string; label: string; operationalDefinition: string | null }[];
  whatMattersTypes: { id: string; label: string; operationalDefinition?: string | null; timing?: 'by_date' | 'asap' | null; enabled?: boolean; valueKind?: 'amount' | 'date_or_duration' | null }[];
  // 2026-06-18: SC taxonomy for the id→label lookup on the saved-touch card.
  systemConditions: { id: string; label: string }[];
  onTypesChanged?: () => Promise<void> | void;
  /** "Capture first, stitch when the number arrives": the id of the last
   *  saved entry if it has no case yet — renders a one-tap attach chip. */
  unattachedLastEntryId: string | null;
  onAttachedLast?: (caseId: string) => void;
  // Decision box gate (Skipton, 2026-06-12). Off hides the milestone panel.
  decisionPointsEnabled: boolean;
  // Broker/Direct channel capture (migration 0061, 2026-07-10). Off hides the
  // Broker/Direct toggle + Firm/Broker fields in the flow customer box.
  brokerChannelEnabled?: boolean;
  // Value creation capability (0059). On adds a colour-coded VCC pill beside each
  // CoR pill in the Capability-of-Response rail (display of what was captured).
  valueCreationCapabilityEnabled?: boolean;
  // Consultant archive (migration 0066): whether the study has a consultant PIN,
  // so the "Archive case" confirm knows whether to prompt for it.
  hasConsultantPin?: boolean;
  // Milestones (2026-06-18): ordered containers. Since 0042 each carries its
  // subquestions (the flattened decision box).
  milestones: MilestoneWithSubqs[];
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

// Value-creation-capability pill colours (0059) for the Capability-of-Response rail —
// same pill shape as the CoR pill, colour-coded by judgement.
const VCC_PILL_CLASS: Record<'created' | 'maintained' | 'missed', string> = {
  created: 'bg-green-50 border-green-200 text-green-700',
  maintained: 'bg-sky-50 border-sky-200 text-sky-700',
  missed: 'bg-amber-50 border-amber-200 text-amber-700',
};

const STEP_TAG_CLASS: Record<string, string> = {
  value: 'border-green-200 bg-green-50 text-green-800',
  sequence: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  failure: 'border-red-200 bg-red-50 text-red-800',
  // failure_demand (the demand hitting you) — rose, distinct from failure work.
  failure_demand: 'border-rose-300 bg-rose-50 text-rose-800',
};

// A saved touch rendered IN FULL for the freeze rail (was the inline
// `renderTouchFull`). Extracted + memoized (CAP-16): the composer's state lives
// in the capture page and the composer is CasePanel's `children`, so every
// keystroke re-rendered CasePanel and re-parsed every touch's verbatim. As a
// React.memo with stable props (entry unchanged, taxonomies + onOpenEntry stable
// via useCallback), typing no longer re-renders the saved cards. Read-only;
// clicking opens the edit window.
const TouchCardFull = memo(function TouchCardFull({ entry: e, handlingTypes, systemConditions, onOpenEntry }: {
  entry: CaseEntry;
  handlingTypes: { id: string; label: string }[];
  systemConditions: { id: string; label: string }[];
  onOpenEntry?: (id: string) => void;
}) {
  const { t, tl } = useLocale();
  const steps = e.verbatim.split(/\n\n(?=\[(?:value|sequence|failure|failure_demand)\])/)
    .map((line) => {
      const m = line.match(/^\[(value|sequence|failure|failure_demand)\]\s*([\s\S]*)$/);
      return m ? { tag: m[1], text: m[2] } : { tag: 'value', text: line };
    })
    .filter((s) => s.text.trim().length > 0);
  const cor = e.handlingTypeId ? (handlingTypes.find((h) => h.id === e.handlingTypeId) ? tl(handlingTypes.find((h) => h.id === e.handlingTypeId)!.label) : null) : null;
  const scs = (e.systemConditionIds || '').split(',').filter(Boolean)
    .map((id) => { const x = systemConditions.find((s) => s.id === id); return x ? tl(x.label) : null; })
    .filter((l): l is string => !!l);
  const sepHeader = (label: string) => (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] tracking-widest text-gray-400 font-medium uppercase whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
  return (
    <button
      type="button"
      onClick={() => onOpenEntry?.(e.id)}
      className="w-full h-full text-left rounded-xl border border-gray-200 bg-white p-2 hover:border-gray-400 transition-colors flex flex-col gap-1.5"
    >
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
      <div className="flex flex-col gap-1">
        {sepHeader(t('capture.touchSecCor'))}
        <div className="flex flex-wrap items-center gap-1.5">
          {cor && <span className="px-1.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px]">{cor}</span>}
          <span className="text-[10px] text-gray-400 tabular-nums">{new Date(e.effectiveAt ?? e.createdAt).toLocaleDateString()}</span>
          {e.collectorName && <span className="text-[10px] text-gray-500 font-medium truncate">{e.collectorName}</span>}
          {e.workedByName && e.workedByName !== e.collectorName && (
            <span className="text-[10px] text-emerald-700 font-medium truncate">{t('capture.workedByShort', { name: e.workedByName })}</span>
          )}
        </div>
      </div>
    </button>
  );
});

// Broker/Direct channel (migration 0061, 2026-07-10). Sits in the flow customer
// box below the account number, above the Opened date. Broker → a chevron-
// collapsible "Broker details" with Firm + Broker inputs (open by default).
// Rendered with key={caseRow.id} so the local drafts reset on case switch.
function ChannelSection({ channel, firmName, brokerName, onPatch }: {
  channel: 'broker' | 'direct' | null;
  firmName: string | null;
  brokerName: string | null;
  onPatch: (body: Record<string, unknown>) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(true);
  const [firmDraft, setFirmDraft] = useState(firmName ?? '');
  const [brokerDraft, setBrokerDraft] = useState(brokerName ?? '');
  const inputCls = 'w-full px-2 py-1 rounded-lg text-xs text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none';

  return (
    <div className="w-full flex flex-col items-center gap-1.5">
      <SegmentedToggle
        ariaLabel={t('capture.channelLabel')}
        compact
        value={channel ?? ''}
        onChange={(v) => {
          // Direct clears the broker fields so no stale firm/name lingers.
          if (v === 'broker') onPatch({ channel: 'broker' });
          else onPatch({ channel: 'direct', firmName: null, brokerName: null });
        }}
        options={[
          { value: 'broker', label: t('capture.channelBroker'), activeColor: 'green' },
          { value: 'direct', label: t('capture.channelDirect'), activeColor: 'green' },
        ]}
      />
      {channel === 'broker' && (
        <div className="w-full">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700"
          >
            <span className="text-gray-400">{open ? '▾' : '▸'}</span>
            {t('capture.brokerDetails')}
          </button>
          {open && (
            <div className="mt-1 flex flex-col gap-1.5">
              <label className="flex flex-col gap-0.5 text-[11px] text-gray-500">
                {t('capture.brokerFirm')}
                <input
                  type="text"
                  className={inputCls}
                  value={firmDraft}
                  onChange={(e) => setFirmDraft(e.target.value)}
                  onBlur={() => { const v = firmDraft.trim(); if (v !== (firmName ?? '')) onPatch({ firmName: v || null }); }}
                  placeholder={t('capture.brokerFirm')}
                />
              </label>
              <label className="flex flex-col gap-0.5 text-[11px] text-gray-500">
                {t('capture.brokerName')}
                <input
                  type="text"
                  className={inputCls}
                  value={brokerDraft}
                  onChange={(e) => setBrokerDraft(e.target.value)}
                  onBlur={() => { const v = brokerDraft.trim(); if (v !== (brokerName ?? '')) onPatch({ brokerName: v || null }); }}
                  placeholder={t('capture.brokerName')}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CasePanel({ code, studyName, demandTypes, handlingTypes, collectorName, onEditName, activeCaseId, onActiveCaseChange, refreshSignal, systemType, lifeProblems, whatMattersTypes, systemConditions, onTypesChanged, unattachedLastEntryId, onAttachedLast, decisionPointsEnabled, milestones, onOpenEntry, enabled, brokerChannelEnabled, valueCreationCapabilityEnabled, hasConsultantPin, children }: Props) {
  const { t, tl } = useLocale();

  const [refInput, setRefInput] = useState('');
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  // Consultant "Archive case" confirm (migration 0066): a small popover with a PIN
  // field (when the study has one). Archiving hides the case from the data.
  const [archiving, setArchiving] = useState(false);
  const [archivePin, setArchivePin] = useState('');
  const [archiveErr, setArchiveErr] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
  const [entries, setEntries] = useState<CaseEntry[]>([]);
  const [wmIds, setWmIds] = useState<string[]>([]);
  // Per-'by_date' what-matters target dates on this case (typeId → ISO date).
  const [wmTargetDates, setWmTargetDates] = useState<Record<string, string>>({});
  // Structured ask values per type (2026-07-02) + captured decision values.
  const [wmValues, setWmValues] = useState<Record<string, WmValue>>({});
  // Decision-box redesign (0042): milestone subquestion answers + derived
  // completion cache rows.
  const [subquestionAnswers, setSubquestionAnswers] = useState<CaseSubquestionAnswer[]>([]);
  const [caseMilestones, setCaseMilestones] = useState<CaseMilestone[]>([]);
  const [attaching, setAttaching] = useState(false);
  // Previous touches collapse to the latest by default; expand reveals history.
  const [touchesExpanded, setTouchesExpanded] = useState(false);
  // Drag-reorder of saved touches (migration 0034). `dragId` = the touch being
  // dragged; `pendingReorder` holds the proposed new order + the moved touch's
  // chosen date while the date-confirm panel is open (nothing is persisted or
  // optimistically reordered until Save, so Cancel needs no revert).
  const [dragId, setDragId] = useState<string | null>(null);
  const [pendingReorder, setPendingReorder] = useState<{ orderedIds: string[]; movedId: string; date: string } | null>(null);
  const [reorderSaving, setReorderSaving] = useState(false);
  // Flow entry (2026-06-14): one unified type-ahead reference field. The
  // composer stays hidden until a customer is open. caseList backs the
  // combobox's recent-open list and its autocomplete matches.
  const isFlow = systemType === 'flow';
  const [caseList, setCaseList] = useState<{ id: string; caseRef: string; status: 'open' | 'closed'; openedAt: string; demandTypeId: string | null; lifeProblemId: string | null; whatMattersTypeIds: string | null; entryCount: number; lastEntryAt: string | null; lastEntryVerbatim: string | null }[]>([]);

  // Flow board (2026-06-19): the work area scrolls horizontally with the captured
  // touches to the LEFT of the composer. Keep the composer in view by default —
  // align it to the left of the scroll viewport so touches sit just off-screen
  // left (scroll left to see them) and decisions/COR off-screen right.
  const workScrollRef = useRef<HTMLDivElement>(null);
  const composerColRef = useRef<HTMLDivElement>(null);

  // Top mirror scrollbar (2026-07-01): the rail's native horizontal scrollbar
  // sits at the BOTTOM, far down the page when touch cards / the composer are
  // tall. Add a synced scrollbar at the TOP of the rail that appears only when
  // the rail overflows horizontally. It's a thin element whose only content is a
  // spacer as wide as the rail's scrollWidth; scrolling either drives the other.
  const workScrollTopRef = useRef<HTMLDivElement>(null);
  const [railContentWidth, setRailContentWidth] = useState(0);
  const [railOverflow, setRailOverflow] = useState(false);
  const measureRail = useCallback(() => {
    const el = workScrollRef.current;
    if (!el) return;
    setRailContentWidth(el.scrollWidth);
    setRailOverflow(el.scrollWidth > el.clientWidth + 1);
  }, []);
  // Mirror one element's scrollLeft onto the other. No flag/timer: if the two
  // already match (within 1px) we bail, which stops the reflected scroll event
  // from ping-ponging back — so a dropped rAF frame can never deadlock the sync.
  const syncScroll = (from: HTMLDivElement | null, to: HTMLDivElement | null) => {
    if (!from || !to) return;
    if (Math.abs(to.scrollLeft - from.scrollLeft) < 1) return;
    to.scrollLeft = from.scrollLeft;
  };
  const onRailScroll = () => syncScroll(workScrollRef.current, workScrollTopRef.current);
  const onTopScroll = () => syncScroll(workScrollTopRef.current, workScrollRef.current);

  // Group B (decision box ┊ COR) gets its own synced top scrollbar, same as the
  // work rail. Re-measures when the case/touches change (COR list length etc.).
  const gbBar = useSyncedTopScrollbar([activeCaseId, caseRow?.id, entries.length]);

  // Resizable customer-context (green) box (2026-07-07). On a laptop the right
  // cluster (decision box + COR) is tight. Besides the responsive auto-compact
  // widths, let the collector drag the LEFT dashed divider to narrow/widen the
  // green box; the freed width flows to the work rail + right cluster. The width
  // is md+ only (inline style isn't responsive) and persists per study.
  // greenWidth === null → use the responsive Tailwind classes (auto-compact).
  const asideRef = useRef<HTMLElement>(null);
  const [isMdUp, setIsMdUp] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsMdUp(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const GREEN_MIN = 192, GREEN_MAX = 384;
  const [greenWidth, setGreenWidth] = useState<number | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`panelWidths:${code}`);
      if (raw) {
        const v = JSON.parse(raw);
        if (typeof v?.greenWidth === 'number' && v.greenWidth >= GREEN_MIN && v.greenWidth <= GREEN_MAX) {
          setGreenWidth(v.greenWidth);
        }
      }
    } catch {}
  }, [code]);
  const greenDrag = useRef<{ x: number; w: number } | null>(null);
  const onGreenResizeMove = useCallback((e: PointerEvent) => {
    const d = greenDrag.current;
    if (!d) return;
    const next = Math.min(GREEN_MAX, Math.max(GREEN_MIN, d.w + (e.clientX - d.x)));
    setGreenWidth(next);
  }, []);
  const onGreenResizeEnd = useCallback(() => {
    greenDrag.current = null;
    document.removeEventListener('pointermove', onGreenResizeMove);
    measureRail();
    // Read the settled width via the functional updater (avoids a stale closure).
    setGreenWidth((w) => {
      try { localStorage.setItem(`panelWidths:${code}`, JSON.stringify({ greenWidth: w })); } catch {}
      return w;
    });
  }, [onGreenResizeMove, measureRail, code]);
  const onGreenResizeStart = (e: ReactPointerEvent) => {
    if (!isMdUp) return;
    e.preventDefault();
    const startW = greenWidth ?? asideRef.current?.getBoundingClientRect().width ?? 208;
    greenDrag.current = { x: e.clientX, w: startW };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    document.addEventListener('pointermove', onGreenResizeMove);
    document.addEventListener('pointerup', onGreenResizeEnd, { once: true });
  };
  const resetGreenWidth = () => {
    setGreenWidth(null);
    try { localStorage.removeItem(`panelWidths:${code}`); } catch {}
  };

  // Always holds the latest active case id, so an in-flight loadCase can bail if
  // the collector switched customers before its response arrived (otherwise an
  // older response could overwrite the newer case's board — and patchCase would
  // then write to the wrong caseRow.id).
  const activeCaseIdRef = useRef(activeCaseId);
  useEffect(() => { activeCaseIdRef.current = activeCaseId; }, [activeCaseId]);

  const loadCase = useCallback(async (caseId: string) => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseId)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (activeCaseIdRef.current !== caseId) return; // a newer switch won
    setCaseRow(data);
    setEntries(data.entries || []);
    setWmIds(Array.isArray(data.whatMattersTypeIds) ? data.whatMattersTypeIds : []);
    setWmTargetDates(data.whatMattersTargetDates && typeof data.whatMattersTargetDates === 'object' ? data.whatMattersTargetDates : {});
    setWmValues(data.whatMattersValues && typeof data.whatMattersValues === 'object' ? data.whatMattersValues : {});
    setSubquestionAnswers(Array.isArray(data.subquestionAnswers) ? data.subquestionAnswers : []);
    setCaseMilestones(Array.isArray(data.milestones) ? data.milestones : []);
  }, [code]);

  // Refetch the timeline when the active case changes or an entry was saved.
  useEffect(() => {
    if (!activeCaseId) { setCaseRow(null); setEntries([]); return; }
    loadCase(activeCaseId);
  }, [activeCaseId, refreshSignal, loadCase]);

  // Drop the dragged touch BEFORE the target touch, then open the date-confirm
  // panel pre-filled with a sensible guess (the date of the touch it now sits
  // after; else the one it now precedes; else today). Order isn't applied until Save.
  const isoDay = (iso?: string) => localDayOf(iso) || localDay();

  // Edge auto-scroll: native HTML5 drag doesn't scroll the horizontal touch rail,
  // so dragging to an off-screen target is impossible without this. While a drag
  // is active and the pointer sits in the rail's left/right edge zone, nudge
  // scrollLeft each frame via a rAF loop (a single dragover only fires on move,
  // so a loop keeps scrolling while the pointer hovers at the edge).
  const edgeDir = useRef(0);   // -1 left, 1 right, 0 none
  const edgeRaf = useRef<number | null>(null);
  const stepEdgeScroll = useCallback(() => {
    const el = workScrollRef.current;
    if (el && edgeDir.current !== 0) {
      el.scrollLeft += edgeDir.current * 16;
      edgeRaf.current = requestAnimationFrame(stepEdgeScroll);
    } else {
      edgeRaf.current = null;
    }
  }, []);
  const stopEdgeScroll = useCallback(() => {
    edgeDir.current = 0;
    if (edgeRaf.current != null) { cancelAnimationFrame(edgeRaf.current); edgeRaf.current = null; }
  }, []);
  const onRailDragOver = (ev: ReactDragEvent) => {
    if (!dragId) return;
    ev.preventDefault();
    const el = workScrollRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const EDGE = 72;
    edgeDir.current = ev.clientX < r.left + EDGE ? -1 : ev.clientX > r.right - EDGE ? 1 : 0;
    if (edgeDir.current !== 0) {
      // Immediate nudge on this move, plus a rAF loop so it keeps scrolling
      // while the pointer hovers at the edge without moving.
      el.scrollLeft += edgeDir.current * 16;
      if (edgeRaf.current == null) edgeRaf.current = requestAnimationFrame(stepEdgeScroll);
    }
  };
  // Stop any running edge-scroll loop on unmount.
  useEffect(() => stopEdgeScroll, [stopEdgeScroll]);

  const endDrag = () => { setDragId(null); stopEdgeScroll(); };
  const handleTouchDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { endDrag(); return; }
    const moved = dragId;
    const ids = entries.map((e) => e.id).filter((id) => id !== moved);
    const at = ids.indexOf(targetId);
    if (at < 0) { endDrag(); return; }
    ids.splice(at, 0, moved);
    const idx = ids.indexOf(moved);
    const effOf = (id: string | undefined) => (id ? entries.find((e) => e.id === id)?.effectiveAt : undefined);
    const guess = isoDay(effOf(ids[idx - 1]) ?? effOf(ids[idx + 1]));
    setPendingReorder({ orderedIds: ids, movedId: moved, date: guess });
    endDrag();
  };

  const saveReorder = async () => {
    if (!pendingReorder || !activeCaseId) return;
    setReorderSaving(true);
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(activeCaseId)}/entries/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingReorder),
      });
      if (res.ok) { setPendingReorder(null); await loadCase(activeCaseId); }
    } finally {
      setReorderSaving(false);
    }
  };

  // After the case/touches load (or a new touch is added), scroll the work area
  // so the composer is fully in view at the left of the viewport — captured
  // touches then sit just off-screen to its left (scroll left to reveal them).
  useEffect(() => {
    const sc = workScrollRef.current, co = composerColRef.current;
    if (!sc || !co) return;
    const id = requestAnimationFrame(() => {
      sc.scrollLeft += co.getBoundingClientRect().left - sc.getBoundingClientRect().left;
    });
    return () => cancelAnimationFrame(id);
  }, [activeCaseId, caseRow?.id, entries.length]);

  // Keep the top mirror scrollbar's width/visibility in sync with the rail:
  // recompute after touches load/change, and whenever the rail container or its
  // content resizes (viewport change, composer growing as blocks are added).
  useEffect(() => {
    measureRail();
    const el = workScrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureRail());
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [measureRail, activeCaseId, caseRow?.id, entries.length]);

  // "Open existing account" switcher open-state (2026-07-01) — declared before
  // the loadCaseList effect below, which fetches when the switcher opens.
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Flow chooser: load the customer (case) list so the chooser can show recent
  // open customers and enforce new-vs-existing. Reuses the existing list route.
  const loadCaseList = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases`);
    if (!res.ok) return;
    const data = await res.json();
    setCaseList(Array.isArray(data) ? data : []);
  }, [code]);

  useEffect(() => {
    // Load the recent-customers list only when it's actually shown — the
    // cold-start chooser (no active case) or when the "Open existing account"
    // switcher opens (CAP-18). It was refetched on every refreshSignal (every
    // saved touch), a study-wide query whose result was invisible while a case
    // was open and the popover closed. Fetching on open keeps it fresh when seen.
    if (!enabled || systemType !== 'flow') return;
    if (activeCaseId && !switcherOpen) return;
    loadCaseList();
  }, [enabled, systemType, activeCaseId, switcherOpen, loadCaseList]);

  // "Open existing account" switcher (2026-07-01): a popover above the board to
  // jump to a recent customer or open a new ref without the full-screen chooser.
  // (State declared above so the case-list effect can depend on it.)
  useEffect(() => {
    if (!switcherOpen) return;
    const onDown = (e: PointerEvent) => { if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [switcherOpen]);

  // Recent-customer row helpers, shared by the cold-start chooser and the
  // "Open existing account" switcher popover. A one-line summary uses demand,
  // else life problem, else what-matters — whatever the study populates.
  const dtLabel = (id: string | null) => { const x = demandTypes.find((d) => d.id === id); return x ? tl(x.label) : ''; };
  const lpLabel = (id: string | null) => { const x = lifeProblems.find((l) => l.id === id); return x ? tl(x.label) : ''; };
  const wmLabel = (ids: string | null) => (ids || '').split(',').filter(Boolean)
    .map((i) => { const x = whatMattersTypes.find((w) => w.id === i); return x ? tl(x.label) : null; })
    .filter(Boolean).join(', ');
  const summary = (c: typeof caseList[number]) => dtLabel(c.demandTypeId) || lpLabel(c.lifeProblemId) || wmLabel(c.whatMattersTypeIds);
  const touchLabel = (n: number) => n === 1 ? t('capture.customerTouchOne') : t('capture.customerTouches', { n: String(n) });

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

  // Open the archive confirm, prefilling the PIN from a prior settings unlock.
  function openArchiveConfirm() {
    const cached = hasConsultantPin && typeof window !== 'undefined' ? (localStorage.getItem(`consultant_pin_${code}`) ?? '') : '';
    setArchivePin(cached);
    setArchiveErr(false);
    setArchiving(true);
  }

  // Archive the open case (consultant-gated). Hides it from the data, reversibly.
  async function archiveActiveCase() {
    if (!caseRow || archiveBusy) return;
    setArchiveBusy(true);
    setArchiveErr(false);
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseRow.id)}/archive`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true, pin: archivePin }),
      });
      if (!res.ok) { setArchiveErr(true); setArchiveBusy(false); return; }
      // Success: clear the board (like Set aside) + refresh the switcher list.
      setArchiving(false);
      setArchivePin('');
      setArchiveBusy(false);
      loadCaseList();
      onActiveCaseChange(null);
    } catch {
      setArchiveErr(true);
      setArchiveBusy(false);
    }
  }

  async function patchCase(body: Record<string, unknown>) {
    if (!caseRow) return;
    const caseId = caseRow.id;
    // Optimistic local update; refetch on failure to re-sync. The what-matters
    // set lives in its own state (junction-backed), the rest on caseRow. All
    // optimistic writes use functional updaters so two patchCase calls before a
    // re-render don't clobber each other from a stale closure.
    const { whatMattersTypeIds: nextWmIds, whatMattersDate, whatMattersValue, ...rowFields } = body as { whatMattersTypeIds?: string[]; whatMattersDate?: { whatMattersTypeId: string; date: string | null }; whatMattersValue?: { whatMattersTypeId: string } & WmValue } & Record<string, unknown>;
    if (nextWmIds !== undefined) setWmIds(nextWmIds);
    if (whatMattersValue) {
      // Optimistically mirror the full six-field ask (junction-backed) and,
      // like a date, a set value also selects the pill.
      const { whatMattersTypeId, ...value } = whatMattersValue;
      setWmValues((prev) => ({ ...prev, [whatMattersTypeId]: value }));
      setWmIds((prev) => (prev.includes(whatMattersTypeId) ? prev : [...prev, whatMattersTypeId]));
    }
    if (whatMattersDate) {
      // Optimistically reflect the set/cleared target date (junction-backed).
      setWmTargetDates((prev) => {
        const next = { ...prev };
        if (whatMattersDate.date) next[whatMattersDate.whatMattersTypeId] = whatMattersDate.date;
        else delete next[whatMattersDate.whatMattersTypeId];
        return next;
      });
      // Mirror into the structured-ask map too — the decision-side ask
      // evaluation reads targetDate from wmValues (2026-07-02, slice 3).
      setWmValues((prev) => {
        const cur = prev[whatMattersDate.whatMattersTypeId] ?? { targetDate: null, amountSpecific: null, amountMin: null, amountMax: null, termYears: null, termMonths: null };
        return { ...prev, [whatMattersDate.whatMattersTypeId]: { ...cur, targetDate: whatMattersDate.date } };
      });
      // A date can also select the type; keep the pill in sync.
      if (whatMattersDate.date) {
        setWmIds((prev) => (prev.includes(whatMattersDate.whatMattersTypeId) ? prev : [...prev, whatMattersDate.whatMattersTypeId]));
      }
    }
    if (Object.keys(rowFields).length > 0) setCaseRow((prev) => (prev ? { ...prev, ...rowFields } as CaseRow : prev));
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) await loadCase(caseId);
    } catch {
      // Network failure — re-sync from the server so the UI doesn't keep a
      // change that never persisted.
      await loadCase(caseId);
    }
  }

  // "Capture first, stitch when the number arrives" (slice B3): attach the
  // last saved un-stitched entry to this case in one tap.
  async function attachLastEntry() {
    if (!caseRow || !unattachedLastEntryId || attaching) return;
    setAttaching(true);
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${encodeURIComponent(unattachedLastEntryId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: caseRow.id }),
      });
      if (res.ok) {
        onAttachedLast?.(caseRow.id);
        await loadCase(caseRow.id);
      }
    } catch {
      // Network failure — leave the chip so the collector can retry.
    } finally {
      setAttaching(false);
    }
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
      // (summary/touchLabel hoisted to component scope — shared with the switcher.)
      // Last touch (2026-06-18): date + a clean excerpt of the latest entry's
      // work description (strip the [value]/[sequence]/[failure] block tags) so
      // users recognise the case. Null when the case has no entries yet.
      const lastTouch = (c: typeof caseList[number]) => {
        if (!c.lastEntryAt) return null;
        const text = (c.lastEntryVerbatim || '')
          .split('\n\n')
          .map((s) => s.replace(/^\[(value|sequence|failure|failure_demand)\]\s*/, '').trim())
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
          {studyName && <p className="text-center text-sm font-semibold text-gray-500 mb-3">{studyName}</p>}
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

  // Consultant "Archive case" button (migration 0066) — reused in both action bars.
  const archiveBtn = (
    <button
      type="button"
      onClick={openArchiveConfirm}
      className="text-xs px-2.5 py-1 rounded-full font-medium border border-amber-300 bg-white text-amber-700 hover:bg-amber-50 transition-colors"
    >
      {t('capture.caseArchive')}
    </button>
  );

  // Confirm popover (rendered once per return, below). Shows the case + touch count,
  // a PIN field when the study has one, then archives (hides it from the data).
  const archiveConfirm = archiving && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={() => !archiveBusy && setArchiving(false)}>
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl border border-gray-200 p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('capture.caseArchiveTitle')}</h3>
        <p className="text-xs text-gray-600 mb-3">{t('capture.caseArchiveBody', { ref: caseRow.caseRef, n: String(entries.length) })}</p>
        {hasConsultantPin && (
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={archivePin}
            onChange={(e) => { setArchivePin(e.target.value); setArchiveErr(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && archivePin.length >= 4) { e.preventDefault(); archiveActiveCase(); } }}
            placeholder={t('consultant.enterPin')}
            aria-label={t('consultant.enterPin')}
            maxLength={6}
            className="w-full px-3 py-2 mb-1 rounded-lg border border-gray-300 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-amber-400"
          />
        )}
        {archiveErr && <p className="text-xs text-red-600 mb-2">{t('consultant.wrongPin')}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={() => setArchiving(false)} disabled={archiveBusy} className="text-xs px-3 py-1.5 rounded-full font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            {t('capture.caseArchiveCancel')}
          </button>
          <button type="button" onClick={archiveActiveCase} disabled={archiveBusy || (!!hasConsultantPin && archivePin.length < 4)} className="text-xs px-3 py-1.5 rounded-full font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50">
            {archiveBusy ? '…' : t('capture.caseArchiveConfirm')}
          </button>
        </div>
      </div>
    </div>
  );

  // Shared sub-blocks — composed differently in flow vs transactional layouts.
  const headerRow = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="font-semibold text-gray-900 text-xs">#{caseRow.caseRef}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
        isOpen ? 'border-green-300 bg-green-50 text-green-700' : 'bg-gray-200 border-gray-300 text-gray-600'
      }`}>
        {isOpen ? t('capture.caseStatusOpen') : t('capture.caseStatusClosed')}
      </span>
      {/* Broker/Direct channel (0061), flow-only + opt-in. `w-full` forces the
          flex-wrap to break so it lands BELOW the account number and ABOVE the
          Opened date. key resets the field drafts when the case changes. */}
      {isFlow && brokerChannelEnabled && (
        <ChannelSection
          key={caseRow.id}
          channel={caseRow.channel}
          firmName={caseRow.firmName}
          brokerName={caseRow.brokerName}
          onPatch={patchCase}
        />
      )}
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
          value={localDayOf(caseRow.openedAt)}
          onChange={(e) => {
            if (!e.target.value) return;
            // Set the LOCAL calendar day while keeping the original local
            // time-of-day, so the field shows the same day it round-trips to.
            const [y, m, d] = e.target.value.split('-').map(Number);
            const dt = caseRow.openedAt ? new Date(caseRow.openedAt) : new Date();
            if (!caseRow.openedAt) dt.setHours(9, 0, 0, 0);
            dt.setFullYear(y, m - 1, d);
            patchCase({ openedAt: dt.toISOString() });
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
      <span className="shrink-0 text-gray-400 tabular-nums">{new Date(e.effectiveAt ?? e.createdAt).toLocaleDateString()}</span>
      {e.collectorName && <span className="shrink-0 text-gray-600 font-medium">{e.collectorName}</span>}
      {e.workedByName && e.workedByName !== e.collectorName && (
        <span className="shrink-0 text-emerald-700 font-medium">{t('capture.workedByShort', { name: e.workedByName })}</span>
      )}
      <span className="flex-1 min-w-0 truncate text-gray-700">{e.verbatim}</span>
      {handlingLabel(e.handlingTypeId) && (
        <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700">
          {handlingLabel(e.handlingTypeId)}
        </span>
      )}
    </button>
  );


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
        {/* Divider + gap (2026-07-16): keeps Archive clear of Set aside so it
            isn't pressed by accident. */}
        <span className="w-px h-4 bg-gray-200 mx-1.5" aria-hidden="true" />
        {archiveBtn}
      </div>
    </div>
  );

  // Date-confirm panel shown after a drag-reorder (migration 0034). Rendered in
  // BOTH the flow and non-flow returns; positioned fixed so it's never clipped
  // by the horizontal-scroll touch rail.
  const reorderPanel = pendingReorder && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => !reorderSaving && setPendingReorder(null)}>
      <div className="w-full max-w-xs rounded-xl bg-white border border-gray-300 shadow-lg p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold text-gray-900">{t('capture.reorderDateTitle')}</p>
        <p className="text-xs text-gray-500">{t('capture.reorderDateHint')}</p>
        <input
          type="date"
          value={pendingReorder.date}
          onChange={(e) => setPendingReorder((p) => p ? { ...p, date: e.target.value } : p)}
          className="w-full px-2 py-1.5 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setPendingReorder(null)} disabled={reorderSaving} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50">{t('capture.reorderCancel')}</button>
          <button type="button" onClick={saveReorder} disabled={reorderSaving || !pendingReorder.date} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50">{reorderSaving ? '…' : t('capture.reorderSave')}</button>
        </div>
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
      <>
      {/* Customer action bar (2026-07-01): open-existing switcher + close /
          set-aside, above the board so you can finish a customer and hop to the
          next in one click. Moved out of the green pane. Sticky under the top
          nav (2026-07-05) so the customer actions stay reachable while
          scrolling the board; the collector name lives at its left. The
          top-[113px] offset = the flow nav height (93px logo + pt-2/pb-3). */}
      {/* 3-column grid so the action pills stay CENTERED (as before) while the
          collector name floats at the left; the empty right cell balances it. */}
      <div className="sticky top-[113px] z-10 mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          {/* Collector name (2026-07-05): moved here from the capture-page
              header. Pencil re-asks "Who are you?". Left cell. */}
          <div className="flex items-center gap-1.5 min-w-0">
            {collectorName && <span className="text-xs text-gray-500 truncate">{collectorName}</span>}
            {collectorName && onEditName && (
              <button type="button" onClick={onEditName} title={t('capture.editName')} aria-label={t('capture.editName')} className="shrink-0 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
            )}
          </div>
          {/* Centre cell: the three action pills. */}
          <div className="flex flex-wrap items-center justify-center gap-2">
          <div ref={switcherRef} className="relative">
            <button
              type="button"
              onClick={() => setSwitcherOpen((o) => !o)}
              className="text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 bg-white text-gray-600 hover:border-gray-400 transition-colors"
            >
              {t('capture.openExistingAccount')} ▾
            </button>
            {switcherOpen && (
              <div className="absolute left-0 top-full mt-1 z-20 w-72 rounded-xl border border-gray-200 bg-white shadow-lg p-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && refInput.trim()) { e.preventDefault(); setSwitcherOpen(false); openCase(refInput.trim()); } }}
                    placeholder={t('capture.caseSearchPlaceholder')}
                    aria-label={t('capture.caseSearchPlaceholder')}
                    className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
                  />
                  <button
                    type="button"
                    disabled={!refInput.trim() || opening}
                    onClick={() => { setSwitcherOpen(false); openCase(refInput.trim()); }}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50 transition-colors"
                  >+</button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {(() => {
                    const list = [...caseList].filter((c) => c.id !== activeCaseId)
                      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'open' ? -1 : 1)).slice(0, 8);
                    if (list.length === 0) return <p className="px-2 py-3 text-center text-xs text-gray-400">{t('capture.caseTableEmpty')}</p>;
                    return list.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        disabled={opening}
                        onClick={() => { setSwitcherOpen(false); openCase(c.caseRef); }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="font-medium text-gray-900 tabular-nums text-sm min-w-[3.5rem] whitespace-nowrap">
                          #{c.caseRef}
                          {c.status === 'closed' && <span className="ml-1 px-1 py-0.5 rounded-full text-[9px] bg-gray-200 text-gray-500">{t('capture.caseStatusClosed')}</span>}
                        </span>
                        <span className="flex-1 min-w-0 truncate text-xs text-gray-500">{summary(c)}</span>
                        <span className="shrink-0 text-[11px] text-gray-400 tabular-nums">{touchLabel(c.entryCount)}</span>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => patchCase({ status: isOpen ? 'closed' : 'open' })}
            className="text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 bg-white text-gray-600 hover:border-gray-400 transition-colors"
          >
            {isOpen ? t('capture.customerCloseBtn') : t('capture.caseReopenBtn')}
          </button>
          <button
            type="button"
            onClick={() => onActiveCaseChange(null)}
            className="text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 bg-white text-gray-600 hover:border-gray-400 transition-colors"
          >
            {t('capture.caseSetAside')}
          </button>
          </div>
          {/* Right cell — the Archive action, pushed to the FAR RIGHT (2026-07-16)
              so it's well away from the Close/Set-aside pills and can't be hit by
              accident. The 1fr side cells still balance, so the centre pills stay
              centred exactly as before. */}
          <div className="flex justify-end">{archiveBtn}</div>
      </div>
      {/* Responsive (2026-06-17): wide screens (lg+) keep the three frozen-pane
          columns (customer left · touch rail + composer middle · decisions right).
          Below lg it stacks vertically — capture-first order: context → composer →
          touches → decisions. R2: lg:items-start; R5: dashed zone boundaries. */}
      <div className="flex flex-col gap-3 md:flex-row md:gap-0 md:items-stretch min-h-[24rem]">
        {/* PINNED LEFT — the customer. Always visible. Auto-compact on laptops
            (md:w-52 → 2xl:w-64); a saved/dragged width (md+ only) overrides via
            inline style so the collector can reclaim room for the right cluster. */}
        <aside
          ref={asideRef}
          style={isMdUp && greenWidth != null ? { width: greenWidth, flex: '0 0 auto' } : undefined}
          className="order-1 w-full md:w-52 2xl:w-64 shrink-0 rounded-xl border-2 border-green-600 bg-green-100/50 p-3">
          {studyName && <p className="text-center text-xs font-semibold text-gray-500 truncate mb-2">{studyName}</p>}
          {/* Open-new / close / set-aside moved to the customer action bar above. */}
          {headerRow}
          <CaseContextSection
            code={code}
            contextSituation={caseRow.contextSituation}
            lifeProblemIds={caseRow.lifeProblemIds ?? []}
            whatMatters={caseRow.whatMatters}
            whatMattersTypeIds={wmIds}
            whatMattersTargetDates={wmTargetDates}
            whatMattersValues={wmValues}
            lifeProblems={lifeProblems}
            whatMattersTypes={whatMattersTypes}
            demandTypeIds={caseRow.demandTypeIds ?? []}
            valueDemandTypes={valueDemandTypes}
            onPatch={patchCase}
            onTypesChanged={onTypesChanged}
          />
          {attachLastChip}
        </aside>

        {/* ┊ LEFT dashed line — full board height (matches the right one). Doubles
            as a drag handle to resize the green box (md+); double-click resets. */}
        <div
          aria-hidden
          onPointerDown={onGreenResizeStart}
          onDoubleClick={resetGreenWidth}
          className="hidden md:flex shrink-0 self-stretch items-stretch mx-1 md:order-2 group cursor-col-resize touch-none select-none"
        >
          <div className="w-4 flex justify-center items-stretch">
            <div className="border-l-4 border-dashed border-gray-500 group-hover:border-gray-700 transition-colors h-full" />
          </div>
        </div>

        {/* GROUP A — [ captured touches → composer ]. Own horizontal scroll with a
            min-width = the Work Entry box, so the composer is ALWAYS fully visible;
            scroll left within this group for the captured touches. */}
        <div className="order-2 md:order-3 flex-1 md:min-w-[34rem] 2xl:min-w-[42rem] min-w-0 flex flex-col">
        {/* Top mirror scrollbar — desktop only, shown only on horizontal overflow. */}
        <div
          ref={workScrollTopRef}
          onScroll={onTopScroll}
          aria-hidden
          className={`rail-topscroll overflow-x-auto overflow-y-hidden mb-1 ${railOverflow ? 'hidden md:block' : 'hidden'}`}
        >
          <div style={{ width: railContentWidth }} className="h-px" />
        </div>
        <div ref={workScrollRef} onScroll={onRailScroll} className="md:overflow-x-auto" onDragOver={onRailDragOver} onDrop={stopEdgeScroll}>
          <div className="flex flex-col gap-3 md:flex-row md:gap-3 md:min-w-min md:items-stretch pb-2">
            {entries.map((e) => {
              const canDrag = entries.length >= 2;
              return (
                <div
                  key={e.id}
                  className={`order-2 md:order-1 w-full md:w-36 shrink-0 flex ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${dragId === e.id ? 'opacity-50' : ''}`}
                  draggable={canDrag}
                  onDragStart={canDrag ? () => setDragId(e.id) : undefined}
                  onDragEnd={canDrag ? endDrag : undefined}
                  onDragOver={canDrag ? (ev) => ev.preventDefault() : undefined}
                  onDrop={canDrag ? (ev) => { ev.preventDefault(); handleTouchDrop(e.id); } : undefined}
                >
                  <TouchCardFull entry={e} handlingTypes={handlingTypes} systemConditions={systemConditions} onOpenEntry={onOpenEntry} />
                </div>
              );
            })}
            {children && (
              <div ref={composerColRef} className="order-1 md:order-2 w-full md:w-fit md:min-w-[32rem] 2xl:min-w-[37rem] shrink-0 rounded-xl border-2 border-brand bg-white p-3 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-brand font-medium mb-1 px-1 text-center">{t('capture.caseComposerHeading')}</p>
                {children}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* GROUP B — [ decision box ┊ capability of response ]. Own horizontal
            scroll; scroll right within it to reach capability of response.
            2026-07-01: on wide screens (≥1600px) it stops growing (flex-none) and
            takes only its content width, so it hugs the right edge instead of
            leaving whitespace to the right of capability — the surplus goes to
            GROUP A (the work rail, the sole remaining flex-1). Below 1600px it
            keeps flex-1 + internal scroll (no regression, no page h-scroll). */}
        <div className="order-3 md:order-4 flex-1 min-w-0 min-[1600px]:flex-none md:ml-3 flex flex-col">
          {/* Synced top scrollbar for the decision ┊ COR row (shown only on overflow). */}
          <TopScrollbar bar={gbBar} />
          {/* inner row is flex-1 so it fills Group B's (board-stretched) height,
              which lets the dashed line stretch to the SAME height as the left one. */}
          <div ref={gbBar.mainRef} onScroll={gbBar.onMainScroll} className="flex flex-col gap-3 md:flex-1 md:flex-row md:gap-0 md:items-stretch min-w-0 md:overflow-x-auto">
            {decisionPointsEnabled && (
              <div className="w-full md:w-56 2xl:w-64 shrink-0">
                <div className="rounded-xl bg-sky-50/70 border-2 border-sky-300 p-2">
                  <p className="text-[10px] uppercase tracking-widest text-sky-700/70 font-medium mb-1 px-1 text-center">
                    {t('capture.caseDecisionsHeading')}
                  </p>
                  <CaseMilestones
                    key={caseRow.id}
                    code={code}
                    caseId={caseRow.id}
                    milestones={milestones}
                    answers={subquestionAnswers}
                    caseMilestones={caseMilestones}
                    caseDemandTypeIds={caseRow.demandTypeIds ?? []}
                    whatMattersValues={wmValues}
                    whatMattersTypes={whatMattersTypes}
                    collectorName={collectorName}
                    compact
                    onChanged={() => loadCase(caseRow.id)}
                    onSaved={(r) => {
                      // Patch state in place instead of a full-case refetch (perf).
                      setSubquestionAnswers(r.answers);
                      setCaseMilestones(r.milestones);
                      if (r.status) setCaseRow((prev) => (prev ? { ...prev, status: r.status } as CaseRow : prev));
                    }}
                  />
                </div>
              </div>
            )}
            {/* ┊ RIGHT dashed line — same full height as the left dashed line. */}
            <div aria-hidden className="hidden md:flex shrink-0 self-stretch items-stretch mx-3">
              <div className="border-l-4 border-dashed border-gray-500 h-full" />
            </div>
            <aside className="w-full md:w-64 2xl:w-72 shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-sky-700/70 font-medium mb-1 px-1 text-center">
                {t('capture.handlingLabel')}
              </p>
              <div className="space-y-1.5">
                {entries.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">—</p>
                ) : entries.map((e, i) => {
                  const cor = handlingLabel(e.handlingTypeId);
                  const vcc = e.valueCreationCapability;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onOpenEntry?.(e.id)}
                      className="w-full flex items-center gap-1.5 text-left"
                    >
                      <span className="shrink-0 w-4 text-[10px] text-gray-400 tabular-nums text-right">{i + 1}</span>
                      {/* CoR pill — content-width (narrower) so a value-creation pill fits beside it. */}
                      {cor ? (
                        <span className="min-w-0 max-w-[8rem] px-2 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs truncate">{cor}</span>
                      ) : (
                        <span className="min-w-0 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 text-xs italic">—</span>
                      )}
                      {/* Value creation capability (0059) — captured value, colour-coded by
                          judgement (created=green, maintained=sky, missed=amber). Display only. */}
                      {valueCreationCapabilityEnabled && (vcc ? (
                        <span className={`min-w-0 max-w-[8rem] px-2 py-1 rounded-lg border text-xs truncate ${VCC_PILL_CLASS[vcc]}`}>{t(`capture.valueCreationCapability.${vcc}`)}</span>
                      ) : (
                        <span className="min-w-0 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 text-xs italic">—</span>
                      ))}
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>
      </div>
      {reorderPanel}
      {archiveConfirm}
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
    {reorderPanel}
    {archiveConfirm}
    </>
  );
}
