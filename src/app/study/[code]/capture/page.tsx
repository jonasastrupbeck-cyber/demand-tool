'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import EntryEditModal from '@/components/EntryEditModal';
import CaptureTogglesPanel from '@/components/CaptureTogglesPanel';

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
  volumeMode: boolean;
  activeLayer: number;
  classificationEnabled: boolean;
  handlingEnabled: boolean;
  valueLinkingEnabled: boolean;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
  pointsOfTransaction: PointOfTransaction[];
  whatMattersTypes: WhatMattersType[];
  workTypes: WorkType[];
  systemConditions: { id: string; label: string; operationalDefinition: string | null }[];
}

export default function CapturePage() {
  const params = useParams();
  const code = params.code as string;
  const { t, tl } = useLocale();

  const [study, setStudy] = useState<StudyData | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [failureCauseSuggestions, setFailureCauseSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [collectorName, setCollectorName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [lastEntry, setLastEntry] = useState<{ id: string; verbatim: string } | null>(null);

  // Entries list + filter chips
  interface EntryRow {
    id: string;
    verbatim: string;
    classification: 'value' | 'failure' | 'unknown';
    entryType: 'demand' | 'work';
    demandTypeId: string | null;
    handlingTypeId: string | null;
    linkedValueDemandEntryId: string | null;
    createdAt: string;
    collectorName: string | null;
  }
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [pendingCounts, setPendingCounts] = useState({ needsClassification: 0, needsHandling: 0, needsValueLink: 0 });
  const [filter, setFilter] = useState<'all' | 'needsClassification' | 'needsHandling' | 'needsValueLink'>('all');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [listLimit, setListLimit] = useState(50);
  const [showTogglesModal, setShowTogglesModal] = useState(false);

  // Entry type (demand vs work)
  const [entryType, setEntryType] = useState<'demand' | 'work'>('demand');

  // Form state
  const [verbatim, setVerbatim] = useState('');
  const [classification, setClassification] = useState<'value' | 'failure' | 'unknown' | ''>('');
  const [demandTypeId, setDemandTypeId] = useState('');
  const [handlingTypeId, setHandlingTypeId] = useState('');
  const [contactMethodId, setContactMethodId] = useState('');
  const [pointOfTransactionId, setPointOfTransactionId] = useState('');
  const [whatMattersTypeIds, setWhatMattersTypeIds] = useState<string[]>([]);
  const [originalValueDemandTypeId, setOriginalValueDemandTypeId] = useState('');
  const [failureCause, setFailureCause] = useState('');
  const [systemConditionIds, setSystemConditionIds] = useState<string[]>([]);
  const [whatMatters, setWhatMatters] = useState('');
  const [workTypeId, setWorkTypeId] = useState('');

  // Inline type creation state
  const [addingType, setAddingType] = useState<'demand'|'work'|'handling'|'whatMatters'|'systemCondition'|'originalValue'|null>(null);
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
      if (data.primaryContactMethodId) {
        setContactMethodId(data.primaryContactMethodId);
      }
      if (data.primaryPointOfTransactionId) {
        setPointOfTransactionId(data.primaryPointOfTransactionId);
      }
    }
    setLoading(false);
  }, [code]);

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
      setTodayCount(data.todayCount);
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
    setContactMethodId(study?.primaryContactMethodId || '');
    setPointOfTransactionId(study?.primaryPointOfTransactionId || '');
    setWhatMattersTypeIds([]);
    setOriginalValueDemandTypeId('');
    setFailureCause('');
    setSystemConditionIds([]);
    setWhatMatters('');
    setWorkTypeId('');
    setError('');
    // Keep entryType sticky for batch entry
  }

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
      const { id } = await res.json();
      await refreshStudy();
      onCreated(id);
    }
    setNewTypeLabel('');
    setAddingType(null);
    setAddingTypeLoading(false);
  }

  function renderAddTypeInput(type: typeof addingType, apiPath: string, extraBody: Record<string, string>, onCreated: (id: string) => void) {
    if (addingType !== type) return null;
    return (
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={newTypeLabel}
          onChange={(e) => setNewTypeLabel(e.target.value)}
          placeholder={t('capture.newTypePlaceholder')}
          className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] outline-none"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddType(apiPath, extraBody, onCreated); } if (e.key === 'Escape') setAddingType(null); }}
          disabled={addingTypeLoading}
        />
        <button type="button" onClick={() => handleAddType(apiPath, extraBody, onCreated)} disabled={!newTypeLabel.trim() || addingTypeLoading} className="px-3 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]">
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
    // When classification is off, default to 'unknown' so entries still save.
    const effectiveClassification = !classificationOn ? 'unknown' : classification;
    const isVolumeMode = study?.volumeMode ?? false;
    if (!isVolumeMode && !verbatim.trim()) return;
    if (!effectiveClassification) return;

    setSubmitting(true);
    setError('');

    const body: Record<string, unknown> = {
      verbatim: verbatim.trim() || '',
      classification: effectiveClassification,
      entryType,
      contactMethodId: contactMethodId || undefined,
      pointOfTransactionId: pointOfTransactionId || undefined,
      collectorName: collectorName.trim() || undefined,
    };

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
    } else {
      body.workTypeId = study?.workTypesEnabled ? (workTypeId || undefined) : undefined;
    }

    // System conditions (both demand and work, when failure + enabled)
    if (study?.systemConditionsEnabled && effectiveClassification === 'failure' && systemConditionIds.length > 0) {
      body.systemConditionIds = systemConditionIds;
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
    setLastEntry({ id: saved.id, verbatim: verbatim.trim() });
    setSuccess(true);
    setTodayCount((c) => c + 1);
    resetForm();
    loadSuggestions();
    loadTodayCount();
    loadPendingCounts();

    setTimeout(() => setSuccess(false), 4000);
  }

  const filteredDemandTypes = study?.demandTypes.filter(
    (dt) => dt.category === classification
  ) || [];

  const filteredSuggestions = failureCauseSuggestions.filter(
    (s) => failureCause && s.toLowerCase().includes(failureCause.toLowerCase()) && s.toLowerCase() !== failureCause.toLowerCase()
  );

  const inputCls = 'w-full px-4 py-3 rounded-lg text-base text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none';
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

  return (
    <div className="max-w-lg mx-auto p-4 pb-24">
      {/* Header with collector name and today's count */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{study.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-gray-500">{collectorName}</span>
            <button
              type="button"
              onClick={() => { localStorage.removeItem(`collector_${code}`); setCollectorName(''); setNameConfirmed(false); }}
              className="text-xs text-[#ac2c2d] hover:text-[#8a2324]"
            >
              {t('capture.notYou')}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTogglesModal(true)}
            title={t('capture.toggles.title')}
            aria-label={t('capture.toggles.title')}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            <span className="hidden sm:inline">{t('capture.toggles.title')}</span>
          </button>
          <span className="text-sm px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700">
            {t('capture.today')}: {todayCount}
          </span>
        </div>
      </div>

      {/* Demand / Work tabs (only when work tracking is enabled) */}
      {study.workTrackingEnabled && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => { setEntryType('demand'); setClassification(''); setDemandTypeId(''); setWorkTypeId(''); }}
              className={`py-2.5 rounded-md font-medium text-sm transition-all ${
                isDemand
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('capture.demand')}
            </button>
            <button
              type="button"
              onClick={() => { setEntryType('work'); setClassification(''); setDemandTypeId(''); setWorkTypeId(''); }}
              className={`py-2.5 rounded-md font-medium text-sm transition-all ${
                !isDemand
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('capture.work')}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 italic">
            {isDemand ? t('capture.demandHelp') : t('capture.workHelp')}
          </p>
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
              setTodayCount((c) => Math.max(0, c - 1));
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

      {/* Search previous entries */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); setSearchResults([]); }}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          {t('capture.searchEntries')}
        </button>
        {searchOpen && (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('capture.searchPlaceholder')}
              className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] outline-none"
              autoFocus
            />
            {searchLoading && <p className="mt-2 text-xs text-gray-400">{t('capture.loading')}</p>}
            {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="mt-2 text-xs text-gray-400">{t('capture.searchNoResults')}</p>
            )}
            {searchResults.length > 0 && (
              <ul className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                {searchResults.map((r) => (
                  <li key={r.id} className="flex items-start gap-2 p-2 bg-white rounded border border-gray-100">
                    <span className={`shrink-0 mt-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      r.classification === 'value' ? 'bg-green-100 text-green-700' :
                      r.classification === 'failure' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {r.classification === 'value' ? t('capture.value') : r.classification === 'failure' ? t('capture.failure') : '?'}
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
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Verbatim — the customer's words (hidden in volume mode) */}
        {!study.volumeMode && (
          <div>
            <label className={labelCls}>
              {isDemand ? t('capture.verbatimLabel') : t('capture.workVerbatimLabel')}{req}
            </label>
            <textarea
              value={verbatim}
              onChange={(e) => setVerbatim(e.target.value)}
              placeholder={isDemand ? t('capture.verbatimPlaceholder') : t('capture.workVerbatimPlaceholder')}
              rows={3}
              className={inputCls}
              autoFocus
              required
            />
          </div>
        )}

        {/* Contact method */}
        <div>
          <label className={labelCls}>{t('capture.contactMethodLabel')}</label>
          <select value={contactMethodId} onChange={(e) => setContactMethodId(e.target.value)} className={inputCls}>
            <option value="">{t('capture.selectContactMethod')}</option>
            {study.contactMethods.map((cm) => (
              <option key={cm.id} value={cm.id}>{tl(cm.label)}</option>
            ))}
          </select>
        </div>

        {/* Point of transaction */}
        {study.pointsOfTransaction.length > 0 && (
          <div>
            <label className={labelCls}>{t('capture.pointOfTransactionLabel')}</label>
            <select value={pointOfTransactionId} onChange={(e) => setPointOfTransactionId(e.target.value)} className={inputCls}>
              <option value="">{t('capture.selectPointOfTransaction')}</option>
              {study.pointsOfTransaction.map((pot) => (
                <option key={pot.id} value={pot.id}>{tl(pot.label)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Value / Failure / ? toggle — when classification is on */}
        {study.classificationEnabled && (
          <div>
            <label className={`${labelCls} mb-2`}>{t('capture.classification')}{req}</label>
            {!isDemand && (
              <p className="mb-2 text-xs text-gray-500 italic">
                {t('capture.workClassificationHelp')}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setClassification('value'); setDemandTypeId(''); setWorkTypeId(''); setFailureCause(''); setOriginalValueDemandTypeId(''); }}
                className={`py-3.5 rounded-lg font-semibold text-base transition-all ${
                  classification === 'value'
                    ? 'bg-green-600 text-white shadow-md ring-2 ring-green-600 ring-offset-2'
                    : 'bg-green-50 text-green-700 border-2 border-green-200 hover:border-green-400'
                }`}
              >
                {t('capture.value')}
              </button>
              <button
                type="button"
                onClick={() => { setClassification('failure'); setDemandTypeId(''); setWorkTypeId(''); }}
                className={`py-3.5 rounded-lg font-semibold text-base transition-all ${
                  classification === 'failure'
                    ? 'bg-red-600 text-white shadow-md ring-2 ring-red-600 ring-offset-2'
                    : 'bg-red-50 text-red-700 border-2 border-red-200 hover:border-red-400'
                }`}
              >
                {t('capture.failure')}
              </button>
              <button
                type="button"
                onClick={() => { setClassification('unknown'); setDemandTypeId(''); setWorkTypeId(''); setFailureCause(''); setOriginalValueDemandTypeId(''); }}
                className={`py-3.5 rounded-lg font-semibold text-base transition-all ${
                  classification === 'unknown'
                    ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-500 ring-offset-2'
                    : 'bg-amber-50 text-amber-700 border-2 border-amber-200 hover:border-amber-400'
                }`}
              >
                {t('capture.unknown')}
              </button>
            </div>
          </div>
        )}

        {/* Demand type dropdown (when demand types enabled, demand mode only) */}
        {study.demandTypesEnabled && isDemand && classification && classification !== 'unknown' && (
          <div>
            <label className={labelCls}>{t('capture.demandTypeLabel', { classification: classificationLabel })}</label>
            <div className="flex gap-2">
              <select value={demandTypeId} onChange={(e) => setDemandTypeId(e.target.value)} className={inputCls}>
                <option value="">{t('capture.selectType')}</option>
                {filteredDemandTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>{tl(dt.label)}</option>
                ))}
              </select>
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

        {/* Work type dropdown (when work types enabled, work mode only) */}
        {study.workTypesEnabled && !isDemand && classification && (
          <div>
            <label className={labelCls}>{t('capture.workTypeLabel')}</label>
            <div className="flex gap-2">
              <select value={workTypeId} onChange={(e) => setWorkTypeId(e.target.value)} className={inputCls}>
                <option value="">{t('capture.selectWorkType')}</option>
                {study.workTypes.map((wt) => (
                  <option key={wt.id} value={wt.id}>{tl(wt.label)}</option>
                ))}
              </select>
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

        {/* Handling type dropdown — when handling toggle is on */}
        {study.handlingEnabled && (
          <div>
            <label className={labelCls}>{t('capture.handlingLabel')}</label>
            <div className="flex gap-2">
              <select value={handlingTypeId} onChange={(e) => setHandlingTypeId(e.target.value)} className={inputCls}>
                <option value="">{t('capture.selectHandling')}</option>
                {study.handlingTypes.map((ht) => (
                  <option key={ht.id} value={ht.id}>{tl(ht.label)}</option>
                ))}
              </select>
              {addBtn('handling')}
            </div>
            {renderAddTypeInput('handling', 'handling-types', {}, (id) => setHandlingTypeId(id))}
            {handlingTypeId && study.handlingTypes.find(h => h.id === handlingTypeId)?.operationalDefinition && (
              <p className="mt-1 text-xs text-gray-400 italic">{study.handlingTypes.find(h => h.id === handlingTypeId)!.operationalDefinition}</p>
            )}
          </div>
        )}

        {/* System conditions / failure cause — when classification is on and entry is a failure */}
        {study.classificationEnabled && classification === 'failure' && (
          study.systemConditionsEnabled && (study.systemConditions || []).length > 0 ? (
            <div>
              <label className={labelCls}>{t('capture.systemConditionsLabel')}</label>
              <div className="flex flex-wrap gap-2">
                {(study.systemConditions || []).map((sc) => {
                  const isSelected = systemConditionIds.includes(sc.id);
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setSystemConditionIds(prev =>
                          isSelected ? prev.filter(id => id !== sc.id) : [...prev, sc.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-1'
                          : 'bg-red-50 text-red-700 border border-red-200 hover:border-red-400'
                      }`}
                    >
                      {tl(sc.label)}
                    </button>
                  );
                })}
                {addBtn('systemCondition')}
              </div>
              {renderAddTypeInput('systemCondition', 'system-conditions', {}, (id) => setSystemConditionIds(prev => [...prev, id]))}
            </div>
          ) : isDemand ? (
            <div className="relative">
              <label className={labelCls}>{t('capture.failureCauseLabel')}</label>
              <textarea
                value={failureCause}
                onChange={(e) => { setFailureCause(e.target.value); setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('capture.failureCausePlaceholder')}
                rows={2}
                className={inputCls}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto bg-white border border-gray-200">
                  {filteredSuggestions.map((suggestion, i) => (
                    <button key={i} type="button" className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      onMouseDown={() => { setFailureCause(suggestion); setShowSuggestions(false); }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null
        )}

        {/* Original value demand — value linking toggle on, demand + failure only */}
        {study.valueLinkingEnabled && isDemand && classification === 'failure' && (
          <div>
            <label className={labelCls}>{t('capture.originalValueDemandLabel')}</label>
            <div className="flex gap-2">
              <select value={originalValueDemandTypeId} onChange={(e) => setOriginalValueDemandTypeId(e.target.value)} className={inputCls}>
                <option value="">{t('capture.selectOriginalValueDemand')}</option>
                {study.demandTypes.filter(dt => dt.category === 'value').map((dt) => (
                  <option key={dt.id} value={dt.id}>{tl(dt.label)}</option>
                ))}
              </select>
              {addBtn('originalValue')}
            </div>
            {renderAddTypeInput('originalValue', 'demand-types', { category: 'value' }, (id) => setOriginalValueDemandTypeId(id))}
          </div>
        )}

        {/* What matters multi-select (demand only) */}
        {isDemand && study.whatMattersTypes.length > 0 && (
          <div>
            <label className={labelCls}>{t('capture.whatMattersSelect')}</label>
            <div className="flex flex-wrap gap-2">
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
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    {tl(wm.label)}
                  </button>
                );
              })}
              {addBtn('whatMatters')}
            </div>
            {renderAddTypeInput('whatMatters', 'what-matters-types', {}, (id) => setWhatMattersTypeIds(prev => [...prev, id]))}
          </div>
        )}

        {/* What matters free text (demand only) */}
        {isDemand && (
          <div>
            <label className={labelCls}>{t('capture.whatMattersLabel')}</label>
            <textarea value={whatMatters} onChange={(e) => setWhatMatters(e.target.value)} placeholder={t('capture.whatMattersPlaceholder')} rows={2} className={inputCls} />
          </div>
        )}

        {/* Submit button - sticky at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t shadow-lg bg-white border-gray-200">
          <div className="max-w-lg mx-auto">
            <button
              type="submit"
              disabled={submitting || (!study.volumeMode && !verbatim.trim()) || (study.classificationEnabled && !classification)}
              className="w-full py-4 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-[#ac2c2d]"
            >
              {submitting ? t('capture.saving') : isDemand ? t('capture.save') : t('capture.saveWork')}
            </button>
          </div>
        </div>
      </form>

      {/* Entries list with filter chips */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('capture.entriesListTitle')}</h2>
        <div className="flex flex-wrap gap-2 mb-3">
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

        <ul className="space-y-2">
          {entries
            .filter((e) => {
              if (filter === 'needsClassification') return e.classification === 'unknown';
              if (filter === 'needsHandling') return !e.handlingTypeId;
              if (filter === 'needsValueLink') return e.entryType === 'demand' && e.classification === 'failure' && !e.linkedValueDemandEntryId;
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
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {e.classification === 'value' ? t('capture.value') : e.classification === 'failure' ? t('capture.failure') : '?'}
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
            systemConditionsEnabled: study.systemConditionsEnabled,
            handlingTypes: study.handlingTypes.map(h => ({ id: h.id, label: h.label })),
            demandTypes: study.demandTypes.map(d => ({ id: d.id, category: d.category, label: d.label })),
            contactMethods: study.contactMethods,
            pointsOfTransaction: study.pointsOfTransaction,
            whatMattersTypes: study.whatMattersTypes.map(w => ({ id: w.id, label: w.label })),
            workTypes: study.workTypes,
            systemConditions: (study.systemConditions || []).map(s => ({ id: s.id, label: s.label })),
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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
