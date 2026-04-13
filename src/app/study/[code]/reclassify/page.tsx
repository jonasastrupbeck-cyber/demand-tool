'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import type { TranslationKey } from '@/lib/i18n';

interface DemandEntry {
  id: string;
  verbatim: string;
  classification: 'value' | 'failure' | 'unknown';
  createdAt: string;
  handlingTypeId: string | null;
  demandTypeId: string | null;
  contactMethodId: string | null;
  linkedValueDemandEntryId: string | null;
  collectorName: string | null;
}

interface HandlingType {
  id: string;
  label: string;
}

interface DemandType {
  id: string;
  category: 'value' | 'failure';
  label: string;
}

interface ContactMethod {
  id: string;
  label: string;
}

interface StudyData {
  id: string;
  name: string;
  activeLayer: number;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
}

export default function ReclassifyPage() {
  const params = useParams();
  const code = params.code as string;
  const { t, tl } = useLocale();

  const [study, setStudy] = useState<StudyData | null>(null);
  const [entries, setEntries] = useState<DemandEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reclassification form state
  const [classification, setClassification] = useState<'value' | 'failure' | 'unknown' | ''>('');
  const [demandTypeId, setDemandTypeId] = useState('');
  const [handlingTypeId, setHandlingTypeId] = useState('');
  const [linkedValueDemandEntryId, setLinkedValueDemandEntryId] = useState('');

  // Value demand entries for Layer 4 linking
  const [valueDemandEntries, setValueDemandEntries] = useState<DemandEntry[]>([]);

  const loadStudy = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}`);
    if (res.ok) setStudy(await res.json());
  }, [code]);

  const loadEntries = useCallback(async () => {
    if (!study) return;
    // Determine which layer needs reclassification
    const layer = study.activeLayer;
    const reclassifyLayer = layer >= 4 ? 4 : layer >= 3 ? 3 : layer >= 2 ? 2 : 0;
    if (reclassifyLayer < 2) { setLoading(false); return; }

    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/reclassify?layer=${reclassifyLayer}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
    }
    setLoading(false);
  }, [code, study]);

  const loadValueDemandEntries = useCallback(async () => {
    if (!study || study.activeLayer < 4) return;
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries`);
    if (res.ok) {
      const data = await res.json();
      setValueDemandEntries(data.entries.filter((e: DemandEntry) => e.classification === 'value'));
    }
  }, [code, study]);

  useEffect(() => { loadStudy(); }, [loadStudy]);
  useEffect(() => { if (study) { loadEntries(); loadValueDemandEntries(); } }, [study, loadEntries, loadValueDemandEntries]);

  function resetFormState() {
    setClassification('');
    setDemandTypeId('');
    setHandlingTypeId('');
    setLinkedValueDemandEntryId('');
  }

  async function handleSaveAndNext() {
    const entry = entries[currentIndex];
    if (!entry) return;

    setSaving(true);

    const body: Record<string, unknown> = {};
    const reclassifyLayer = study!.activeLayer >= 4 ? 4 : study!.activeLayer >= 3 ? 3 : 2;

    if (reclassifyLayer === 2 && classification) {
      body.classification = classification;
      if (demandTypeId) body.demandTypeId = demandTypeId;
    } else if (reclassifyLayer === 3 && handlingTypeId) {
      body.handlingTypeId = handlingTypeId;
    } else if (reclassifyLayer === 4 && linkedValueDemandEntryId) {
      body.linkedValueDemandEntryId = linkedValueDemandEntryId;
    }

    await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSaving(false);
    resetFormState();

    // Remove the saved entry and stay at the same index (next entry slides in)
    setEntries(prev => prev.filter((_, i) => i !== currentIndex));
    if (currentIndex >= entries.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  }

  function handleSkip() {
    resetFormState();
    if (currentIndex < entries.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  const cardCls = 'rounded-xl shadow-sm p-6 bg-white border border-gray-200';
  const inputCls = 'w-full px-4 py-3 rounded-lg text-base text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none';

  if (loading) return <div className="p-4 text-gray-500">{t('capture.loading')}</div>;
  if (!study) return <div className="p-4 text-red-600">{t('capture.studyNotFound')}</div>;

  const reclassifyLayer = study.activeLayer >= 4 ? 4 : study.activeLayer >= 3 ? 3 : study.activeLayer >= 2 ? 2 : 0;

  if (reclassifyLayer < 2) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`${cardCls} max-w-md text-center`}>
          <div className="text-4xl mb-3">&#x1F512;</div>
          <p className="text-gray-700 font-medium">{t('reclassify.layerNotActive')}</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`${cardCls} max-w-md text-center`}>
          <div className="text-4xl mb-3">&#10003;</div>
          <p className="text-gray-700 font-medium">{t('reclassify.complete')}</p>
        </div>
      </div>
    );
  }

  const entry = entries[currentIndex];
  const filteredDemandTypes = study.demandTypes.filter(dt => dt.category === classification) || [];

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">{t('reclassify.title')}</h1>
        <span className="text-sm px-3 py-1 rounded-full font-medium bg-amber-50 text-amber-700">
          {t('reclassify.remaining', { current: String(currentIndex + 1), total: String(entries.length) })}
        </span>
      </div>

      {/* Layer guidance */}
      <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs font-medium text-blue-800 mb-0.5">{t('reclassify.layerLabel', { layer: String(reclassifyLayer) })}</p>
        <p className="text-xs text-blue-700">{t(`reclassify.layerGuide${reclassifyLayer}` as TranslationKey)}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-[#ac2c2d] h-2 rounded-full transition-all"
          style={{ width: `${(currentIndex / Math.max(entries.length, 1)) * 100}%` }}
        />
      </div>

      {/* Demand card */}
      <div className={`${cardCls} mb-6`}>
        <div className="text-xs text-gray-400 mb-2">
          {new Date(entry.createdAt).toLocaleDateString()} {entry.collectorName && `- ${entry.collectorName}`}
        </div>
        <p className="text-lg text-gray-900 leading-relaxed">&ldquo;{entry.verbatim}&rdquo;</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {entry.classification !== 'unknown' && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              entry.classification === 'value' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {entry.classification === 'value' ? t('capture.value') : t('capture.failure')}
            </span>
          )}
          {entry.demandTypeId && (() => {
            const dt = study.demandTypes.find(d => d.id === entry.demandTypeId);
            return dt ? <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{tl(dt.label)}</span> : null;
          })()}
          {entry.contactMethodId && (() => {
            const cm = study.contactMethods.find(c => c.id === entry.contactMethodId);
            return cm ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{tl(cm.label)}</span> : null;
          })()}
          {entry.handlingTypeId && (() => {
            const ht = study.handlingTypes.find(h => h.id === entry.handlingTypeId);
            return ht ? <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">{tl(ht.label)}</span> : null;
          })()}
        </div>
      </div>

      {/* Layer 2: Classification */}
      {reclassifyLayer === 2 && (
        <div className="space-y-4 mb-6">
          <p className="text-sm font-medium text-gray-700">{t('reclassify.classifyAs')}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setClassification('value'); setDemandTypeId(''); }}
              className={`py-3 rounded-lg font-semibold text-base transition-all ${
                classification === 'value'
                  ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2'
                  : 'bg-green-50 text-green-700 border-2 border-green-200 hover:border-green-400'
              }`}
            >
              {t('capture.value')}
            </button>
            <button
              type="button"
              onClick={() => { setClassification('failure'); setDemandTypeId(''); }}
              className={`py-3 rounded-lg font-semibold text-base transition-all ${
                classification === 'failure'
                  ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2'
                  : 'bg-red-50 text-red-700 border-2 border-red-200 hover:border-red-400'
              }`}
            >
              {t('capture.failure')}
            </button>
          </div>

          {classification && classification !== 'unknown' && filteredDemandTypes.length > 0 && (
            <div>
              <select value={demandTypeId} onChange={(e) => setDemandTypeId(e.target.value)} className={inputCls}>
                <option value="">{t('capture.selectType')}</option>
                {filteredDemandTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>{tl(dt.label)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Handling */}
      {reclassifyLayer === 3 && (
        <div className="space-y-4 mb-6">
          <p className="text-sm font-medium text-gray-700">{t('reclassify.selectHandling')}</p>
          <div className="space-y-2">
            {study.handlingTypes.map((ht) => (
              <button
                key={ht.id}
                type="button"
                onClick={() => setHandlingTypeId(ht.id)}
                className={`w-full py-3 px-4 rounded-lg text-left font-medium text-base transition-all ${
                  handlingTypeId === ht.id
                    ? 'bg-[#ac2c2d] text-white ring-2 ring-[#ac2c2d] ring-offset-2'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-400'
                }`}
              >
                {tl(ht.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Layer 4: Link to value demand */}
      {reclassifyLayer === 4 && (
        <div className="space-y-4 mb-6">
          <p className="text-sm font-medium text-gray-700">{t('reclassify.linkToValue')}</p>
          <select value={linkedValueDemandEntryId} onChange={(e) => setLinkedValueDemandEntryId(e.target.value)} className={inputCls}>
            <option value="">{t('capture.searchValueDemands')}</option>
            {valueDemandEntries.map((ve) => (
              <option key={ve.id} value={ve.id}>
                {ve.verbatim.length > 60 ? ve.verbatim.slice(0, 60) + '...' : ve.verbatim}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSkip}
          className="flex-1 py-3 rounded-lg font-medium text-base text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {t('reclassify.skip')}
        </button>
        <button
          onClick={handleSaveAndNext}
          disabled={saving || (reclassifyLayer === 2 && !classification) || (reclassifyLayer === 3 && !handlingTypeId) || (reclassifyLayer === 4 && !linkedValueDemandEntryId)}
          className="flex-1 py-3 rounded-lg font-semibold text-base text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-[#ac2c2d] hover:bg-[#8a2324]"
        >
          {saving ? '...' : t('reclassify.saveNext')}
        </button>
      </div>
    </div>
  );
}
