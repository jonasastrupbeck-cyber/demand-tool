'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import EntryEditModal from '@/components/EntryEditModal';
import CaptureTogglesPanel from '@/components/CaptureTogglesPanel';
import CapabilityRadioGroup from '@/components/CapabilityRadioGroup';
import SegmentedToggle from '@/components/SegmentedToggle';
import InfoPopover from '@/components/InfoPopover';
import PillSelect from '@/components/PillSelect';

interface HandlingType {
  id: string;
  label: string;
  operationalDefinition: string | null;
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
}

interface WorkType {
  id: string;
  label: string;
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
  oneStopHandlingType: string | null;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
  pointsOfTransaction: PointOfTransaction[];
  workSources: { id: string; label: string; customerFacing: boolean; sortOrder: number }[];
  whatMattersTypes: WhatMattersType[];
  lifeProblems: { id: string; label: string; operationalDefinition: string | null }[];
  workTypes: WorkType[];
  workStepTypes: { id: string; label: string; tag: 'value' | 'failure'; operationalDefinition: string | null; sortOrder: number }[];
  systemConditions: { id: string; label: string; operationalDefinition: string | null }[];
  thinkings: { id: string; label: string; operationalDefinition: string | null }[];
}

export default function CapturePage() {
  const params = useParams();
  const code = params.code as string;
  const { t, tl } = useLocale();

  const [study, setStudy] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [failureCauseSuggestions, setFailureCauseSuggestions] = useState<string[]>([]);
  const [collectorName, setCollectorName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [lastEntry, setLastEntry] = useState<{ id: string; verbatim: string } | null>(null);

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
  const [listLimit, setListLimit] = useState(50);
  const [showTogglesModal, setShowTogglesModal] = useState(false);
  const [entriesSheetOpen, setEntriesSheetOpen] = useState(false);
  const [entriesBoxExpanded, setEntriesBoxExpanded] = useState(false);

  // Entry type (demand vs work)
  const [entryType, setEntryType] = useState<'demand' | 'work'>('demand');

  // Form state
  const [verbatim, setVerbatim] = useState('');
  const [classification, setClassification] = useState<'value' | 'failure' | 'unknown' | 'sequence' | ''>('');
  const [demandTypeId, setDemandTypeId] = useState('');
  const [handlingTypeId, setHandlingTypeId] = useState('');
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
  // Work-description blocks (Work tab only) — Phase 2 / Item 4.
  // Phase 4 (2026-04-16) — each Flow block can optionally reference a managed
  // Work Step Type via `workStepTypeId`. Null = free-text block (current UX).
  // `freeText` is a UI-only flag that distinguishes "empty new block (show
  // picker)" from "user chose free-text mode (show textarea)" when the picker
  // is on but no step is picked. Not persisted to the DB.
  const [workBlocks, setWorkBlocks] = useState<{ tag: 'value' | 'failure'; text: string; workStepTypeId: string | null; freeText: boolean }[]>([]);

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

  const loadStudy = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      setStudy(data);
      // Session-sticky defaults: localStorage overrides study primary.
      let savedSession: { contactMethodId?: string; pointOfTransactionId?: string; workSourceId?: string } = {};
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
    }
    setLoading(false);
  }, [code]);

  // Persist session-sticky defaults whenever they change (after initial load).
  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem(
        `capture-session:${code}`,
        JSON.stringify({ contactMethodId, pointOfTransactionId, workSourceId }),
      );
    } catch {}
  }, [code, loading, contactMethodId, pointOfTransactionId, workSourceId]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!searchOpen || searchQuery.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) setSearchResults(await res.json());
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen, code]);

  function resetForm() {
    setVerbatim('');
    setClassification('');
    setDemandTypeId('');
    setHandlingTypeId('');
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
    setWorkBlocks([]);
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
    if (!newTypeLabel.trim()) return;
    setAddingTypeLoading(true);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/${apiPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newTypeLabel.trim(), ...extraBody }),
    });
    if (res.ok) {
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
    }
    setNewTypeLabel('');
    setAddingType(null);
    setAddingTypeLoading(false);
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
                               'flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] outline-none';
    const addBtnClass =
      variant === 'green'    ? 'px-3 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-green-600 hover:bg-green-700' :
      variant === 'sky'      ? 'px-3 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-sky-600 hover:bg-sky-700' :
      variant === 'thinking' ? 'px-3 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-blue-700 hover:bg-blue-800' :
                               'px-3 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]';
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
    if (examplesTypeId === typeId) { setExamplesTypeId(null); return; }
    setExamplesTypeId(typeId);
    if (examplesCache.current[typeId]) { setExamples(examplesCache.current[typeId]); return; }
    setExamplesLoading(true);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/search?typeId=${typeId}&limit=5`);
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
    if (!effectiveClassification) return;

    setSubmitting(true);
    setError('');

    const body: Record<string, unknown> = {
      verbatim: verbatim.trim() || '',
      classification: effectiveClassification,
      entryType,
      contactMethodId: contactMethodId || undefined,
      pointOfTransactionId: pointOfTransactionId || undefined,
      // Work source — only relevant for work entries (server also gates on
      // entryType='work'), but it's cheap to pass through unconditionally.
      workSourceId: isWorkSubmit ? (workSourceId || undefined) : undefined,
      collectorName: collectorName.trim() || undefined,
    };

    // Work tab: send workBlocks; server auto-populates verbatim from them.
    // Strip the UI-only `freeText` flag before sending.
    if (isWorkSubmit && validWorkBlocks.length > 0) {
      body.workBlocks = validWorkBlocks.map(({ tag, text, workStepTypeId }) => ({ tag, text, workStepTypeId }));
    }

    // Handling — only when the toggle is on.
    if (handlingOn) {
      body.handlingTypeId = handlingTypeId || undefined;
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
      body.workTypeId = study?.workTypesEnabled ? (workTypeId || undefined) : undefined;
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

    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError(t('capture.saveFailed'));
      return;
    }

    const saved = await res.json();
    const lastVerbatim = isWorkSubmit && validWorkBlocks.length > 0
      ? validWorkBlocks.map((b) => `[${b.tag}] ${b.text}`).join(' · ')
      : verbatim.trim();
    setLastEntry({ id: saved.id, verbatim: lastVerbatim });
    setSuccess(true);
    resetForm();

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
                className="w-full mt-4 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-[#ac2c2d] hover:bg-[#8a2324]"
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
  const classificationLabel = classification === 'value' ? t('capture.value').toLowerCase() : t('capture.failure').toLowerCase();
  // System conditions + Thinking are visible on every classified entry.
  // Per Ali feedback 2026-04-16: failure work can be hidden inside ANY
  // outcome — including value demands handled one-stop, and value work —
  // so SC + Thinking must be available wherever the Flow might contain
  // failure-work steps. Only hide when classification is unset or '?'.
  const scVisible = !!classification && classification !== 'unknown';

  return (
    <div className="max-w-lg mx-auto p-4 pb-24">
      {/* Header: study name, collector (with pencil), settings icon */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{study.name}</h1>
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
      </div>

      {/* Session-sticky strip: Point of transaction + Contact method, set once per session.
          Positioned above the Demand/Work tabs — these are context that apply to every entry.
          Rendered as PillSelects (custom dropdown with nicer visuals than a native <select>). */}
      {(study.pointsOfTransaction.length > 0 || study.contactMethods.length > 0 || (study.workSourcesEnabled && entryType === 'work')) && (
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
          {study.contactMethods.length > 0 && (
            <PillSelect
              ariaLabel={t('capture.sessionContactMethodLabel')}
              placeholder={t('capture.selectContactMethod')}
              value={contactMethodId}
              onChange={setContactMethodId}
              options={study.contactMethods.map((cm) => ({ id: cm.id, label: tl(cm.label) }))}
            />
          )}
          {/* Work source — Work tab only. Session-sticky pill mirroring
              PoT/Contact method, gated on workSourcesEnabled (migration 0015).
              Renders as soon as the toggle is on, even if the taxonomy is
              still empty — the empty dropdown signals that items need to be
              added in Settings. */}
          {study.workSourcesEnabled && entryType === 'work' && (
            <PillSelect
              ariaLabel={t('capture.sessionWorkSourceLabel')}
              placeholder={t('capture.selectWorkSource')}
              value={workSourceId}
              onChange={setWorkSourceId}
              options={(study.workSources || []).map((ws) => ({ id: ws.id, label: tl(ws.label) }))}
            />
          )}
        </div>
      )}

      {/* Demand / Work tabs — shown when work tracking is on, OR when the user has
          enabled "Capture work types" (which cascades workTrackingEnabled on via the
          API so dashboard aggregations and downstream work features also light up). */}
      {(study.workTrackingEnabled || study.workTypesEnabled) && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 rounded-lg">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setEntryType('demand'); setClassification(''); setDemandTypeId(''); setWorkTypeId(''); setWorkBlocks([]); }}
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
                onClick={() => { setEntryType('work'); setClassification(''); setDemandTypeId(''); setWorkTypeId(''); setWorkBlocks([]); }}
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

      {/* Last entry undo card */}
      {lastEntry && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{t('capture.lastEntry')}</p>
            <p className="text-sm text-gray-700 truncate">{lastEntry.verbatim ? <>&ldquo;{lastEntry.verbatim}&rdquo;</> : t('capture.saved')}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${lastEntry.id}`, { method: 'DELETE' });
              setLastEntry(null);
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
        {/* Verbatim — demand tab or volume-off work without blocks yet.
            Header removed: the placeholder ("Write the customer's words…") carries the prompt. */}
        {!study.volumeMode && isDemand && (
          <textarea
            aria-label={t('capture.verbatimLabel')}
            value={verbatim}
            onChange={(e) => setVerbatim(e.target.value)}
            placeholder={t('capture.verbatimPlaceholder')}
            rows={3}
            className={inputCls}
            autoFocus
            required
          />
        )}

        {/* Value / Failure / ? toggle — when classification is on. Work adds a Sequence option.
            Header removed: the pills (Value / Sequence / Failure / ?) are self-describing. */}
        {study.classificationEnabled && (isDemand || study.workClassificationEnabled) && (
          <div role="radiogroup" aria-label={t('capture.classification')} className="flex flex-wrap gap-2 items-center justify-center">
            <button
                type="button"
                onClick={() => { setClassification('value'); setDemandTypeId(''); setWorkTypeId(''); setFailureCause(''); setOriginalValueDemandTypeId(''); }}
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
                  onClick={() => { setClassification('sequence'); setDemandTypeId(''); setWorkTypeId(''); setFailureCause(''); setOriginalValueDemandTypeId(''); }}
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
                onClick={() => { setClassification('failure'); setDemandTypeId(''); setWorkTypeId(''); }}
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

        {/* Secondary fields — appear naturally once the user picks a classification.
            Previously gated behind a "More details" toggle; the toggle was auto-opened
            on every classification click anyway, so it's been removed.
            Three subtle strand separators inside teach the Vanguard frame each capture:
            "Demand"/"Work" → "Response" → "System" (S2 / 2026-04-19). */}
        {(classification || !study.classificationEnabled) && (() => {
          // Strand visibility checks — separator only shows if at least one child renders.
          // When classification is disabled, treat "unclassified" demands as value for the
          // purpose of rendering what-matters (per Vanguard: what matters sits on value demand;
          // skipping classification means the tool assumes value).
          const isFailureDemand = isDemand && classification === 'failure';
          const isValueDemand = isDemand && classification === 'value';
          const whatMattersVisible = isDemand && (isValueDemand || !study.classificationEnabled);
          const hasDemandStrand =
            (study.demandTypesEnabled && isDemand && classification !== 'unknown' && classification !== 'sequence') ||
            (study.workTypesEnabled && !isDemand) ||
            (study.valueLinkingEnabled && isFailureDemand) ||
            (study.whatMattersEnabled && whatMattersVisible) ||
            (study.lifeProblemsEnabled && isDemand) ||
            (!study.volumeMode && !isDemand); // Flow — always renders for work
          const hasResponseStrand = !!study.handlingEnabled;
          const hasSystemStrand = scVisible && !!(study.systemConditionsEnabled || study.thinkingsEnabled);
          // Tiny muted horizontal rule with a centered uppercase label.
          const sep = (label: string, help?: string) => (
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
        {study.workTypesEnabled && !isDemand && classification && (
          <div>
            <div className="flex gap-2 items-center justify-center">
              <PillSelect
                ariaLabel={t('capture.workTypeLabel')}
                placeholder={t('capture.selectWorkType')}
                value={workTypeId}
                onChange={setWorkTypeId}
                options={study.workTypes.map((wt) => ({ id: wt.id, label: tl(wt.label) }))}
                variant={classification === 'value' ? 'value' : classification === 'sequence' ? 'sequence' : classification === 'failure' ? 'failure' : 'default'}
              />
              {addBtn('work')}
            </div>
            {renderAddTypeInput('work', 'work-types', {}, (id) => setWorkTypeId(id))}
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

        {/* Original value demand — failure demand only. Header removed; the "Original value
            demand" placeholder carries the prompt. Value variant (green) since this always links
            to a value demand. */}
        {study.valueLinkingEnabled && isDemand && classification === 'failure' && (
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
        {study.whatMattersEnabled && isDemand && (classification === 'value' || !study.classificationEnabled) && (
          <div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => { setAddingType('whatMatters'); setNewTypeLabel(''); }}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-white text-green-700 border border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                {t('capture.addWhatMatters')}
              </button>
              {study.whatMattersTypes.map((wm) => {
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
        {study.whatMattersEnabled && isDemand && (classification === 'value' || !study.classificationEnabled) && (
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
        {study.lifeProblemsEnabled && isDemand && (
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
        {study.handlingEnabled && (() => {
          const capabilityAddPill = (
            <button
              type="button"
              onClick={() => { setAddingType('handling'); setNewTypeLabel(''); }}
              className="px-3 py-1.5 rounded-full text-sm font-medium border border-dashed bg-white text-sky-700 border-sky-300 hover:border-sky-500 hover:bg-sky-50 transition-colors"
            >
              {t('capture.addHandlingButton')}
            </button>
          );
          return (
            <div>
              {study.handlingTypes.length > 0 ? (
                <CapabilityRadioGroup
                  code={code}
                  options={study.handlingTypes}
                  value={handlingTypeId}
                  onChange={(id) => setHandlingTypeId(id)}
                  leading={capabilityAddPill}
                />
              ) : (
                <div className="flex gap-2 items-center justify-center">
                  {capabilityAddPill}
                </div>
              )}
              {renderAddTypeInput('handling', 'handling-types', {}, (id) => setHandlingTypeId(id), { variant: 'sky', placeholder: t('capture.typeInHandlingPlaceholder') })}
            </div>
          );
        })()}

        {/* Flow — sits AFTER Capability of Response on both tabs (Jonas 2026-04-22).
            A horizontal sequence of small text boxes describing value-work and
            failure-work steps. Opt-in per entry-type via flowDemandEnabled /
            flowWorkEnabled (migration 0014). Verbatim auto-populates as
            `[tag] text\n\n[tag] text` for downstream consumers. */}
        {!study.volumeMode && ((isDemand && study.flowDemandEnabled) || (!isDemand && study.flowWorkEnabled)) && (
          <div>
            {sep(t('capture.strand.flow'), t('capture.workClassificationHelp'))}
            <div className="overflow-x-auto -mx-1 px-1 pb-2">
              <div className="flex gap-2 items-stretch min-w-min">
                {workBlocks.map((block, idx) => {
                  // Phase 4 (2026-04-16): three render modes per block
                  //   A) Picker mode — toggle ON, no step picked, rendering a step dropdown
                  //   B) Badge mode — toggle ON, step picked, showing coloured badge + clear
                  //   C) Free-text mode — toggle OFF, or user chose "Free-text step", or legacy orphan
                  const pickerOn = study.workStepTypesEnabled && (study.workStepTypes || []).length > 0;
                  const hasStep = !!block.workStepTypeId;
                  const step = hasStep ? (study.workStepTypes || []).find(s => s.id === block.workStepTypeId) : null;
                  const valueSteps = (study.workStepTypes || []).filter(s => s.tag === 'value');
                  const failureSteps = (study.workStepTypes || []).filter(s => s.tag === 'failure');
                  // Mode decision:
                  //   B = badge (picker on, step picked)
                  //   A = picker (picker on, no step, user hasn't chosen free-text)
                  //   C = free-text (picker off OR user chose free-text OR legacy orphan with text)
                  const showFreeText = !pickerOn || (!hasStep && (block.freeText || block.text !== ''));
                  const showPicker = pickerOn && !hasStep && !showFreeText;

                  return (
                    <div key={idx} className="flex-none w-48 p-2 rounded-lg border border-gray-200 bg-gray-50 flex flex-col gap-2">
                      {/* Mode B — badge (step picked) */}
                      {hasStep && step && (
                        <div className="flex items-start justify-between gap-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${step.tag === 'value' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{tl(step.label)}</span>
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

                      {/* Mode A — picker */}
                      {showPicker && (
                        <div className="flex items-center justify-between gap-1">
                          <select
                            value=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              if (val === '__free__') {
                                // Fall into free-text mode — set freeText flag so Mode C renders.
                                setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, workStepTypeId: null, tag: 'value', text: '', freeText: true } : b));
                              } else {
                                const picked = (study.workStepTypes || []).find(s => s.id === val);
                                if (picked) {
                                  setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, workStepTypeId: picked.id, tag: picked.tag, text: picked.label, freeText: false } : b));
                                }
                              }
                            }}
                            className="flex-1 min-w-0 text-xs px-1 py-1 rounded border border-gray-300 bg-white text-gray-900"
                          >
                            <option value="">{t('capture.workStepPickerPlaceholder')}</option>
                            {valueSteps.length > 0 && (
                              <optgroup label={t('capture.workBlockTagValue')}>
                                {valueSteps.map(s => <option key={s.id} value={s.id}>{tl(s.label)}</option>)}
                              </optgroup>
                            )}
                            {failureSteps.length > 0 && (
                              <optgroup label={t('capture.workBlockTagFailure')}>
                                {failureSteps.map(s => <option key={s.id} value={s.id}>{tl(s.label)}</option>)}
                              </optgroup>
                            )}
                            <option value="__free__">{t('capture.workStepPickerFreeText')}</option>
                          </select>
                          <button
                            type="button"
                            aria-label="Remove"
                            onClick={() => setWorkBlocks((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
                          >
                            &times;
                          </button>
                        </div>
                      )}

                      {/* Mode C — free text (picker off, explicit free-text choice, or legacy orphan) */}
                      {showFreeText && !hasStep && (
                        <>
                          <div className="flex items-center justify-between gap-1">
                            <SegmentedToggle
                              value={block.tag}
                              onChange={(v) => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, tag: v as 'value' | 'failure' } : b))}
                              options={[
                                { value: 'value', label: t('capture.workBlockTagValue'), activeColor: 'green' },
                                { value: 'failure', label: t('capture.workBlockTagFailure'), activeColor: 'red' },
                              ]}
                            />
                            <button
                              type="button"
                              aria-label="Remove"
                              onClick={() => setWorkBlocks((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
                            >
                              &times;
                            </button>
                          </div>
                          <textarea
                            value={block.text}
                            onChange={(e) => setWorkBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, text: e.target.value } : b))}
                            placeholder={t('capture.workBlockPlaceholder')}
                            rows={4}
                            className="w-full px-2 py-1 rounded text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none resize-none flex-1"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setWorkBlocks((prev) => [...prev, { tag: 'value', text: '', workStepTypeId: null, freeText: false }])}
                  aria-label={t('capture.addWorkBlockButton')}
                  className="flex-none w-16 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#ac2c2d] hover:text-[#ac2c2d] flex items-center justify-center text-2xl"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {hasSystemStrand && sep(t('capture.strand.system'))}
        {/* System conditions / failure cause — failure (all), work+sequence, or value demand with non-one-stop capability.
            Phase 2 / Item 3: each selected SC carries a Helps/Hinders dimension.
            Header dropped — the "+ Add system condition" pill is self-explanatory; an ⓘ
            next to it carries the definition. */}
        {study.classificationEnabled && scVisible && study.systemConditionsEnabled && (
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
                                    ? 'bg-[#ac2c2d] text-white border-[#ac2c2d]'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#ac2c2d] hover:text-[#ac2c2d]'
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

        {/* Submit button - sticky at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t shadow-lg bg-white border-gray-200">
          <div className="max-w-lg mx-auto">
            <button
              type="submit"
              disabled={submitting || (!study.volumeMode && !verbatim.trim() && !(entryType === 'work' && workBlocks.some((b) => b.text.trim().length > 0))) || (study.classificationEnabled && (isDemand || study.workClassificationEnabled) && !classification)}
              className="w-full py-4 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-[#ac2c2d]"
            >
              {submitting ? t('capture.saving') : isDemand ? t('capture.save') : t('capture.saveWork')}
            </button>
          </div>
        </div>
      </form>

      {/* Entries tab-box — tab-strip visual, tighter than Demand/Work since reclass is an optional
          review action (not a per-entry step). The chevron sits inside its own small pill so the
          click target reads as "open review" rather than "click the whole card". */}
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
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-gray-900 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-[#ac2c2d] focus:bg-white outline-none"
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
                      ? 'bg-[#ac2c2d] text-white'
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
            classificationEnabled: study.classificationEnabled,
            handlingEnabled: study.handlingEnabled,
            valueLinkingEnabled: study.valueLinkingEnabled,
            demandTypesEnabled: study.demandTypesEnabled,
            workTypesEnabled: study.workTypesEnabled,
            workStepTypesEnabled: study.workStepTypesEnabled,
            flowDemandEnabled: study.flowDemandEnabled,
            flowWorkEnabled: study.flowWorkEnabled,
            systemConditionsEnabled: study.systemConditionsEnabled,
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
            systemConditions: (study.systemConditions || []).map(s => ({ id: s.id, label: s.label })),
            thinkings: (study.thinkings || []).map(t => ({ id: t.id, label: t.label })),
          }}
          onClose={() => setEditingEntryId(null)}
          onSaved={() => { loadTodayCount(); loadPendingCounts(); }}
          onStudyRefresh={refreshStudy}
        />
      )}

      {showTogglesModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTogglesModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-gray-900">{t('capture.toggles.title')}</h3>
              <button
                onClick={() => setShowTogglesModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-3">{t('capture.toggles.desc')}</p>
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
