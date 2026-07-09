'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import { useCaptureBar } from '@/lib/capture-bar-context';
import EntryEditModal from '@/components/EntryEditModal';
import CaptureTogglesPanel from '@/components/CaptureTogglesPanel';
import CapabilityRadioGroup from '@/components/CapabilityRadioGroup';
import SegmentedToggle from '@/components/SegmentedToggle';
import PillToggle from '@/components/PillToggle';
import { WORK_TAG_PILLS } from '@/lib/work-tag-pills';
import InfoPopover from '@/components/InfoPopover';
import PillSelect from '@/components/PillSelect';
import CasePanel from '@/components/CasePanel';
import { useSyncedTopScrollbar, TopScrollbar } from '@/components/TopScrollbar';
import { localDay } from '@/lib/local-date';

// Per-block date default (slice 2): today (LOCAL day) as YYYY-MM-DD for the
// <input type="date">. Must be local, not UTC — see local-date.ts.
const todayIso = () => localDay();

// Stable client-side key for a work block so React reconciles by identity, not
// array index — the "insert step before" feature shifts indices, and index keys
// made the caret/textarea-resize stick to the wrong block. Not sent to the server.
let _blockKeySeq = 0;
const nextBlockKey = () => `wb${++_blockKeySeq}`;

interface HandlingType {
  id: string;
  label: string;
  operationalDefinition: string | null;
  // C7 (2026-06-17): is this COR felt by the customer (vs internal handoff)?
  customerFacing?: boolean;
}

interface DemandType {
  id: string;
  category: 'value' | 'failure';
  label: string;
  operationalDefinition: string | null;
}

interface ContactMethod {
  id: string;
  label: string;
}

interface PointOfTransaction {
  id: string;
  label: string;
}

interface WhatMattersType {
  id: string;
  label: string;
  operationalDefinition: string | null;
  // 2026-07-02: capture toggle — disabled types are hidden for new selection.
  enabled?: boolean;
}

interface WorkType {
  id: string;
  label: string;
  category: 'value' | 'failure' | 'sequence';
}

interface StudyData {
  id: string;
  name: string;
  primaryContactMethodId: string | null;
  primaryPointOfTransactionId: string | null;
  workTrackingEnabled: boolean;
  systemConditionsEnabled: boolean;
  demandTypesEnabled: boolean;
  workTypesEnabled: boolean;
  workStepTypesEnabled: boolean;
  // Flow toggles (migration 0014).
  flowDemandEnabled: boolean;
  flowWorkEnabled: boolean;
  // Work sources toggle (migration 0015).
  workSourcesEnabled: boolean;
  // Work-tab classification preset (migration 0016).
  workClassificationMode: 'value-sequence-failure-unknown' | 'value-failure-unknown';
  // Work-tab classification row gate (migration 0017).
  workClassificationEnabled: boolean;
  volumeMode: boolean;
  activeLayer: number;
  classificationEnabled: boolean;
  handlingEnabled: boolean;
  valueLinkingEnabled: boolean;
  // Iterative-build toggles (migration 0013).
  whatMattersEnabled: boolean;
  thinkingsEnabled: boolean;
  lifeProblemsEnabled: boolean;
  // Case stitching (Skipton slice 1, 2026-06-11).
  caseTrackingEnabled: boolean;
  // System type (2026-06-11): layout regime. 'flow' = case-first, person
  // context on the case, lean touches.
  systemType: 'transactional' | 'flow';
  flowLayout: 'stacked' | 'freeze';
  // Decision points (Skipton dotted box, 2026-06-12).
  decisionPointsEnabled: boolean;
  // Synthesis surface (migration 0028, 2026-06-24).
  synthesisEnabled: boolean;
  // Flow analytics tab (migration 0029, 2026-06-24).
  flowAnalyticsEnabled: boolean;
  // Flow per-block failure-demand type picker (migration 0033, 2026-06-26).
  flowFailureDemandTypesEnabled: boolean;
  valueStepsEnabled: boolean;
  // Flow per-entry value-creation-capability dropdown (migration 0059, 2026-07-09).
  valueCreationCapabilityEnabled: boolean;
  valueSteps: { id: string; label: string; sortOrder: number }[];
  oneStopHandlingType: string | null;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
  pointsOfTransaction: PointOfTransaction[];
  workSources: { id: string; label: string; customerFacing: boolean; sortOrder: number }[];
  whatMattersTypes: WhatMattersType[];
  lifeProblems: { id: string; label: string; operationalDefinition: string | null }[];
  workTypes: WorkType[];
  workStepTypes: { id: string; label: string; tag: 'value' | 'sequence' | 'failure'; operationalDefinition: string | null; sortOrder: number }[];
  systemConditions: { id: string; label: string; operationalDefinition: string | null }[];
  thinkings: { id: string; label: string; operationalDefinition: string | null }[];
  milestones: { id: string; label: string; sortOrder: number; demandTypeExclusions: string[]; subquestions: { id: string; milestoneId: string; label: string; kind: 'amount' | 'number' | 'percent' | 'currency' | 'calculated' | 'date' | 'duration' | 'duration_months' | 'text' | 'choice'; required: boolean; linkedWhatMattersTypeId: string | null; currencyCode: string | null; formula: string | null; resultFormat: string | null; sortOrder: number; options: { id: string; label: string; polarity: 'positive' | 'negative' | 'concern' | null; sortOrder: number }[]; conditions: { id: string; parentSubquestionId: string; triggerValue: string }[]; demandTypeExclusions: string[]; demandTypeOptional: string[] }[] }[];
}

export default function CapturePage() {
  const params = useParams();
  const code = params.code as string;
  const { t, tl } = useLocale();
  // Nav "Undo" button (2026-06-18): we publish the last saved touch here and
  // react to an undo (which deletes it) by refetching.
  const { setLastTouch, undoSignal } = useCaptureBar();

  const [study, setStudy] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [failureCauseSuggestions, setFailureCauseSuggestions] = useState<string[]>([]);
  const [collectorName, setCollectorName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  // caseId records which case the entry was attached to at save time (null =
  // un-stitched, eligible for the one-tap attach chip on the case card).
  const [lastEntry, setLastEntry] = useState<{ id: string; verbatim: string; caseId: string | null } | null>(null);

  // Entries list + filter chips
  interface EntryRow {
    id: string;
    verbatim: string;
    classification: 'value' | 'failure' | 'unknown' | 'sequence';
    entryType: 'demand' | 'work';
    demandTypeId: string | null;
    handlingTypeId: string | null;
    linkedValueDemandEntryId: string | null;
    originalValueDemandTypeId: string | null;
    createdAt: string;
    collectorName: string | null;
  }
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [pendingCounts, setPendingCounts] = useState({ needsClassification: 0, needsHandling: 0, needsValueLink: 0 });
  const [filter, setFilter] = useState<'all' | 'needsClassification' | 'needsHandling' | 'needsValueLink'>('all');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  // Stable so the memoized flow-rail touch cards (CAP-16) aren't re-rendered by
  // a new closure on every composer keystroke.
  const openEntry = useCallback((id: string) => setEditingEntryId(id), []);
  const [listLimit, setListLimit] = useState(50);
  const [showTogglesModal, setShowTogglesModal] = useState(false);
  const [entriesSheetOpen, setEntriesSheetOpen] = useState(false);
  const [entriesBoxExpanded, setEntriesBoxExpanded] = useState(false);

  // Entry type (demand vs work)
  const [entryType, setEntryType] = useState<'demand' | 'work'>('demand');

  // Case stitching (Skipton slice 1): the active case every saved entry
  // attaches to, plus a tick that tells CasePanel to refetch its timeline
  // after each save. Persisted to capture-session:<code> (2026-06-18) so it
  // survives navigation + reload; "Open new reference" / Set aside clears it.
  const [activeCase, setActiveCase] = useState<{ id: string; caseRef: string } | null>(null);
  const [caseRefreshTick, setCaseRefreshTick] = useState(0);

  // Form state
  const [verbatim, setVerbatim] = useState('');
  const [classification, setClassification] = useState<'value' | 'failure' | 'unknown' | 'sequence' | ''>('');
  const [demandTypeId, setDemandTypeId] = useState('');
  const [handlingTypeId, setHandlingTypeId] = useState('');
  // Value creation capability (0059): per-work-entry reflective judgement. '' = unanswered.
  const [valueCreationCapability, setValueCreationCapability] = useState('');
  // C7 (2026-06-17): whether the customer was affected by this touch. Inherited
  // automatically from the chosen COR's customerFacing flag (set per COR in
  // Settings, 2026-06-18) — no longer a per-touch question. null = no COR yet.
  const [customerFelt, setCustomerFelt] = useState<boolean | null>(null);
  const [contactMethodId, setContactMethodId] = useState('');
  const [pointOfTransactionId, setPointOfTransactionId] = useState('');
  const [workSourceId, setWorkSourceId] = useState('');
  const [whatMattersTypeIds, setWhatMattersTypeIds] = useState<string[]>([]);
  const [lifeProblemId, setLifeProblemId] = useState('');
  const [originalValueDemandTypeId, setOriginalValueDemandTypeId] = useState('');
  const [failureCause, setFailureCause] = useState('');
  // Each SC attachment carries a dimension (helps/hinders) plus 5 boolean flags
  // indicating which capture fields this SC is helping or hindering (Ali 2026-04-16).
  type ScAttachment = {
    id: string;
    dimension: 'helps' | 'hinders';
    attachesToLifeProblem: boolean;
    attachesToDemand: boolean;
    attachesToWhatMatters: boolean;
    attachesToCor: boolean;
    attachesToWork: boolean;
  };
  const [systemConditions, setSystemConditions] = useState<ScAttachment[]>([]);
  // Each thinking carries logic + a single helps/hinders dimension (migration 0012)
  // + zero-or-more SC attachments (migration 0011). Attachments are now just a
  // presence link — no per-attachment dimension. Stale attachments (SC removed
  // from entry) stop rendering via the `if (!sc) return null` guard and are
  // pruned on the next save by the server-side filter.
  const [thinkings, setThinkings] = useState<{
    id: string;
    logic: string;
    dimension: 'helps' | 'hinders';
    scAttachments: { systemConditionId: string }[];
  }[]>([]);
  // Inline picker for "+ Add thinking"
  const [whatMatters, setWhatMatters] = useState('');
  const [whatMattersNoteOpen, setWhatMattersNoteOpen] = useState(false);
  const [workTypeId, setWorkTypeId] = useState('');
  // Free-form text used when classification is '?' on the Work tab — no
  // managed work type to attach to. Persists to demand_entries.work_type_free_text.
  const [workTypeFreeText, setWorkTypeFreeText] = useState('');
  // Work-description blocks (Work tab only) — Phase 2 / Item 4.
  // Phase 4 (2026-04-16) — each Flow block can optionally reference a managed
  // Work Step Type via `workStepTypeId`. Null = free-text block (current UX).
  // `freeText` is a UI-only flag that distinguishes "empty new block (show
  // picker)" from "user chose free-text mode (show textarea)" when the picker
  // is on but no step is picked. Not persisted to the DB.
  // `systemConditionId` (2026-06-12): per-block system condition, set when the
  // block's tag is sequence/failure in the flow-mode work path. Null otherwise.
  // `demandTypeId` (migration 0033, 2026-06-26): per-block failure-demand type,
  // set only when the block's tag is 'failure' (flow work path). Null otherwise.
  const [workBlocks, setWorkBlocks] = useState<{ _key: string; tag: 'value' | 'sequence' | 'failure' | 'failure_demand'; text: string; workStepTypeId: string | null; freeText: boolean; systemConditionIds: string[]; demandTypeId: string | null; valueStepId: string | null }[]>([]);
  // Synced top scrollbar for the (non-flow) work-block strip. Called before any
  // early return; the computed-overflow check + ResizeObserver handle the flow
  // vs non-flow className flip, so workBlocks.length is enough as a dep.
  const wbBar = useSyncedTopScrollbar([workBlocks.length]);
  // One date for the WHOLE work entry (2026-07-02): flow work used to carry a
  // per-block "Step date"; now a single date near Save applies to every block.
  // Defaults today; set a past day to backdate a retrospectively-captured touch.
  const [workEntryDate, setWorkEntryDate] = useState(todayIso());
  // Which block's "+ add new system condition" was clicked — the shared inline
  // adder writes the created SC back into this block (addingType is global).
  const [scAddTargetBlockIdx, setScAddTargetBlockIdx] = useState<number | null>(null);
  // Which block's "+ add new failure-demand type" was clicked — the shared
  // inline demand-type adder writes the created type back into this block.
  const [demandTypeAddTargetBlockIdx, setDemandTypeAddTargetBlockIdx] = useState<number | null>(null);

  // Inline type creation state
  const [addingType, setAddingType] = useState<'demand'|'work'|'handling'|'whatMatters'|'lifeProblem'|'systemCondition'|'thinking'|'originalValue'|null>(null);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [addingTypeLoading, setAddingTypeLoading] = useState(false);

  // Quick-search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; verbatim: string; classification: string; entryType: string; demandTypeLabel: string | null; workTypeLabel: string | null }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Example verbatims state
  const [examplesTypeId, setExamplesTypeId] = useState<string | null>(null);
  const [examples, setExamples] = useState<Array<{ verbatim: string }>>([]);
  const [examplesLoading, setExamplesLoading] = useState(false);
  const examplesCache = useRef<Record<string, Array<{ verbatim: string }>>>({});
  // Latest-selected example type, so a slow response for a previously-selected
  // type can't populate the examples under a different type.
  const examplesTypeIdRef = useRef<string | null>(null);

  const loadStudy = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      setStudy(data);
      // Session-sticky defaults: localStorage overrides study primary.
      let savedSession: { contactMethodId?: string; pointOfTransactionId?: string; workSourceId?: string; activeCaseId?: string; activeCaseRef?: string } = {};
      try {
        const raw = localStorage.getItem(`capture-session:${code}`);
        if (raw) savedSession = JSON.parse(raw);
      } catch {}
      const initialCm = savedSession.contactMethodId || data.primaryContactMethodId || '';
      const initialPot = savedSession.pointOfTransactionId || data.primaryPointOfTransactionId || '';
      const initialWs = savedSession.workSourceId || '';
      if (initialCm) setContactMethodId(initialCm);
      if (initialPot) setPointOfTransactionId(initialPot);
      if (initialWs) setWorkSourceId(initialWs);
      // Restore the open case so navigating to Settings/Dashboard (or a reload)
      // returns to the same reference. If it was deleted, CasePanel.loadCase
      // 404s and falls back to the entry screen. Cleared when the user opens a
      // new reference / sets aside (setActiveCase(null) → persisted as null).
      if (savedSession.activeCaseId && savedSession.activeCaseRef) {
        setActiveCase({ id: savedSession.activeCaseId, caseRef: savedSession.activeCaseRef });
      }
    }
    setLoading(false);
  }, [code]);

  // Persist session-sticky defaults + the open case whenever they change (after
  // initial load), so navigation/reload returns to the same reference.
  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem(
        `capture-session:${code}`,
        JSON.stringify({ contactMethodId, pointOfTransactionId, workSourceId, activeCaseId: activeCase?.id, activeCaseRef: activeCase?.caseRef }),
      );
    } catch {}
  }, [code, loading, contactMethodId, pointOfTransactionId, workSourceId, activeCase]);

  // React to the nav Undo (it deleted the last touch): refetch the case
  // timeline + recent list and drop the stale lastEntry chip. Skip mount.
  const undoMounted = useRef(false);
  useEffect(() => {
    if (!undoMounted.current) { undoMounted.current = true; return; }
    /* eslint-disable react-hooks/set-state-in-effect */
    setCaseRefreshTick((n) => n + 1);
    setLastEntry(null);
    // Also refresh the entries list + pending counts so the undone (deleted)
    // entry doesn't linger in the review sheet / counts (clicking Edit on a
    // deleted entry would 404). loadTodayCount/loadPendingCounts are stable
    // useCallbacks declared below — call them here, not in deps (TDZ).
    loadTodayCount();
    loadPendingCounts();
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoSignal]);

  // When the Work-tab classification row is hidden (workClassificationEnabled
  // off), implicitly set classification to 'unknown' so downstream gates
  // (work types, COR, save-button enablement) treat the entry as classified
  // and the user can continue through the form.
  useEffect(() => {
    if (loading || !study) return;
    if (entryType === 'work' && !study.workClassificationEnabled && classification !== 'unknown') {
      // Derive-on-load: set the implicit classification once the study/tab is known.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClassification('unknown');
    }
  }, [loading, study, entryType, classification]);

  // Flow capture is work-only (2026-06-17): a touch in flow mode is always work
  // (the customer's value demand lives once on the case, in the frozen context
  // pane — there is no per-touch demand/work choice). Force the work path once a
  // flow study has loaded so the composer opens straight on the work blocks.
  useEffect(() => {
    if (loading || !study || study.systemType !== 'flow') return;
    if (entryType !== 'work') {
      // Derive-on-load: flow capture is work-only, so force the work path once a
      // flow study has loaded.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntryType('work');
      setWorkBlocks((blocks) => blocks.length ? blocks : [{ _key: nextBlockKey(), tag: 'value', text: '', workStepTypeId: null, freeText: false, systemConditionIds: [], demandTypeId: null, valueStepId: null }]);
    }
  }, [loading, study, entryType]);

  const refreshStudy = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      setStudy(data);
    }
  }, [code]);

  const loadTodayCount = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries || []);
    }
  }, [code]);

  const loadPendingCounts = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/pending-counts`);
    if (res.ok) {
      const data = await res.json();
      setPendingCounts({
        needsClassification: data.needsClassification || 0,
        needsHandling: data.needsHandling || 0,
        needsValueLink: data.needsValueLink || 0,
      });
    }
  }, [code]);

  const loadSuggestions = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/failure-causes`);
    if (res.ok) {
      const data = await res.json();
      setFailureCauseSuggestions(data);
    }
  }, [code]);

  useEffect(() => {
    // Fetch-on-mount pattern: each loader fetches and calls setState when data arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStudy();
    loadTodayCount();
    loadSuggestions();
    loadPendingCounts();
    const saved = localStorage.getItem(`collector_${code}`);
    if (saved) {
      setCollectorName(saved);
      setNameConfirmed(true);
    }
  }, [loadStudy, loadTodayCount, loadSuggestions, loadPendingCounts, code]);

  // Debounced search
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    // Reset the loading flag on the early-return too — else deleting back below
    // 2 chars left the spinner stuck on.
    if (!searchOpen || searchQuery.length < 2) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/search?q=${encodeURIComponent(searchQuery)}`);
      // Ignore a response for a superseded query (out-of-order).
      if (cancelled) return;
      if (res.ok) setSearchResults(await res.json());
      if (!cancelled) setSearchLoading(false);
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery, searchOpen, code]);

  function resetForm() {
    setVerbatim('');
    setClassification('');
    setDemandTypeId('');
    setHandlingTypeId('');
    setValueCreationCapability('');
    setCustomerFelt(null);
    // Keep contactMethodId / pointOfTransactionId sticky for the session — don't reset them.
    setWhatMattersTypeIds([]);
    setLifeProblemId('');
    setOriginalValueDemandTypeId('');
    setFailureCause('');
    setSystemConditions([]);
    setThinkings([]);
    setWhatMatters('');
    setWhatMattersNoteOpen(false);
    setWorkTypeId('');
    setWorkTypeFreeText('');
    // After a flow-work save, keep one empty block ready for the next entry
    // (entryType stays sticky); otherwise clear.
    setWorkBlocks(study?.systemType === 'flow' && entryType === 'work' ? [{ _key: nextBlockKey(), tag: 'value', text: '', workStepTypeId: null, freeText: false, systemConditionIds: [], demandTypeId: null, valueStepId: null }] : []);
    // Next entry defaults back to today (the previous entry may have backdated it).
    setWorkEntryDate(todayIso());
    setError('');
    // Keep entryType sticky for batch entry
  }

  // apiPath → study.*Types key. Lets us append a newly created type to the
  // right taxonomy in state without a full study refetch (perf P0, 2026-04-19).
  const API_PATH_TO_STUDY_KEY: Record<string, keyof StudyData> = {
    'demand-types': 'demandTypes',
    'work-types': 'workTypes',
    'what-matters-types': 'whatMattersTypes',
    'life-problems': 'lifeProblems',
    'system-conditions': 'systemConditions',
    'thinkings': 'thinkings',
    'handling-types': 'handlingTypes',
  };

  async function handleAddType(
    apiPath: string,
    extraBody: Record<string, string>,
    onCreated: (id: string) => void
  ) {
    if (!newTypeLabel.trim() || addingTypeLoading) return;
    setAddingTypeLoading(true);
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newTypeLabel.trim(), ...extraBody }),
      });
      // On failure, keep the typed label + adder open so the collector can retry,
      // and surface the error rather than silently swallowing their input.
      if (!res.ok) { setError(t('capture.saveFailed')); return; }
      const row = await res.json();
      // Optimistic append to local study state — no refresh round-trip needed
      // since the POST response is the full new row.
      const taxonomyKey = API_PATH_TO_STUDY_KEY[apiPath];
      if (taxonomyKey) {
        setStudy((prev) => {
          if (!prev) return prev;
          const current = (prev[taxonomyKey] ?? []) as unknown[];
          return { ...prev, [taxonomyKey]: [...current, row] } as StudyData;
        });
      } else {
        // Unknown apiPath — fall back to refresh so we don't render stale.
        await refreshStudy();
      }
      onCreated(row.id);
      setNewTypeLabel('');
      setAddingType(null);
    } catch {
      setError(t('capture.saveFailed'));
    } finally {
      setAddingTypeLoading(false);
    }
  }

  function renderAddTypeInput(
    type: typeof addingType,
    apiPath: string,
    extraBody: Record<string, string>,
    onCreated: (id: string) => void,
    options?: { variant?: 'red' | 'green' | 'sky' | 'thinking'; placeholder?: string },
  ) {
    if (addingType !== type) return null;
    const variant = options?.variant ?? 'red';
    const inputClass =
      variant === 'green'    ? 'flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none' :
      variant === 'sky'      ? 'flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none' :
      variant === 'thinking' ? 'flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none' :
                               'flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none';
    const addBtnClass =
      variant === 'green'    ? 'px-3 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-green-600 hover:bg-green-700' :
      variant === 'sky'      ? 'px-3 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-sky-600 hover:bg-sky-700' :
      variant === 'thinking' ? 'px-3 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-blue-700 hover:bg-blue-800' :
                               'px-3 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-brand';
    return (
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={newTypeLabel}
          onChange={(e) => setNewTypeLabel(e.target.value)}
          placeholder={options?.placeholder ?? t('capture.newTypePlaceholder')}
          className={inputClass}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddType(apiPath, extraBody, onCreated); } if (e.key === 'Escape') setAddingType(null); }}
          disabled={addingTypeLoading}
        />
        <button type="button" onClick={() => handleAddType(apiPath, extraBody, onCreated)} disabled={!newTypeLabel.trim() || addingTypeLoading} className={addBtnClass}>
          {addingTypeLoading ? '...' : t('settings.add')}
        </button>
        <button type="button" onClick={() => { setAddingType(null); setNewTypeLabel(''); }} className="px-2 py-2 text-gray-400 hover:text-gray-600 text-sm">&times;</button>
      </div>
    );
  }

  const addBtn = (type: typeof addingType) => (
    <button type="button" onClick={() => { setAddingType(type); setNewTypeLabel(''); }} className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 transition-colors" title={t('capture.addNew')}>+</button>
  );

  async function toggleExamples(typeId: string) {
    if (examplesTypeId === typeId) { setExamplesTypeId(null); examplesTypeIdRef.current = null; return; }
    setExamplesTypeId(typeId);
    examplesTypeIdRef.current = typeId;
    if (examplesCache.current[typeId]) { setExamples(examplesCache.current[typeId]); return; }
    setExamplesLoading(true);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/search?typeId=${typeId}&limit=5`);
    // Ignore a response if the user has since selected a different type.
    if (examplesTypeIdRef.current !== typeId) { setExamplesLoading(false); return; }
    if (res.ok) {
      const data = await res.json();
      const items = data.map((d: { verbatim: string }) => ({ verbatim: d.verbatim }));
      examplesCache.current[typeId] = items;
      setExamples(items);
    }
    setExamplesLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const classificationOn = !!study?.classificationEnabled;
    const handlingOn = !!study?.handlingEnabled;
    const valueLinkingOn = !!study?.valueLinkingEnabled;
    // Classification row is also hidden on the Work tab when
    // workClassificationEnabled is off — fall through to 'unknown' the same
    // way we do when classification is disabled globally.
    const workClassificationOn = !!study?.workClassificationEnabled;
    const classificationRowVisible = classificationOn && (entryType === 'demand' || workClassificationOn);
    // When the classification row isn't visible, default to 'unknown' so entries still save.
    const effectiveClassification = !classificationRowVisible ? 'unknown' : classification;
    const isVolumeMode = study?.volumeMode ?? false;
    const isWorkSubmit = entryType === 'work';
    const validWorkBlocks = workBlocks.filter((b) => b.text.trim().length > 0);
    const hasWorkBlockText = isWorkSubmit && validWorkBlocks.length > 0;
    if (!isVolumeMode && !verbatim.trim() && !hasWorkBlockText) return;
    // Flow-mode work path: the classification pills are gone — derive the entry
    // classification from the block tags (precedence failure > sequence > value)
    // so the case-timeline dot is meaningful and the submit guard is satisfied.
    const isFlowWorkSubmit = !!study && study.systemType === 'flow' && isWorkSubmit;
    let resolvedClassification = effectiveClassification;
    if (isFlowWorkSubmit) {
      const tags = validWorkBlocks.map((b) => b.tag);
      // failure_demand (a demand captured inline) counts as failure for the
      // entry-level dot/guard; there is no separate demand classification enum.
      resolvedClassification = (tags.includes('failure') || tags.includes('failure_demand')) ? 'failure'
        : tags.includes('sequence') ? 'sequence'
        : 'value';
    }
    if (!resolvedClassification) return;
    // In-flight guard: the form also submits on Enter from date/text inputs, so
    // the disabled Save button alone doesn't stop a double-post during a slow save.
    if (submitting) return;

    setSubmitting(true);
    setError('');

    const body: Record<string, unknown> = {
      verbatim: verbatim.trim() || '',
      classification: resolvedClassification,
      entryType,
      contactMethodId: contactMethodId || undefined,
      pointOfTransactionId: pointOfTransactionId || undefined,
      // Work source — only relevant for work entries (server also gates on
      // entryType='work'), but it's cheap to pass through unconditionally.
      workSourceId: isWorkSubmit ? (workSourceId || undefined) : undefined,
      collectorName: collectorName.trim() || undefined,
      // Case stitching (Skipton slice 1): attach to the active case.
      caseId: study?.caseTrackingEnabled && activeCase ? activeCase.id : undefined,
    };

    // Work tab: send workBlocks; server auto-populates verbatim from them.
    // Strip the UI-only `freeText` flag before sending; carry the per-block SC.
    if (isWorkSubmit && validWorkBlocks.length > 0) {
      body.workBlocks = validWorkBlocks.map(({ tag, text, workStepTypeId, systemConditionIds, demandTypeId, valueStepId }) => ({ tag, text, workStepTypeId, systemConditionIds, demandTypeId, valueStepId, date: workEntryDate }));
    }

    // Handling — only when the toggle is on.
    if (handlingOn) {
      body.handlingTypeId = handlingTypeId || undefined;
      // C7 (2026-06-17): the touch-level "did the customer feel it?" flag.
      // Only meaningful once a COR is chosen; null when unset.
      if (handlingTypeId) body.customerFelt = customerFelt;
    }

    // Value creation capability (0059): flow work entries only, when enabled.
    if (flowWorkPath && study?.valueCreationCapabilityEnabled) {
      body.valueCreationCapability = valueCreationCapability || undefined;
    }

    if (entryType === 'demand') {
      // Include demand type when enabled
      if (study?.demandTypesEnabled) {
        body.demandTypeId = demandTypeId || undefined;
        body.originalValueDemandTypeId = valueLinkingOn && effectiveClassification === 'failure' ? (originalValueDemandTypeId || undefined) : undefined;
        body.failureCause = effectiveClassification === 'failure' ? failureCause.trim() : undefined;
      }
      body.whatMattersTypeIds = whatMattersTypeIds.length > 0 ? whatMattersTypeIds : undefined;
      body.whatMatters = whatMatters.trim() || undefined;
      body.lifeProblemId = lifeProblemId || undefined;
    } else {
      body.workTypeId = study?.workTypesEnabled && effectiveClassification !== 'unknown' ? (workTypeId || undefined) : undefined;
      body.workTypeFreeText = study?.workTypesEnabled && effectiveClassification === 'unknown' ? (workTypeFreeText.trim() || undefined) : undefined;
    }

    // System conditions + Thinking are visible on every classified entry.
    // Per Ali feedback 2026-04-16: failure work can be hidden inside any
    // outcome — including value demands handled one-stop, and value work —
    // so SC + Thinking must be available wherever failure work might be
    // captured in the Flow. Only hide when classification is unset or '?'.
    const scVisible = study?.systemConditionsEnabled
      && !!effectiveClassification
      && effectiveClassification !== 'unknown';
    if (scVisible && systemConditions.length > 0) {
      body.systemConditions = systemConditions;
    }
    if (scVisible && thinkings.length > 0) {
      body.thinkings = thinkings;
    }

    let res: Response;
    try {
      res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      // Network failure (flaky field-test wifi): surface it and re-enable Save
      // instead of leaving the button stuck disabled with the text stranded.
      setError(t('capture.saveFailed'));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);

    if (!res.ok) {
      setError(t('capture.saveFailed'));
      return;
    }

    const saved = await res.json();
    const lastVerbatim = isWorkSubmit && validWorkBlocks.length > 0
      ? validWorkBlocks.map((b) => `[${b.tag}] ${b.text}`).join(' · ')
      : verbatim.trim();
    setLastEntry({ id: saved.id, verbatim: lastVerbatim, caseId: (body.caseId as string | undefined) ?? null });
    // Publish to the nav Undo button (removes this touch in one click).
    setLastTouch({ id: saved.id, label: lastVerbatim });
    setSuccess(true);
    resetForm();
    // Case stitching: the timeline in CasePanel refetches on this tick.
    if (activeCase) setCaseRefreshTick((n) => n + 1);

    // Perf P1 (2026-04-19): POST response now carries the fresh entries list,
    // pending counts, and failure-cause suggestions — skip three extra GETs.
    // Fall back to the old fetches if the server hasn't deployed the new shape yet.
    if (Array.isArray(saved.entries)) {
      setEntries(saved.entries);
    } else {
      loadTodayCount();
    }
    if (saved.pendingCounts) {
      setPendingCounts({
        needsClassification: saved.pendingCounts.needsClassification || 0,
        needsHandling: saved.pendingCounts.needsHandling || 0,
        needsValueLink: saved.pendingCounts.needsValueLink || 0,
      });
    } else {
      loadPendingCounts();
    }
    if (Array.isArray(saved.failureCauseSuggestions)) {
      setFailureCauseSuggestions(saved.failureCauseSuggestions);
    } else {
      loadSuggestions();
    }

    setTimeout(() => setSuccess(false), 4000);
  }

  const filteredDemandTypes = study?.demandTypes.filter(
    (dt) => dt.category === classification
  ) || [];

  // Neutral focus ring (dark grey) for class-neutral inputs — verbatim, life problem,
  // work type, notes, etc. Semantic selects (demand type) override with their own
  // green/red focus. The submit button keeps the brand red as the primary CTA.
  const inputCls = 'w-full px-4 py-3 rounded-lg text-base text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
  const req = <span className="text-red-500 ml-0.5">*</span>;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-500">{t('capture.loading')}</p>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-red-600">{t('capture.studyNotFound')}</p>
      </div>
    );
  }

  if (!nameConfirmed) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="rounded-xl shadow-sm p-6 bg-white border border-gray-200">
            <h2 className="text-lg font-semibold mb-1 text-gray-900">{study.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('capture.whoAreYou')}</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!collectorName.trim()) return;
              localStorage.setItem(`collector_${code}`, collectorName.trim());
              setNameConfirmed(true);
            }}>
              <input
                type="text"
                value={collectorName}
                onChange={(e) => setCollectorName(e.target.value)}
                placeholder={t('capture.enterName')}
                className={inputCls}
                autoFocus
              />
              <button
                type="submit"
                disabled={!collectorName.trim()}
                className="w-full mt-4 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-brand hover:bg-brand-hover"
              >
                {t('capture.continue')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isDemand = entryType === 'demand';
  // Flow-based system: the capture page reads as ONE case object — the form
  // renders inside CasePanel, tabs/separators/flow-blocks/full-SC hide, and
  // failure/sequence actions get the lean system-condition question instead.
  const flowMode = study.systemType === 'flow';
  // Wide-screen freeze-pane is the ONLY flow layout (2026-06-17): the page goes
  // full-width and the submit bar renders inline (not fixed). It is responsive —
  // the three zones stack on narrow screens. (The legacy 'stacked' flow layout
  // and the studies.flow_layout switch were retired; the DB column is left in
  // place per the additive-only rule but is no longer read.)
  const freezeLayout = flowMode;
  // Flow-mode "Work we did" path (2026-06-12): captured via the flow-block strip
  // (tag per block + per-block system condition), NOT the single classification
  // pills. The entry-level classification is derived from the blocks at submit.
  const flowWorkPath = flowMode && entryType === 'work';
  const classificationLabel = classification === 'value' ? t('capture.value').toLowerCase() : t('capture.failure').toLowerCase();
  // System conditions + Thinking are visible on every classified entry.
  // Per Ali feedback 2026-04-16: failure work can be hidden inside ANY
  // outcome — including value demands handled one-stop, and value work —
  // so SC + Thinking must be available wherever the Flow might contain
  // failure-work steps. Only hide when classification is unset or '?'.
  const scVisible = !!classification && classification !== 'unknown';

  // Capability of response (COR) block, extracted so it can be placed either
  // BEFORE the Flow work-blocks (transactional: classify the response, then the
  // steps) or AFTER them (flow composer: COR sits below, just above Save — Jonas
  // 2026-06-18). Same markup/behaviour in both positions.
  const corBlock = study.handlingEnabled ? (() => {
    const capabilityAddPill = (
      <button
        type="button"
        onClick={() => { setAddingType('handling'); setNewTypeLabel(''); }}
        className={`rounded-full font-medium border border-dashed bg-white text-sky-700 border-sky-300 hover:border-sky-500 hover:bg-sky-50 transition-colors ${freezeLayout ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'}`}
      >
        {t('capture.addHandlingButton')}
      </button>
    );
    // C7: the touch inherits "was the customer affected?" from the chosen COR's
    // customer-facing flag (set per COR in Settings). No per-touch override.
    const onPickCor = (id: string) => {
      setHandlingTypeId(id);
      const cor = study.handlingTypes.find((h) => h.id === id);
      setCustomerFelt(cor ? !!cor.customerFacing : null);
    };
    return (
      <div className={freezeLayout ? 'max-w-[37rem]' : undefined}>
        {freezeLayout ? (
          // Freeze: the COR is a single dropdown pill, not a row of radio pills.
          // Left-aligned so it sits at the start of the pinned action bar.
          <div className="flex">
            <PillSelect
              ariaLabel={t('capture.handlingLabel')}
              placeholder={t('capture.addHandlingButton')}
              value={handlingTypeId}
              onChange={onPickCor}
              options={study.handlingTypes.map((h) => ({ id: h.id, label: tl(h.label), operationalDefinition: h.operationalDefinition ? tl(h.operationalDefinition) : null }))}
              onAddNew={() => { setAddingType('handling'); setNewTypeLabel(''); }}
              addNewLabel={t('capture.addHandlingButton').replace(/^\+\s*/, '')}
              variant="add"
              compact
              compactMenu
            />
          </div>
        ) : study.handlingTypes.length > 0 ? (
          <CapabilityRadioGroup
            code={code}
            compact={freezeLayout}
            options={study.handlingTypes}
            value={handlingTypeId}
            onChange={onPickCor}
            leading={capabilityAddPill}
          />
        ) : (
          <div className="flex gap-2 items-center justify-center">
            {capabilityAddPill}
          </div>
        )}
        {renderAddTypeInput('handling', 'handling-types', {}, (id) => setHandlingTypeId(id), { variant: 'sky', placeholder: t('capture.typeInHandlingPlaceholder') })}
        {/* "Was the customer affected?" is no longer asked per touch — it's
            inherited from the chosen COR's customer-facing flag (set per COR in
            Settings, 2026-06-18). */}
      </div>
    );
  })() : null;

  // Submit + regret buttons, extracted so they render either in the flow
  // composer's pinned action bar (compact, beside the COR) or in the non-flow
  // fixed bottom footer (full-width). Same behaviour in both places.
  const submitButton = (
    <button
      type="submit"
      disabled={submitting || (!study.volumeMode && !verbatim.trim() && !(entryType === 'work' && workBlocks.some((b) => b.text.trim().length > 0))) || (study.classificationEnabled && (isDemand || study.workClassificationEnabled) && !classification && !flowWorkPath)}
      className={`text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${flowWorkPath ? 'bg-sky-600 hover:bg-sky-700 rounded-full px-4 py-2 text-sm whitespace-nowrap' : 'bg-brand rounded-lg w-full py-4 text-lg'}`}
    >
      {submitting ? t('capture.saving') : isDemand ? t('capture.save') : t('capture.saveWork')}
    </button>
  );
  // Regret (2026-06-18): abandon what's being typed (before saving). Shown only
  // when the composer has content.
  const regretButton = (verbatim.trim() || workBlocks.some((b) => b.text.trim().length > 0) || !!classification || !!demandTypeId) ? (
    <button
      type="button"
      onClick={resetForm}
      className={`rounded-lg font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors ${flowWorkPath ? 'px-3 py-1.5 text-sm whitespace-nowrap' : 'w-full mt-2 py-2 text-sm'}`}
    >
      {t('capture.regret')}
    </button>
  ) : null;

  return (
    <div className={freezeLayout ? 'max-w-none px-4 pb-6' : 'max-w-lg mx-auto p-4 pb-24'}>
      {/* Header: study name, collector (with pencil), settings icon.
          Flow + open case (2026-07-05): hidden — the collector name moves into
          the sticky customer action bar (CasePanel). Still shown pre-case
          ("who are you?" → "which customer") and always for transactional. */}
      {!(flowMode && activeCase) && (
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="min-w-0">
          {/* Flow shows the study name as a quiet centred title atop the green
              pane (see CasePanel); only transactional keeps the big header name. */}
          {!flowMode && <h1 className="text-xl font-bold text-gray-900 truncate">{study.name}</h1>}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm text-gray-500 truncate">{collectorName}</span>
            <button
              type="button"
              onClick={() => { localStorage.removeItem(`collector_${code}`); setCollectorName(''); setNameConfirmed(false); }}
              title={t('capture.editName')}
              aria-label={t('capture.editName')}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          </div>
        </div>
        {/* Toggles cog — transactional only. In flow mode the collector is a
            front-line person; study configuration belongs on the settings page
            (still reachable via the top-nav Settings link), so the cog is hidden
            here to declutter and to not bypass the settings PIN lock. */}
        {!flowMode && (
          <button
            type="button"
            onClick={() => setShowTogglesModal(true)}
            title={t('capture.toggles.title')}
            aria-label={t('capture.toggles.title')}
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-600 bg-gray-100 hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        )}
      </div>
      )}

      {/* Session-sticky strip: Point of transaction + Contact method, set once per session.
          Positioned above the Demand/Work tabs — these are context that apply to every entry.
          Rendered as PillSelects (custom dropdown with nicer visuals than a native <select>). */}
      {(study.pointsOfTransaction.length > 0 || (study.contactMethods.length > 0 && !flowMode) || (study.workSourcesEnabled && entryType === 'work')) && (
        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          {study.pointsOfTransaction.length > 0 && (
            <PillSelect
              ariaLabel={t('capture.sessionPointOfTransactionLabel')}
              placeholder={t('capture.selectPointOfTransaction')}
              value={pointOfTransactionId}
              onChange={setPointOfTransactionId}
              options={study.pointsOfTransaction.map((pot) => ({ id: pot.id, label: tl(pot.label) }))}
            />
          )}
          {/* Work source — Work tab only. Session-sticky pill mirroring
              PoT/Contact method, gated on workSourcesEnabled (migration 0015).
              Sits between PoT and Contact method so the row reads left-to-
              right: where the work came from, and how it arrived. Renders as
              soon as the toggle is on, even if the taxonomy is still empty —
              the empty dropdown signals that items need to be added in
              Settings. */}
          {study.workSourcesEnabled && entryType === 'work' && (
            <PillSelect
              ariaLabel={t('capture.sessionWorkSourceLabel')}
              placeholder={t('capture.selectWorkSource')}
              value={workSourceId}
              onChange={setWorkSourceId}
              options={(study.workSources || []).map((ws) => ({ id: ws.id, label: tl(ws.label) }))}
            />
          )}
          {/* Contact method — hidden in flow mode (not captured there). */}
          {study.contactMethods.length > 0 && !flowMode && (
            <PillSelect
              ariaLabel={t('capture.sessionContactMethodLabel')}
              placeholder={t('capture.selectContactMethod')}
              value={contactMethodId}
              onChange={setContactMethodId}
              options={study.contactMethods.map((cm) => ({ id: cm.id, label: tl(cm.label) }))}
            />
          )}
        </div>
      )}

      {/* Case stitching: CasePanel is a WRAPPER. Transactional (or case
          tracking off): it renders the case UI (if any) above its children —
          identical to the old layout. Flow: the children (the composer form)
          render INSIDE the case card, between timeline and footer, so the
          page reads as one case object. */}
      <CasePanel
        code={code}
        studyName={study.name}
        enabled={study.caseTrackingEnabled}
        demandTypes={study.demandTypes}
        handlingTypes={study.handlingTypes}
        collectorName={collectorName}
        onEditName={() => { localStorage.removeItem(`collector_${code}`); setCollectorName(''); setNameConfirmed(false); }}
        activeCaseId={activeCase?.id ?? null}
        onActiveCaseChange={setActiveCase}
        refreshSignal={caseRefreshTick}
        systemType={study.systemType}
        lifeProblems={study.lifeProblems}
        whatMattersTypes={study.whatMattersTypes}
        systemConditions={study.systemConditions}
        onTypesChanged={refreshStudy}
        unattachedLastEntryId={lastEntry && !lastEntry.caseId ? lastEntry.id : null}
        onAttachedLast={(caseId) => setLastEntry((le) => le ? { ...le, caseId } : le)}
        decisionPointsEnabled={study.decisionPointsEnabled}
        milestones={study.milestones || []}
        onOpenEntry={openEntry}
      >

      {/* Demand / Work tabs — shown when work tracking is on, OR when the user has
          enabled "Capture work types" (which cascades workTrackingEnabled on via the
          API so dashboard aggregations and downstream work features also light up).
          Hidden in flow mode — replaced by the segmented control inside the form. */}
      {!flowMode && (study.workTrackingEnabled || study.workTypesEnabled) && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 rounded-lg">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setEntryType('demand'); setClassification(''); setDemandTypeId(''); setWorkTypeId(''); setWorkTypeFreeText(''); setWorkBlocks([]); setSystemConditions([]); setThinkings([]); }}
                className={`w-full py-2.5 rounded-md font-medium text-sm transition-all ${
                  isDemand
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('capture.demand')}
              </button>
              {isDemand && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <InfoPopover label={t('capture.demandHelp')}>
                    {t('capture.demandHelp')}
                  </InfoPopover>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setEntryType('work'); setClassification(''); setDemandTypeId(''); setWorkTypeId(''); setWorkTypeFreeText(''); setWorkBlocks([]); setSystemConditions([]); setThinkings([]); }}
                className={`w-full py-2.5 rounded-md font-medium text-sm transition-all ${
                  !isDemand
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('capture.work')}
              </button>
              {!isDemand && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <InfoPopover label={t('capture.workHelp')}>
                    {t('capture.workHelp')}
                  </InfoPopover>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Last entry undo card. Hidden in the freeze layout (2026-06-17): the saved
          touches show in full in the rail, so the undo card is redundant clutter. */}
      {lastEntry && !freezeLayout && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{t('capture.lastEntry')}</p>
            <p className="text-sm text-gray-700 truncate">{lastEntry.verbatim ? <>&ldquo;{lastEntry.verbatim}&rdquo;</> : t('capture.saved')}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${lastEntry.id}`, { method: 'DELETE' });
              } catch { /* leave the card so the collector can retry */ return; }
              setLastEntry(null);
              setLastTouch(null); // keep the nav Undo button in sync
              // Refresh the timeline + lists so the deleted entry disappears
              // everywhere (the nav-Undo path does this; the card path did not).
              setCaseRefreshTick((n) => n + 1);
              loadTodayCount();
              loadPendingCounts();
            }}
            className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            {t('capture.undo')}
          </button>
        </div>
      )}

      {/* Success flash */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          {t('capture.saved')}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Flow capture is work-only (2026-06-17): no per-touch demand/work
            toggle. entryType is forced to 'work' for flow studies (effect
            above); the customer's value demand is captured once on the case in
            the frozen context pane. */}
        {/* Verbatim — demand tab always; work tab when Flow blocks are off
            (without a Flow block UI there is no other place to enter the
            verbatim, so the form would otherwise be unsubmittable). In flow
            mode each action is one step, so verbatim always renders.
            Header removed: the placeholder ("Write the customer's words…") carries the prompt. */}
        {!study.volumeMode && (isDemand || !study.flowWorkEnabled || flowMode) && !flowWorkPath && (
          <textarea
            aria-label={isDemand ? t('capture.verbatimLabel') : t('capture.workVerbatimLabel')}
            value={verbatim}
            onChange={(e) => setVerbatim(e.target.value)}
            placeholder={isDemand ? t('capture.verbatimPlaceholder') : t('capture.workVerbatimPlaceholder')}
            rows={3}
            className={inputCls}
            autoFocus
            required
          />
        )}

        {/* Value / Failure / ? toggle — when classification is on. Work adds a Sequence option.
            Header removed: the pills (Value / Sequence / Failure / ?) are self-describing. */}
        {study.classificationEnabled && (isDemand || study.workClassificationEnabled) && !flowWorkPath && (
          <div role="radiogroup" aria-label={t('capture.classification')} className="flex flex-wrap gap-2 items-center justify-center">
            <button
                type="button"
                onClick={() => { setClassification('value'); setDemandTypeId(''); setWorkTypeId(''); setWorkTypeFreeText(''); setFailureCause(''); setOriginalValueDemandTypeId(''); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  classification === 'value'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                }`}
              >
                {isDemand ? t('capture.value') : t('capture.classificationWorkValue')}
              </button>
              {!isDemand && study.workClassificationMode === 'value-sequence-failure-unknown' && (
                <button
                  type="button"
                  onClick={() => { setClassification('sequence'); setDemandTypeId(''); setWorkTypeId(''); setWorkTypeFreeText(''); setFailureCause(''); setOriginalValueDemandTypeId(''); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    classification === 'sequence'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {t('capture.classificationWorkSequence')}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setClassification('failure'); setDemandTypeId(''); setWorkTypeId(''); setWorkTypeFreeText(''); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  classification === 'failure'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}
              >
                {isDemand ? t('capture.failure') : t('capture.classificationWorkFailure')}
              </button>
              <button
                type="button"
                onClick={() => { setClassification('unknown'); setDemandTypeId(''); setWorkTypeId(''); setFailureCause(''); setOriginalValueDemandTypeId(''); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  classification === 'unknown'
                    ? 'bg-gray-600 text-white border-gray-600'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {t('capture.unknown')}
              </button>
              <InfoPopover
                label={isDemand ? t('capture.demandClassificationHelp') : t('capture.workClassificationHelp')}
                className="ml-1"
              >
                {isDemand ? t('capture.demandClassificationHelp') : t('capture.workClassificationHelp')}
              </InfoPopover>
          </div>
        )}

        {/* Flow mode: the lean system-condition question, directly under the
            classification row — the moment a failure or sequence action is
            tagged, ask what drives it, anchored to THIS action. Writes the
            same entry-level systemConditions state as the full transactional
            block (single-select, dimension 'hinders', attaches to work or
            demand per entry kind). */}
        {flowMode && !flowWorkPath && study.systemConditionsEnabled && (classification === 'failure' || classification === 'sequence') && (
          <div className={`p-3 rounded-lg border ${classification === 'failure' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className="text-sm font-medium text-gray-800 mb-2 text-center">{t('capture.flowScQuestion')}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <PillSelect
                ariaLabel={t('capture.flowScQuestion')}
                placeholder={t('capture.selectSystemCondition')}
                value={systemConditions[0]?.id ?? ''}
                onChange={(id) => {
                  if (!id) { setSystemConditions([]); return; }
                  setSystemConditions([{
                    id,
                    dimension: 'hinders',
                    attachesToLifeProblem: false,
                    attachesToDemand: isDemand,
                    attachesToWhatMatters: false,
                    attachesToCor: false,
                    attachesToWork: !isDemand,
                  }]);
                }}
                options={study.systemConditions.map((sc) => ({ id: sc.id, label: tl(sc.label), operationalDefinition: sc.operationalDefinition ? tl(sc.operationalDefinition) : null }))}
                variant="add"
                onAddNew={() => { setAddingType('systemCondition'); setNewTypeLabel(''); }}
                addNewLabel={t('capture.addNew')}
              />
              {systemConditions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSystemConditions([])}
                  aria-label={t('settings.remove')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ×
                </button>
              )}
            </div>
            {renderAddTypeInput('systemCondition', 'system-conditions', {}, (id) => {
              setSystemConditions([{
                id,
                dimension: 'hinders',
                attachesToLifeProblem: false,
                attachesToDemand: isDemand,
                attachesToWhatMatters: false,
                attachesToCor: false,
                attachesToWork: !isDemand,
              }]);
            }, { variant: 'sky' })}
          </div>
        )}

        {/* Secondary fields — appear naturally once the user picks a classification.
            Previously gated behind a "More details" toggle; the toggle was auto-opened
            on every classification click anyway, so it's been removed.
            Three subtle strand separators inside teach the Vanguard frame each capture:
            "Demand"/"Work" → "Response" → "System" (S2 / 2026-04-19). */}
        {(classification || !study.classificationEnabled || flowWorkPath) && (() => {
          // Strand visibility checks — separator only shows if at least one child renders.
          // When classification is disabled, treat "unclassified" demands as value for the
          // purpose of rendering what-matters (per Vanguard: what matters sits on value demand;
          // skipping classification means the tool assumes value).
          const isFailureDemand = isDemand && classification === 'failure';
          const isValueDemand = isDemand && classification === 'value';
          // Flow-based system (slice B): the person context (what matters,
          // life problem) lives on the CASE, so the per-entry sections hide
          // and each touch stays lean. Transactional studies are unaffected.
          // (flowMode is defined at component level.)
          const whatMattersVisible = !flowMode && isDemand && (isValueDemand || !study.classificationEnabled);
          const hasDemandStrand =
            (study.demandTypesEnabled && isDemand && classification !== 'unknown' && classification !== 'sequence') ||
            (study.workTypesEnabled && !isDemand) ||
            (study.valueLinkingEnabled && isFailureDemand) ||
            (study.whatMattersEnabled && whatMattersVisible) ||
            (study.lifeProblemsEnabled && isDemand && !flowMode) ||
            (!study.volumeMode && !isDemand); // Flow — always renders for work
          const hasResponseStrand = !!study.handlingEnabled;
          const hasSystemStrand = scVisible && !!(study.systemConditionsEnabled || study.thinkingsEnabled);
          // Tiny muted horizontal rule with a centered uppercase label.
          // Flow mode: no separators — the composer is one compact object.
          const sep = (label: string, help?: string) => flowMode ? null : (
            <div className="flex items-center gap-3 pt-2 pb-0">
              <div className="flex-1 h-px bg-gray-100" />
              <span className={`text-[10px] tracking-widest text-gray-400 font-medium inline-flex items-center gap-1 ${help ? '' : 'uppercase'}`}>
                {label}
                {help && (
                  <InfoPopover label={label}>{help}</InfoPopover>
                )}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          );
          return (
        <div className="space-y-4 pl-3 border-l-2 border-gray-100 animate-fade-in-up">
        {hasDemandStrand && sep(isDemand ? t('capture.strand.demand') : t('capture.strand.work'))}
        {/* Demand type (moved up — part of the same "what is this" decision).
            Semantic colouring: value context → green pill; failure context → red pill.
            Header dropped; the PillSelect placeholder carries the "Type of {classification}
            demand" prompt. */}
        {study.demandTypesEnabled && isDemand && classification && classification !== 'unknown' && classification !== 'sequence' && (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-2 items-center">
              <PillSelect
                ariaLabel={t('capture.demandTypeLabel', { classification: classificationLabel })}
                placeholder={t('capture.demandTypeLabel', { classification: classificationLabel })}
                value={demandTypeId}
                onChange={setDemandTypeId}
                options={filteredDemandTypes.map((dt) => ({ id: dt.id, label: tl(dt.label), operationalDefinition: dt.operationalDefinition }))}
                variant={classification === 'value' ? 'value' : 'failure'}
              />
              {addBtn('demand')}
            </div>
            {renderAddTypeInput('demand', 'demand-types', { category: classification }, (id) => setDemandTypeId(id))}
            {demandTypeId && (
              <div className="mt-1">
                <button type="button" onClick={() => toggleExamples(demandTypeId)} className="text-xs text-gray-400 hover:text-gray-600">
                  {examplesTypeId === demandTypeId ? t('capture.hideExamples') : t('capture.showExamples')}
                </button>
                {examplesTypeId === demandTypeId && (
                  examplesLoading ? <p className="mt-1 text-xs text-gray-300">...</p> :
                  examples.length === 0 ? <p className="mt-1 text-xs text-gray-300">{t('capture.noExamples')}</p> :
                  <ul className="mt-1 space-y-0.5">
                    {examples.map((ex, i) => (
                      <li key={i} className="text-xs text-gray-400 truncate">&ldquo;{ex.verbatim}&rdquo;</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Work type (work only) — moved up, sits under classification row.
            Header dropped; the PillSelect placeholder ("Select work type…")
            is self-explanatory, mirroring the demand-type treatment. */}
        {study.workTypesEnabled && !isDemand && !flowWorkPath && classification && classification !== 'unknown' && (
          <div>
            <div className="flex gap-2 items-center justify-center">
              <PillSelect
                ariaLabel={t('capture.workTypeLabel')}
                placeholder={t('capture.selectWorkType')}
                value={workTypeId}
                onChange={setWorkTypeId}
                options={study.workTypes
                  .filter((wt) => wt.category === classification)
                  .map((wt) => ({ id: wt.id, label: tl(wt.label) }))}
                variant={classification === 'value' ? 'value' : classification === 'sequence' ? 'sequence' : 'failure'}
              />
              {addBtn('work')}
            </div>
            {renderAddTypeInput('work', 'work-types', { category: classification }, (id) => setWorkTypeId(id))}
            {workTypeId && (
              <div className="mt-1">
                <button type="button" onClick={() => toggleExamples(workTypeId)} className="text-xs text-gray-400 hover:text-gray-600">
                  {examplesTypeId === workTypeId ? t('capture.hideExamples') : t('capture.showExamples')}
                </button>
                {examplesTypeId === workTypeId && (
                  examplesLoading ? <p className="mt-1 text-xs text-gray-300">...</p> :
                  examples.length === 0 ? <p className="mt-1 text-xs text-gray-300">{t('capture.noExamples')}</p> :
                  <ul className="mt-1 space-y-0.5">
                    {examples.map((ex, i) => (
                      <li key={i} className="text-xs text-gray-400 truncate">&ldquo;{ex.verbatim}&rdquo;</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Work type — '?' (unknown) classification: no managed type list to
            choose from, so the user types free-form text. Stored on the entry,
            not the type list. */}
        {study.workTypesEnabled && !isDemand && classification === 'unknown' && (
          <div>
            <input
              type="text"
              value={workTypeFreeText}
              onChange={(e) => setWorkTypeFreeText(e.target.value)}
              placeholder={t('capture.workTypeFreeTextPlaceholder')}
              aria-label={t('capture.workTypeLabel')}
              className={inputCls}
            />
          </div>
        )}

        {/* Original value demand — failure demand only. Header removed; the "Original value
            demand" placeholder carries the prompt. Value variant (green) since this always links
            to a value demand. */}
        {!flowMode && study.valueLinkingEnabled && isDemand && classification === 'failure' && (
          <div>
            <div className="flex gap-2 items-center">
              <PillSelect
                ariaLabel={t('capture.originalValueDemandLabel')}
                placeholder={t('capture.selectOriginalValueDemand')}
                value={originalValueDemandTypeId}
                onChange={setOriginalValueDemandTypeId}
                options={study.demandTypes.filter((dt) => dt.category === 'value').map((dt) => ({ id: dt.id, label: tl(dt.label), operationalDefinition: dt.operationalDefinition }))}
                variant="value"
              />
              {addBtn('originalValue')}
            </div>
            {renderAddTypeInput('originalValue', 'demand-types', { category: 'value' }, (id) => setOriginalValueDemandTypeId(id), { variant: 'green', placeholder: t('capture.typeInOriginalValueDemandPlaceholder') })}
          </div>
        )}

        {/* What matters multi-select pills (Value Demand only — per Vanguard Method, What Matters is
            captured against the original Value Demand). Header dropped; leading "+ what matters" pill
            takes its place. Vanguard semantics: value/purpose/what-matters all read green. */}
        {study.whatMattersEnabled && whatMattersVisible && (
          <div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => { setAddingType('whatMatters'); setNewTypeLabel(''); }}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-white text-green-700 border border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                {t('capture.addWhatMatters')}
              </button>
              {study.whatMattersTypes
                // Disabled types stay hidden for new selection but keep their
                // pill while selected on this entry (2026-07-02).
                .filter((wm) => wm.enabled !== false || whatMattersTypeIds.includes(wm.id))
                .map((wm) => {
                const isSelected = whatMattersTypeIds.includes(wm.id);
                return (
                  <button
                    key={wm.id}
                    type="button"
                    onClick={() => {
                      setWhatMattersTypeIds(prev =>
                        isSelected ? prev.filter(id => id !== wm.id) : [...prev, wm.id]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      isSelected
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {tl(wm.label)}
                  </button>
                );
              })}
            </div>
            {renderAddTypeInput('whatMatters', 'what-matters-types', {}, (id) => setWhatMattersTypeIds(prev => [...prev, id]), { variant: 'green', placeholder: t('capture.typeInWhatMattersPlaceholder') })}
          </div>
        )}

        {/* What matters note — collapsed by default. Auto-opens if the field already has text. (Value Demand only) */}
        {study.whatMattersEnabled && whatMattersVisible && (
          (whatMattersNoteOpen || whatMatters.trim()) ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls + ' mb-0'}>{t('capture.whatMattersLabel')}</label>
                <button
                  type="button"
                  onClick={() => { setWhatMatters(''); setWhatMattersNoteOpen(false); }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {t('capture.hideNote')}
                </button>
              </div>
              <textarea value={whatMatters} onChange={(e) => setWhatMatters(e.target.value)} placeholder={t('capture.whatMattersPlaceholder')} rows={2} className={inputCls} />
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setWhatMattersNoteOpen(true)}
                className="text-sm text-green-700 hover:underline"
              >
                {t('capture.addNote')}
              </button>
            </div>
          )
        )}

        {/* Life problem to be solved — demand only. Mirrors the SC pattern: the
            selected life problem renders as a green chip card below, and the
            "+ Life problem to be solved" pill stays as the add trigger above.
            Clearer than showing the selection as the pill text itself. */}
        {study.lifeProblemsEnabled && isDemand && !flowMode && (
          <div className="space-y-2">
            {/* Selected life problem card */}
            {lifeProblemId && (() => {
              const selected = study.lifeProblems.find((lp) => lp.id === lifeProblemId);
              if (!selected) return null;
              return (
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50">
                    <span className="px-2.5 py-1 rounded-full text-sm font-medium text-white bg-green-600">{tl(selected.label)}</span>
                    <button
                      type="button"
                      onClick={() => setLifeProblemId('')}
                      className="text-xs text-green-700 hover:text-green-900"
                      aria-label="Remove"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })()}
            {/* Add row — pill always goes straight to the inline add-new-type input.
                No dropdown in between: life problems are typically unique per entry,
                so picking an existing one is rare. One click, straight to typing. */}
            <div className="flex gap-2 items-center justify-center">
              <button
                type="button"
                onClick={() => { setAddingType('lifeProblem'); setNewTypeLabel(''); }}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-white text-green-700 border border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                {t('capture.addLifeProblem')}
              </button>
            </div>
            {renderAddTypeInput('lifeProblem', 'life-problems', {}, (id) => setLifeProblemId(id), { variant: 'green', placeholder: t('capture.typeInLifeProblemPlaceholder') })}
          </div>
        )}

        {hasResponseStrand && sep(t('capture.strand.response'))}
        {/* Capability of response (formerly "Handling") — renders for demand AND work.
            Sits BEFORE Flow on both tabs (Jonas 2026-04-22): classify the response
            pattern first, then lay out the underlying value/failure work steps.
            Header dropped; zero-state shows a single blue "+ Add capability of response"
            pill (click → inline add input). Populated state uses CapabilityRadioGroup
            so users still get the per-option hover tooltips with operational definitions. */}
        {/* Transactional: COR before the Flow steps. Flow composer renders it
            AFTER the work blocks instead (see below). */}
        {!flowWorkPath && corBlock}

        {/* Flow — sits AFTER Capability of Response on both tabs (Jonas 2026-04-22).
            A horizontal sequence of small text boxes describing value-work and
            failure-work steps. Opt-in per entry-type via flowDemandEnabled /
            flowWorkEnabled (migration 0014). Verbatim auto-populates as
            `[tag] text\n\n[tag] text` for downstream consumers. */}
        {!study.volumeMode && ((!flowMode && ((isDemand && study.flowDemandEnabled) || (!isDemand && study.flowWorkEnabled))) || flowWorkPath) && (
          <div>
            {/* sep() returns null in flow mode, so render the "Flow: Capacity =
                value work + failure work" heading explicitly for the flow-work
                path (matches EntryEditModal's separator markup). */}
            {flowWorkPath ? (
              <div className="flex items-center gap-3 pt-2 pb-0 mb-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] tracking-widest text-gray-400 font-medium inline-flex items-center gap-1">
                  {t('capture.strand.flow')}
                  <InfoPopover label={t('capture.strand.flow')}>{t('capture.workClassificationHelp')}</InfoPopover>
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            ) : sep(t('capture.strand.flow'), t('capture.workClassificationHelp'))}
            {/* Flow mode stacks blocks vertically (full-width) so each card —
                and its per-block system-condition picker/dropdown — can expand
                downward without the overflow-x-auto strip clipping it. Non-flow
                studies keep the horizontal scrolling strip. */}
            <TopScrollbar bar={wbBar} className="-mx-1 px-1" />
            <div ref={wbBar.mainRef} onScroll={wbBar.onMainScroll} className={flowWorkPath ? '' : 'overflow-x-auto -mx-1 px-1 pb-2'}>
              {/* R3 (2026-06-17): freeze flow lays work blocks left→right (the
                  outer rail provides the single horizontal scroll); stacked flow
                  keeps the vertical full-width stack. */}
              <div className={flowWorkPath ? (freezeLayout ? 'flex flex-col gap-2 lg:flex-row lg:items-start lg:min-w-min' : 'space-y-2') : 'flex gap-2 items-stretch min-w-min'}>
                {workBlocks.map((block, idx) => {
                  // Phase 4 (2026-04-16): three render modes per block
                  //   A) Picker mode — toggle ON, no step picked, rendering a step dropdown
                  //   B) Badge mode — toggle ON, step picked, showing coloured badge + clear
                  //   C) Free-text mode — toggle OFF, or user chose "Free-text step", or legacy orphan
                  const pickerOn = study.workStepTypesEnabled && (study.workStepTypes || []).length > 0;
                  const hasStep = !!block.workStepTypeId;
                  const step = hasStep ? (study.workStepTypes || []).find(s => s.id === block.workStepTypeId) : null;
                  const valueSteps = (study.workStepTypes || []).filter(s => s.tag === 'value');
                  const sequenceSteps = (study.workStepTypes || []).filter(s => s.tag === 'sequence');
                  const failureSteps = (study.workStepTypes || []).filter(s => s.tag === 'failure');
                  // Mode decision:
                  //   B = badge (picker on, step picked)
                  //   A = picker (picker on, no step, user hasn't chosen free-text)
                  //   C = free-text (picker off OR user chose free-text OR legacy orphan with text)
                  // failure_demand has no managed work-step types (those are work);
                  // always go straight to free-text so you can write what the
                  // customer says, with the type + SC boxes alongside.
                  const showFreeText = block.tag === 'failure_demand' || !pickerOn || (!hasStep && (block.freeText || block.text !== ''));
                  const showPicker = pickerOn && !hasStep && !showFreeText;

                  // Value step (migration 0047): which stage of the customer
                  // value journey this work relates to. One per step, on any
                  // tag. Gated by the study opt-in; list edited in Settings.
                  // One-line row (2026-07-04): label left, row-filling pill
                  // right (fullWidth → long step names truncate), milestone
                  // sky pill per Jonas. Sits ABOVE the tag toggle in free-text
                  // mode; badge/picker modes keep the card-bottom slot.
                  const valueStepSelector = flowWorkPath && study.valueStepsEnabled && study.valueSteps.length > 0 ? (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md border bg-green-50 border-green-200">
                      <p className="shrink-0 text-[10px] font-medium text-gray-700">{t('capture.valueStepQuestion')}</p>
                      <div className="flex-1 min-w-0">
                        <PillSelect
                          ariaLabel={t('capture.valueStepQuestion')}
                          placeholder={t('capture.selectValueStep')}
                          value={block.valueStepId ?? ''}
                          onChange={(id) => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, valueStepId: id || null } : b))}
                          options={[...study.valueSteps].sort((a, b) => a.sortOrder - b.sortOrder).map((v) => ({ id: v.id, label: tl(v.label) }))}
                          variant="milestone"
                          compact
                          compactMenu
                          fullWidth
                        />
                      </div>
                    </div>
                  ) : null;

                  return (
                    <div key={block._key} className={`p-2 rounded-lg border border-gray-200 bg-gray-50 flex flex-col gap-2 ${flowWorkPath ? (freezeLayout ? 'w-full lg:flex-none lg:w-72' : 'w-full') : `flex-none ${hasStep ? 'w-28' : 'min-w-[12rem] max-w-[18rem]'}`}`}>
                      {/* Insert a step BEFORE this one (flow only) — for backfilling a
                          missed step between existing ones. Append button stays at the end. */}
                      {flowWorkPath && (
                        <button
                          type="button"
                          onClick={() => setWorkBlocks((prev) => [...prev.slice(0, idx), { _key: nextBlockKey(), tag: 'value', text: '', workStepTypeId: null, freeText: false, systemConditionIds: [], demandTypeId: null, valueStepId: null }, ...prev.slice(idx)])}
                          className="self-center -mt-1 text-[11px] font-medium text-gray-400 hover:text-brand transition-colors"
                          aria-label={t('capture.insertWorkBlock')}
                          title={t('capture.insertWorkBlock')}
                        >
                          + {t('capture.insertWorkBlock')}
                        </button>
                      )}
                      {/* Mode B — badge (step picked). Narrower card + wrapping badge
                           so filled blocks are roughly square and more fit on one row
                           before horizontal scroll kicks in. */}
                      {hasStep && step && (
                        <div className="flex items-start justify-between gap-1">
                          <span className={`flex-1 min-w-0 px-2 py-1 rounded text-xs font-medium whitespace-normal break-words leading-snug ${step.tag === 'value' ? 'bg-green-600 text-white' : step.tag === 'sequence' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>{tl(step.label)}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label={t('capture.workStepClearAria')}
                              onClick={() => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, workStepTypeId: null, text: '' } : b))}
                              className="text-gray-400 hover:text-gray-600 text-xs"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Mode A — picker. Three tag pills (Value/SEQ/Failure) drive
                           both the tag selection and which step list is visible
                           inline below. Clicking a pill is one click to the picker
                           list — no intermediate dropdown trigger. Rendering inline
                           (not as an absolute popover) avoids the outer
                           overflow-x-auto clipping and lets the card grow to fit. */}
                      {showPicker && (() => {
                        const tagSteps = block.tag === 'value' ? valueSteps : block.tag === 'sequence' ? sequenceSteps : block.tag === 'failure' ? failureSteps : [];
                        return (
                          <>
                            <div className="flex items-start justify-between gap-1">
                              <PillToggle
                                ariaLabel={t('capture.workBlocksLabel')}
                                value={block.tag}
                                onChange={(v) => setWorkBlocks((prev) => prev.map((b, i) => i !== idx ? b
                                  : v === 'failure_demand' ? { ...b, tag: 'failure_demand', workStepTypeId: null, freeText: true }
                                  // Clear system conditions when re-tagging to 'value' — the per-block
                                  // SC box is hidden for value blocks, so kept SC ids would save invisibly.
                                  : { ...b, tag: v as 'value' | 'sequence' | 'failure', demandTypeId: null, systemConditionIds: v === 'value' ? [] : b.systemConditionIds }))}
                                dense
                                options={WORK_TAG_PILLS.map((p) => ({ value: p.value, label: t(p.labelKey), activeClassName: p.activeClassName }))}
                              />
                              <button
                                type="button"
                                aria-label="Remove"
                                onClick={() => setWorkBlocks((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1 mt-0.5"
                              >
                                &times;
                              </button>
                            </div>
                            <ul className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-lg overflow-hidden">
                              {tagSteps.length === 0 && (
                                <li className="px-2 py-1.5 text-xs text-gray-400">—</li>
                              )}
                              {tagSteps.map((s) => (
                                <li key={s.id}>
                                  <button
                                    type="button"
                                    onClick={() => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, workStepTypeId: s.id, tag: s.tag, text: tl(s.label), freeText: false, demandTypeId: null } : b))}
                                    className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <span className="block whitespace-normal leading-snug">{tl(s.label)}</span>
                                    {s.operationalDefinition && (
                                      <span className="block text-[10px] text-gray-500 font-normal whitespace-normal leading-snug">{s.operationalDefinition}</span>
                                    )}
                                  </button>
                                </li>
                              ))}
                              <li>
                                <button
                                  type="button"
                                  onClick={() => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, workStepTypeId: null, text: '', freeText: true } : b))}
                                  className="w-full text-left px-2 py-1.5 text-xs text-sky-700 hover:bg-sky-50 transition-colors"
                                >
                                  + {t('capture.workStepPickerFreeText').replace(/^[—-]\s*/, '')}
                                </button>
                              </li>
                            </ul>
                          </>
                        );
                      })()}

                      {/* Mode C — free text (picker off, explicit free-text choice, or legacy orphan) */}
                      {showFreeText && !hasStep && (
                        <>
                          {/* Value step FIRST (2026-07-04) — the journey-stage
                              question is answered before classifying the step. */}
                          {valueStepSelector}
                          <div className="flex items-start justify-between gap-1">
                            <PillToggle
                              ariaLabel={t('capture.workBlocksLabel')}
                              value={block.tag}
                              onChange={(v) => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, tag: v as 'value' | 'sequence' | 'failure' | 'failure_demand', systemConditionIds: v === 'value' ? [] : b.systemConditionIds, demandTypeId: v === 'failure_demand' ? b.demandTypeId : null } : b))}
                              dense
                              options={WORK_TAG_PILLS.map((p) => ({ value: p.value, label: t(p.labelKey), activeClassName: p.activeClassName }))}
                            />
                            <button
                              type="button"
                              aria-label="Remove"
                              onClick={() => setWorkBlocks((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1 mt-0.5"
                            >
                              &times;
                            </button>
                          </div>
                          <textarea
                            value={block.text}
                            onChange={(e) => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, text: e.target.value } : b))}
                            placeholder={block.tag === 'failure_demand' ? t('capture.failureDemandPlaceholder') : t('capture.workBlockPlaceholder')}
                            rows={4}
                            /* R1 (2026-06-17): grow with typing (field-sizing where
                               supported) + a taller min-height + manual resize so
                               more of the captured text is visible. */
                            className="w-full px-2 py-1 rounded text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none resize-y field-sizing-content min-h-[6rem] flex-1"
                          />
                        </>
                      )}

                      {/* Per-block system condition, BELOW the description so it never
                          shifts the toggle. Add via a dropdown; chosen SCs show as
                          removable chips; the "+ add" pill stays to add more (0032). */}
                      {flowWorkPath && study.systemConditionsEnabled && (block.tag === 'sequence' || block.tag === 'failure' || block.tag === 'failure_demand') && (
                        <div className={`p-1.5 rounded-md border ${(block.tag === 'failure' || block.tag === 'failure_demand') ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                          <p className="text-[10px] font-medium text-gray-700 mb-1">{t('capture.flowScQuestion')}</p>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {block.systemConditionIds.map((scId) => {
                              const sc = study.systemConditions.find((s) => s.id === scId);
                              if (!sc) return null;
                              return (
                                <span key={scId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-200 text-sky-900 border border-sky-500">
                                  {tl(sc.label)}
                                  <button
                                    type="button"
                                    aria-label={t('capture.removeSystemCondition')}
                                    onClick={() => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, systemConditionIds: b.systemConditionIds.filter((x) => x !== scId) } : b))}
                                    className="text-sky-700 hover:text-sky-900 leading-none"
                                  >
                                    &times;
                                  </button>
                                </span>
                              );
                            })}
                            <PillSelect
                              variant="add"
                              value=""
                              ariaLabel={t('capture.flowScQuestion')}
                              placeholder={t('capture.addSystemConditionButton')}
                              options={study.systemConditions.filter((sc) => !block.systemConditionIds.includes(sc.id)).map((sc) => ({ id: sc.id, label: tl(sc.label) }))}
                              onChange={(id) => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, systemConditionIds: b.systemConditionIds.includes(id) ? b.systemConditionIds : [...b.systemConditionIds, id] } : b))}
                              onAddNew={() => { setScAddTargetBlockIdx(idx); setAddingType('systemCondition'); setNewTypeLabel(''); }}
                              addNewLabel={t('capture.addNew')}
                              compact
                              compactMenu
                            />
                          </div>
                        </div>
                      )}
                      {/* Type of failure demand (migration 0033): a flow step tagged
                          'failure demand' IS a demand hitting you — capture WHAT KIND
                          (mirrors the transactional demand-type picker, category='failure').
                          Below the description too. Gated by the study opt-in. */}
                      {flowWorkPath && study.flowFailureDemandTypesEnabled && block.tag === 'failure_demand' && (
                        <div className="p-1.5 rounded-md border bg-red-50 border-red-200">
                          <p className="text-[10px] font-medium text-gray-700 mb-1">{t('capture.demandTypeLabel', { classification: t('capture.failure').toLowerCase() })}</p>
                          <div className="flex gap-1.5 items-center">
                            <PillSelect
                              ariaLabel={t('capture.demandTypeLabel', { classification: t('capture.failure').toLowerCase() })}
                              placeholder={t('capture.selectType')}
                              value={block.demandTypeId ?? ''}
                              onChange={(id) => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, demandTypeId: id || null } : b))}
                              options={study.demandTypes.filter((dt) => dt.category === 'failure').map((dt) => ({ id: dt.id, label: tl(dt.label), operationalDefinition: dt.operationalDefinition }))}
                              variant="failureSoft"
                              compact
                              compactMenu
                            />
                            <button
                              type="button"
                              onClick={() => { setDemandTypeAddTargetBlockIdx(idx); setAddingType('demand'); setNewTypeLabel(''); }}
                              className="px-2 py-0.5 rounded-full text-[11px] font-medium border border-dashed border-red-300 text-red-700 hover:bg-red-50"
                            >
                              + {t('capture.addNew')}
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Value step in badge/picker modes (no textarea) — keeps
                          its old bottom slot; free-text mode renders it above
                          the textarea instead. */}
                      {!(showFreeText && !hasStep) && valueStepSelector}

                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setWorkBlocks((prev) => [...prev, { _key: nextBlockKey(), tag: 'value', text: '', workStepTypeId: null, freeText: false, systemConditionIds: [], demandTypeId: null, valueStepId: null }])}
                  aria-label={t('capture.addWorkBlockButton')}
                  className={`rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-brand hover:text-brand flex items-center justify-center gap-1 text-sm font-medium ${flowWorkPath ? (freezeLayout ? 'w-full py-2 lg:flex-none lg:w-72 lg:py-0 lg:min-h-[6rem] lg:self-stretch' : 'w-full py-2') : 'flex-none w-16 text-2xl'}`}
                >
                  {flowWorkPath ? t('capture.addWorkBlockButton') : '+'}
                </button>
              </div>
            </div>
            {/* Shared inline "create system condition" input for the flow-work
                blocks. addingType is global, so one input serves all blocks; the
                new SC lands in the block recorded in scAddTargetBlockIdx. Gated
                on flowWorkPath so it never duplicates the transactional SC adder. */}
            {flowWorkPath && renderAddTypeInput('systemCondition', 'system-conditions', {}, (id) => {
              setWorkBlocks((prev) => prev.map((b, i) => i === scAddTargetBlockIdx ? { ...b, systemConditionIds: b.systemConditionIds.includes(id) ? b.systemConditionIds : [...b.systemConditionIds, id] } : b));
              setScAddTargetBlockIdx(null);
            }, { variant: 'sky' })}
            {/* Shared inline "create failure-demand type" input for flow-work
                failure blocks (migration 0033). category='failure' so the new
                type is tagged correctly; it lands in the block recorded in
                demandTypeAddTargetBlockIdx. Gated on flowWorkPath so it never
                duplicates the transactional demand-type adder. */}
            {flowWorkPath && renderAddTypeInput('demand', 'demand-types', { category: 'failure' }, (id) => {
              setWorkBlocks((prev) => prev.map((b, i) => i === demandTypeAddTargetBlockIdx ? { ...b, demandTypeId: id } : b));
              setDemandTypeAddTargetBlockIdx(null);
            }, { variant: 'red' })}

            {/* Flow composer: COR + Save sit BELOW the work blocks as a compact
                bar, CENTRED under the composer box (2026-07-05, Jonas). Rendered
                INSIDE the flow section (not the space-y-4 parent) so `mt-2` gives
                a clean 8px gap = the `gap-2` between the block and the "+ Add a
                step" box. Outer `lg:w-72` matches the first block-card column
                (left-aligned under it); `justify-center` centres the compact bar
                under it. (Previously floated sticky-right; dropped for the
                centred look.) */}
            {flowWorkPath && (
              <div className="mt-2 lg:w-72 flex justify-center">
                <div className="w-fit max-w-full flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-sm">
                  {/* One date for the whole work entry — defaults today; change
                      it to backdate a retrospectively-captured touch before saving. */}
                  <label className="flex items-center justify-center gap-1.5">
                    <span className="text-[11px] font-medium text-gray-500">{t('capture.workEntryDate')}</span>
                    <input
                      type="date"
                      value={workEntryDate}
                      onChange={(e) => setWorkEntryDate(e.target.value)}
                      className="text-xs px-2 py-1 rounded border border-gray-300 bg-white focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                    />
                  </label>
                  <div className="flex items-center gap-3">
                    {corBlock}
                    {submitButton}
                  </div>
                  {/* Value creation capability (0059): optional per-entry judgement,
                      shown below COR/Save only when the study opts in. */}
                  {study.valueCreationCapabilityEnabled && (
                    <div className="flex flex-col gap-1 border-t border-gray-100 pt-1.5">
                      <span className="text-[11px] font-medium text-gray-500 text-center max-w-[16rem]">
                        {t('capture.valueCreationCapabilityLabel')}
                      </span>
                      <div className="flex justify-center">
                        <PillSelect
                          ariaLabel={t('capture.valueCreationCapabilityLabel')}
                          placeholder={t('capture.valueCreationCapabilityPlaceholder')}
                          value={valueCreationCapability}
                          onChange={setValueCreationCapability}
                          options={[
                            { id: 'created', label: t('capture.valueCreationCapability.created'), operationalDefinition: t('capture.valueCreationCapability.createdDef') },
                            { id: 'maintained', label: t('capture.valueCreationCapability.maintained'), operationalDefinition: t('capture.valueCreationCapability.maintainedDef') },
                            { id: 'missed', label: t('capture.valueCreationCapability.missed'), operationalDefinition: t('capture.valueCreationCapability.missedDef') },
                          ]}
                          variant="value"
                          compact
                          compactMenu
                        />
                      </div>
                    </div>
                  )}
                  {regretButton}
                </div>
              </div>
            )}
          </div>
        )}

        {hasSystemStrand && sep(t('capture.strand.system'))}
        {/* System conditions / failure cause — failure (all), work+sequence, or value demand with non-one-stop capability.
            Phase 2 / Item 3: each selected SC carries a Helps/Hinders dimension.
            Header dropped — the "+ Add system condition" pill is self-explanatory; an ⓘ
            next to it carries the definition. */}
        {!flowMode && study.classificationEnabled && scVisible && study.systemConditionsEnabled && (
          <div>
              <div className="space-y-2">
                {systemConditions.map((entry, idx) => {
                  const sc = (study.systemConditions || []).find(s => s.id === entry.id);
                  if (!sc) return null;
                  // Colour flips with dimension: green when the SC helps customer purpose,
                  // red when it hinders. Matches Vanguard's green=value / red=failure discipline.
                  const isHelps = entry.dimension === 'helps';
                  return (
                    <div key={entry.id} className={`p-3 rounded-lg border space-y-2 ${isHelps ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-sm font-medium text-white ${isHelps ? 'bg-green-600' : 'bg-red-600'}`}>{tl(sc.label)}</span>
                        <button
                          type="button"
                          onClick={() => setSystemConditions(prev => prev.filter((_, i) => i !== idx))}
                          className={`text-xs ${isHelps ? 'text-green-700 hover:text-green-900' : 'text-red-700 hover:text-red-900'}`}
                          aria-label="Remove"
                        >
                          &times;
                        </button>
                      </div>
                      <SegmentedToggle
                        options={[
                          { value: 'hinders', label: t('capture.scHinders'), activeColor: 'red' },
                          { value: 'helps', label: t('capture.scHelps'), activeColor: 'green' },
                        ]}
                        value={entry.dimension}
                        onChange={(v) => {
                          const dim = v === 'helps' ? 'helps' : 'hinders';
                          setSystemConditions(prev => prev.map((p, i) => i === idx ? { ...p, dimension: dim } : p));
                        }}
                        ariaLabel={t('capture.systemConditionsLabel')}
                      />
                      {/* Attachment chips — which of the five capture fields this SC
                          helps or hinders. At least one should be on. (Ali 2026-04-16) */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('capture.scAttachHint')}</p>
                        <div className="flex flex-wrap gap-1">
                          {([
                            ['attachesToLifeProblem', 'capture.scAttachLifeProblem'],
                            ['attachesToDemand',      'capture.scAttachDemand'],
                            ['attachesToWhatMatters', 'capture.scAttachWhatMatters'],
                            ['attachesToCor',         'capture.scAttachCor'],
                            ['attachesToWork',        'capture.scAttachWork'],
                          ] as const).map(([field, key]) => {
                            const on = entry[field];
                            return (
                              <button
                                key={field}
                                type="button"
                                onClick={() => setSystemConditions(prev => prev.map((p, i) => i === idx ? { ...p, [field]: !p[field] } : p))}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                                  on
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand hover:text-brand'
                                }`}
                                aria-pressed={on}
                              >
                                {t(key)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* One-click add: PillSelect in add variant. Click the pill → popover
                    with available SCs drops in immediately. Picking one appends it to
                    the list with dynamic default dimension + attachment (Ali 2026-04-16). */}
                {(() => {
                  const available = (study.systemConditions || []).filter(sc => !systemConditions.some(p => p.id === sc.id));
                  return (
                    <div className="flex gap-2 items-center justify-center">
                      {available.length > 0 ? (
                        // Populated: PillSelect dropdown shows existing SCs plus a
                        // "+ Add new system condition" action at the bottom (no separate
                        // grey + button needed).
                        <PillSelect
                          variant="add"
                          placeholder={t('capture.addSystemConditionButton')}
                          value=""
                          onChange={(id) => {
                            const defaultDim: 'helps' | 'hinders' = classification === 'value' ? 'helps' : 'hinders';
                            const isWork = entryType === 'work';
                            setSystemConditions(prev => [...prev, {
                              id,
                              dimension: defaultDim,
                              attachesToLifeProblem: false,
                              attachesToDemand: !isWork,
                              attachesToWhatMatters: false,
                              attachesToCor: false,
                              attachesToWork: isWork,
                            }]);
                          }}
                          options={available.map(sc => ({ id: sc.id, label: tl(sc.label), operationalDefinition: sc.operationalDefinition }))}
                          onAddNew={() => { setAddingType('systemCondition'); setNewTypeLabel(''); }}
                          addNewLabel={t('capture.addNew')}
                        />
                      ) : (
                        // Zero-state: blue pill goes straight to the inline add-new-type
                        // input since there's nothing to pick.
                        <button
                          type="button"
                          onClick={() => { setAddingType('systemCondition'); setNewTypeLabel(''); }}
                          className="px-3 py-1.5 rounded-full text-sm font-medium border bg-white text-sky-700 border-sky-300 hover:border-sky-500 hover:bg-sky-50 transition-colors"
                        >
                          {t('capture.addSystemConditionButton')}
                        </button>
                      )}
                      <InfoPopover label={t('capture.systemConditionsLabel')}>
                        {t('capture.systemConditionsLabel')}
                      </InfoPopover>
                    </div>
                  );
                })()}
              </div>
              {renderAddTypeInput('systemCondition', 'system-conditions', {}, (id) => {
                const defaultDim: 'helps' | 'hinders' = classification === 'value' ? 'helps' : 'hinders';
                const isWork = entryType === 'work';
                setSystemConditions(prev => prev.some(p => p.id === id) ? prev : [...prev, {
                  id,
                  dimension: defaultDim,
                  attachesToLifeProblem: false,
                  attachesToDemand: !isWork,
                  attachesToWhatMatters: false,
                  attachesToCor: false,
                  attachesToWork: isWork,
                }]);
              }, { variant: 'sky', placeholder: t('capture.typeInSystemConditionPlaceholder') })}
            </div>
        )}

        {study.classificationEnabled && study.thinkingsEnabled && scVisible && sep(t('capture.strand.thinking'))}
        {/* Thinking + per-pair logic — mirrors system conditions visibility.
             Phase 2 / Item 2: each selected Thinking gets a free-text "logic" textarea
             so we capture *why* this thinking shows up in this specific demand.
             Header dropped earlier — the "+ Add thinking" pill + ⓘ carry the definition.
             A small "Thinking" sub-separator sits just above (2026-04-19): within
             the System strand, Thinking is its own distinct concept and deserves the
             same visual anchoring as SC gets from the SYSTEM separator above. */}
        {study.classificationEnabled && study.thinkingsEnabled && scVisible && (
          <div>
            <div className="space-y-2">
              {thinkings.map((entry, idx) => {
                const th = (study.thinkings || []).find(t => t.id === entry.id);
                if (!th) return null;
                // Card colour flips with the thinking's helps/hinders dimension.
                const isHelps = entry.dimension === 'helps';
                return (
                  <div key={entry.id} className={`p-3 rounded-lg border space-y-2 ${isHelps ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-sm font-medium text-white ${isHelps ? 'bg-green-600' : 'bg-red-600'}`}>{tl(th.label)}</span>
                      <button
                        type="button"
                        onClick={() => setThinkings(prev => prev.filter((_, i) => i !== idx))}
                        className={`text-xs ${isHelps ? 'text-green-700 hover:text-green-900' : 'text-red-700 hover:text-red-900'}`}
                        aria-label="Remove"
                      >
                        &times;
                      </button>
                    </div>
                    <textarea
                      value={entry.logic}
                      onChange={(e) => {
                        const next = e.target.value;
                        setThinkings(prev => prev.map((p, i) => i === idx ? { ...p, logic: next } : p));
                      }}
                      placeholder={t('capture.thinkingLogicPlaceholder')}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white border outline-none ${
                        isHelps
                          ? 'border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                          : 'border-red-200 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                      }`}
                    />
                    {/* Helps/Hinders toggle for the whole thinking (migration 0012). */}
                    <SegmentedToggle
                      options={[
                        { value: 'hinders', label: t('capture.scHinders'), activeColor: 'red' },
                        { value: 'helps',   label: t('capture.scHelps'),   activeColor: 'green' },
                      ]}
                      value={entry.dimension}
                      onChange={(v) => {
                        const dim: 'helps' | 'hinders' = v === 'helps' ? 'helps' : 'hinders';
                        setThinkings(prev => prev.map((p, i) => i === idx ? { ...p, dimension: dim } : p));
                      }}
                      ariaLabel={t('capture.thinkingLabel')}
                    />
                    {/* SC attachment chips — migration 0011/0012. One chip per SC on this entry.
                        Simple on/off toggle (no per-chip dimension — it lives on the thinking). */}
                    {systemConditions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">{t('capture.thinkingScAttachLabel')}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {systemConditions.map((scEntry) => {
                            const sc = (study.systemConditions || []).find(s => s.id === scEntry.id);
                            if (!sc) return null;
                            const attached = entry.scAttachments.some(a => a.systemConditionId === scEntry.id);
                            return (
                              <button
                                key={scEntry.id}
                                type="button"
                                onClick={() => {
                                  setThinkings(prev => prev.map((p, i) => {
                                    if (i !== idx) return p;
                                    if (p.scAttachments.some(a => a.systemConditionId === scEntry.id)) {
                                      return { ...p, scAttachments: p.scAttachments.filter(a => a.systemConditionId !== scEntry.id) };
                                    }
                                    return { ...p, scAttachments: [...p.scAttachments, { systemConditionId: scEntry.id }] };
                                  }));
                                }}
                                aria-pressed={attached}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                                  attached
                                    ? (isHelps ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600')
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {tl(sc.label)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* One-click add: PillSelect in add variant. Click pill → popover with
                  available thinkings drops in immediately. Picking appends to the list. */}
              {(() => {
                const available = (study.thinkings || []).filter(th => !thinkings.some(p => p.id === th.id));
                return (
                  <div className="flex gap-2 items-center justify-center">
                    {available.length > 0 ? (
                      // Populated: PillSelect dropdown with a "+ Add new" action at
                      // the bottom (no separate grey + button). Indigo variant so
                      // Thinking is visually distinct from the sky-blue SC add pill.
                      <PillSelect
                        variant="thinking"
                        placeholder={t('capture.addThinkingButton')}
                        value=""
                        onChange={(id) => {
                          setThinkings(prev => [...prev, { id, logic: '', scAttachments: [], dimension: 'hinders' }]);
                        }}
                        options={available.map(th => ({ id: th.id, label: tl(th.label), operationalDefinition: th.operationalDefinition }))}
                        onAddNew={() => { setAddingType('thinking'); setNewTypeLabel(''); }}
                        addNewLabel={t('capture.addNew')}
                      />
                    ) : (
                      // Zero-state: deep-blue pill goes straight to inline add-new-type input.
                      <button
                        type="button"
                        onClick={() => { setAddingType('thinking'); setNewTypeLabel(''); }}
                        className="px-3 py-1.5 rounded-full text-sm font-medium border bg-white text-blue-700 border-blue-400 hover:border-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        {t('capture.addThinkingButton')}
                      </button>
                    )}
                    <InfoPopover label={t('capture.thinkingLabel')}>
                      {t('capture.thinkingLabel')}
                    </InfoPopover>
                  </div>
                );
              })()}
            </div>
            {renderAddTypeInput('thinking', 'thinkings', {}, (id) => { setThinkings(prev => [...prev, { id, logic: '', scAttachments: [], dimension: 'hinders' }]); }, { variant: 'thinking', placeholder: t('capture.typeInThinkingPlaceholder') })}
          </div>
        )}

        </div>
          );
        })()}

        {/* Non-flow submit footer: sticky bar fixed at the bottom of the screen.
            Flow renders its Save inside the pinned COR + Save action bar above. */}
        {!flowWorkPath && (
          <div className="fixed bottom-0 left-0 right-0 p-4 border-t shadow-lg bg-white border-gray-200">
            <div className="max-w-lg mx-auto">
              {submitButton}
              {regretButton}
            </div>
          </div>
        )}
      </form>
      </CasePanel>

      {/* Entries tab-box — tab-strip visual, tighter than Demand/Work since reclass is an optional
          review action (not a per-entry step). The chevron sits inside its own small pill so the
          click target reads as "open review" rather than "click the whole card".
          Hidden in the freeze layout (2026-06-17): the rail boxes already show previous work, so
          this legacy review list is redundant clutter there. */}
      {!freezeLayout && (
      <div className="mt-8 mb-24">
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-gray-200 rounded-lg">
          <div className="py-1 px-3 rounded-md bg-white text-gray-500 shadow-sm inline-flex items-center justify-center gap-2 text-xs">
            <span>{t('capture.entriesSheetTrigger')} · {entries.length}</span>
            <button
              type="button"
              onClick={() => setEntriesBoxExpanded((o) => !o)}
              aria-expanded={entriesBoxExpanded}
              aria-label={t('capture.entriesSheetTrigger')}
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ transform: entriesBoxExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
          </div>
        </div>
        {entriesBoxExpanded && (
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {([
              { key: 'all', label: t('capture.filterAll'), count: entries.length, show: true },
              { key: 'needsClassification', label: t('capture.filterNeedsClassification'), count: pendingCounts.needsClassification, show: study.classificationEnabled && pendingCounts.needsClassification > 0 },
              { key: 'needsHandling', label: t('capture.filterNeedsHandling'), count: pendingCounts.needsHandling, show: study.handlingEnabled && pendingCounts.needsHandling > 0 },
              { key: 'needsValueLink', label: t('capture.filterNeedsValueLink'), count: pendingCounts.needsValueLink, show: study.valueLinkingEnabled && pendingCounts.needsValueLink > 0 },
            ] as const).filter((c) => c.show).map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  setFilter(chip.key as typeof filter);
                  setEntriesSheetOpen(true);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {chip.label}{chip.key !== 'all' && ` · ${chip.count}`}
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Entries bottom sheet */}
      {entriesSheetOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setEntriesSheetOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{t('capture.entriesListTitle')}</h3>
              <button
                onClick={() => setEntriesSheetOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  placeholder={t('capture.searchPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-gray-900 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand focus:bg-white outline-none"
                />
              </div>
              {searchLoading && <p className="mt-2 text-xs text-gray-400">{t('capture.loading')}</p>}
              {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="mt-2 text-xs text-gray-400">{t('capture.searchNoResults')}</p>
              )}
              {searchResults.length > 0 && (
                <ul className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {searchResults.map((r) => (
                    <li key={r.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                      <span className={`shrink-0 mt-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        r.classification === 'value' ? 'bg-green-100 text-green-700' :
                        r.classification === 'failure' ? 'bg-red-100 text-red-700' :
                        r.classification === 'sequence' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {r.classification === 'value' ? t('capture.value') : r.classification === 'failure' ? t('capture.failure') : r.classification === 'sequence' ? t('capture.classificationWorkSequence') : '?'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 truncate">{r.verbatim || '—'}</p>
                        {(r.demandTypeLabel || r.workTypeLabel) && (
                          <p className="text-xs text-gray-400 truncate">{tl(r.demandTypeLabel || r.workTypeLabel || '')}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Filter chips */}
            <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-gray-100">
              {([
                { key: 'all', label: t('capture.filterAll'), count: entries.length, show: true },
                { key: 'needsClassification', label: t('capture.filterNeedsClassification'), count: pendingCounts.needsClassification, show: study.classificationEnabled },
                { key: 'needsHandling', label: t('capture.filterNeedsHandling'), count: pendingCounts.needsHandling, show: study.handlingEnabled },
                { key: 'needsValueLink', label: t('capture.filterNeedsValueLink'), count: pendingCounts.needsValueLink, show: study.valueLinkingEnabled },
              ] as const).filter(c => c.show).map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilter(chip.key as typeof filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filter === chip.key
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {chip.label} {chip.key !== 'all' && `(${chip.count})`}
                </button>
              ))}
            </div>

            {/* Entries list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <ul className="space-y-2">
                {entries
                  .filter((e) => {
                    if (filter === 'needsClassification') return e.classification === 'unknown';
                    if (filter === 'needsHandling') return !e.handlingTypeId;
                    if (filter === 'needsValueLink') return e.entryType === 'demand' && e.classification === 'failure' && !e.linkedValueDemandEntryId && !e.originalValueDemandTypeId;
                    return true;
                  })
                  .slice(0, listLimit)
                  .map((e) => {
                    const dt = study.demandTypes.find(d => d.id === e.demandTypeId);
                    const ht = study.handlingTypes.find(h => h.id === e.handlingTypeId);
                    return (
                      <li key={e.id} className="p-3 rounded-lg border border-gray-200 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                e.classification === 'value' ? 'bg-green-100 text-green-700' :
                                e.classification === 'failure' ? 'bg-red-100 text-red-700' :
                                e.classification === 'sequence' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {e.classification === 'value' ? t('capture.value') : e.classification === 'failure' ? t('capture.failure') : e.classification === 'sequence' ? t('capture.classificationWorkSequence') : '?'}
                              </span>
                              {dt && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{tl(dt.label)}</span>}
                              {ht && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{tl(ht.label)}</span>}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">{e.verbatim || '—'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingEntryId(e.id)}
                            className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                          >
                            {t('capture.edit')}
                          </button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
              {entries.length > listLimit && (
                <button
                  type="button"
                  onClick={() => setListLimit((n) => n + 50)}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('capture.showMore')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {editingEntryId && (
        <EntryEditModal
          code={code}
          entryId={editingEntryId}
          study={{
            activeLayer: study.activeLayer,
            systemType: study.systemType,
            classificationEnabled: study.classificationEnabled,
            handlingEnabled: study.handlingEnabled,
            valueLinkingEnabled: study.valueLinkingEnabled,
            demandTypesEnabled: study.demandTypesEnabled,
            workTypesEnabled: study.workTypesEnabled,
            workStepTypesEnabled: study.workStepTypesEnabled,
            flowDemandEnabled: study.flowDemandEnabled,
            flowWorkEnabled: study.flowWorkEnabled,
            systemConditionsEnabled: study.systemConditionsEnabled,
            flowFailureDemandTypesEnabled: study.flowFailureDemandTypesEnabled,
            valueStepsEnabled: study.valueStepsEnabled,
            valueCreationCapabilityEnabled: study.valueCreationCapabilityEnabled,
            whatMattersEnabled: study.whatMattersEnabled,
            thinkingsEnabled: study.thinkingsEnabled,
            lifeProblemsEnabled: study.lifeProblemsEnabled,
            oneStopHandlingType: study.oneStopHandlingType,
            handlingTypes: study.handlingTypes.map(h => ({ id: h.id, label: h.label, operationalDefinition: h.operationalDefinition })),
            demandTypes: study.demandTypes.map(d => ({ id: d.id, category: d.category, label: d.label })),
            contactMethods: study.contactMethods,
            pointsOfTransaction: study.pointsOfTransaction,
            whatMattersTypes: study.whatMattersTypes.map(w => ({ id: w.id, label: w.label })),
            lifeProblems: study.lifeProblems.map(lp => ({ id: lp.id, label: lp.label })),
            workTypes: study.workTypes,
            workStepTypes: study.workStepTypes || [],
            valueSteps: study.valueSteps || [],
            systemConditions: (study.systemConditions || []).map(s => ({ id: s.id, label: s.label, operationalDefinition: s.operationalDefinition })),
            thinkings: (study.thinkings || []).map(t => ({ id: t.id, label: t.label })),
          }}
          onClose={() => setEditingEntryId(null)}
          onSaved={() => { loadTodayCount(); loadPendingCounts(); setCaseRefreshTick((n) => n + 1); }}
          onStudyRefresh={refreshStudy}
        />
      )}

      {showTogglesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTogglesModal(false)}
        >
          {/* Mostly transparent outer card — a faint 10% white wash plus
              backdrop-blur so the capture form still reads through but the
              panel has a gentle frame around it. Header, description, and
              each toggle row carry their own opaque background on top.
              Narrow max-w-xs so the widest pill sets the column width. */}
          <div
            className="max-w-xs w-full max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-sm rounded-2xl p-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grey pill-shaped header — title centred with the short
                "Turn on what's useful..." subtitle tucked inside the same
                pill. Close button floats to the right edge so the centring
                stays true. Dark outline + bold heading reads clearly as
                the panel title. */}
            <div className="relative px-4 py-3 mb-3 rounded-2xl bg-gray-200 border-2 border-gray-700 shadow-sm sticky top-0">
              <h3 className="font-bold text-gray-800 text-lg text-center leading-tight">{t('capture.toggles.title')}</h3>
              <p className="text-xs text-gray-600 text-center leading-tight mt-0.5">{t('capture.toggles.desc')}</p>
              <button
                onClick={() => setShowTogglesModal(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 text-2xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div>
              <CaptureTogglesPanel
                code={code}
                study={study}
                onChange={refreshStudy}
                showHeader={false}
                onOptimisticToggle={(field, value) => {
                  setStudy((s) => s ? { ...s, [field]: value } : s);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
