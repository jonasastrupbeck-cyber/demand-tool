'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';

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

  const loadTodayCount = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries`);
    if (res.ok) {
      const data = await res.json();
      setTodayCount(data.todayCount);
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
    const saved = localStorage.getItem(`collector_${code}`);
    if (saved) {
      setCollectorName(saved);
      setNameConfirmed(true);
    }
  }, [loadStudy, loadTodayCount, loadSuggestions, code]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const activeLayer = study?.activeLayer || 1;
    // At Layer 1, classification is auto-set to 'unknown'
    const effectiveClassification = activeLayer < 2 ? 'unknown' : classification;
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

    // Layer 3+: include handling
    if (activeLayer >= 3) {
      body.handlingTypeId = handlingTypeId || undefined;
    }

    if (entryType === 'demand') {
      // Include demand type when enabled
      if (study?.demandTypesEnabled) {
        body.demandTypeId = demandTypeId || undefined;
        body.originalValueDemandTypeId = effectiveClassification === 'failure' ? (originalValueDemandTypeId || undefined) : undefined;
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
        <span className="text-sm px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700">
          {t('capture.today')}: {todayCount}
        </span>
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

        {/* Value / Failure / ? toggle (Layer 2+) */}
        {(study.activeLayer >= 2) && (
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
            <select value={demandTypeId} onChange={(e) => setDemandTypeId(e.target.value)} className={inputCls}>
              <option value="">{t('capture.selectType')}</option>
              {filteredDemandTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>{tl(dt.label)}</option>
              ))}
            </select>
            {demandTypeId && filteredDemandTypes.find(d => d.id === demandTypeId)?.operationalDefinition && (
              <p className="mt-1 text-xs text-gray-400 italic">{filteredDemandTypes.find(d => d.id === demandTypeId)!.operationalDefinition}</p>
            )}
          </div>
        )}

        {/* Work type dropdown (when work types enabled, work mode only) */}
        {study.workTypesEnabled && !isDemand && classification && (
          <div>
            <label className={labelCls}>{t('capture.workTypeLabel')}</label>
            <select value={workTypeId} onChange={(e) => setWorkTypeId(e.target.value)} className={inputCls}>
              <option value="">{t('capture.selectWorkType')}</option>
              {study.workTypes.map((wt) => (
                <option key={wt.id} value={wt.id}>{tl(wt.label)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Handling type dropdown (Layer 3+) */}
        {study.activeLayer >= 3 && (
          <div>
            <label className={labelCls}>{t('capture.handlingLabel')}</label>
            <select value={handlingTypeId} onChange={(e) => setHandlingTypeId(e.target.value)} className={inputCls}>
              <option value="">{t('capture.selectHandling')}</option>
              {study.handlingTypes.map((ht) => (
                <option key={ht.id} value={ht.id}>{tl(ht.label)}</option>
              ))}
            </select>
            {handlingTypeId && study.handlingTypes.find(h => h.id === handlingTypeId)?.operationalDefinition && (
              <p className="mt-1 text-xs text-gray-400 italic">{study.handlingTypes.find(h => h.id === handlingTypeId)!.operationalDefinition}</p>
            )}
          </div>
        )}

        {/* System conditions / failure cause (Layer 2+, failure only — both demand and work) */}
        {study.activeLayer >= 2 && classification === 'failure' && (
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
                      title={sc.operationalDefinition || undefined}
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
              </div>
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

        {/* Original value demand (Layer 2+, demand + failure only) */}
        {study.activeLayer >= 2 && isDemand && classification === 'failure' && (
          <div>
            <label className={labelCls}>{t('capture.originalValueDemandLabel')}</label>
            <select value={originalValueDemandTypeId} onChange={(e) => setOriginalValueDemandTypeId(e.target.value)} className={inputCls}>
              <option value="">{t('capture.selectOriginalValueDemand')}</option>
              {study.demandTypes.filter(dt => dt.category === 'value').map((dt) => (
                <option key={dt.id} value={dt.id}>{tl(dt.label)}</option>
              ))}
            </select>
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
                    title={wm.operationalDefinition || undefined}
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
            </div>
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
              disabled={submitting || (!study.volumeMode && !verbatim.trim()) || ((study?.activeLayer || 1) >= 2 && !classification)}
              className="w-full py-4 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-[#ac2c2d]"
            >
              {submitting ? t('capture.saving') : isDemand ? t('capture.save') : t('capture.saveWork')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
