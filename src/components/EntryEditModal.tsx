'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale-context';
import InlineTypeAdder from './InlineTypeAdder';

interface HandlingType { id: string; label: string }
interface DemandType { id: string; category: 'value' | 'failure'; label: string }
interface ContactMethod { id: string; label: string }
interface PointOfTransaction { id: string; label: string }
interface WhatMattersType { id: string; label: string }
interface WorkType { id: string; label: string }
interface SystemCondition { id: string; label: string }
interface Thinking { id: string; label: string }

export interface EntryEditModalStudy {
  activeLayer: number;
  classificationEnabled: boolean;
  handlingEnabled: boolean;
  valueLinkingEnabled: boolean;
  demandTypesEnabled: boolean;
  workTypesEnabled: boolean;
  systemConditionsEnabled: boolean;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
  pointsOfTransaction: PointOfTransaction[];
  whatMattersTypes: WhatMattersType[];
  workTypes: WorkType[];
  systemConditions: SystemCondition[];
  thinkings: Thinking[];
}

interface EntryFull {
  id: string;
  verbatim: string;
  classification: 'value' | 'failure' | 'unknown' | 'sequence';
  entryType: 'demand' | 'work';
  demandTypeId: string | null;
  handlingTypeId: string | null;
  contactMethodId: string | null;
  pointOfTransactionId: string | null;
  workTypeId: string | null;
  originalValueDemandTypeId: string | null;
  linkedValueDemandEntryId: string | null;
  failureCause: string | null;
  whatMatters: string | null;
  collectorName: string | null;
}

interface Props {
  code: string;
  entryId: string;
  study: EntryEditModalStudy;
  onClose: () => void;
  onSaved?: () => void;
  onStudyRefresh?: () => Promise<void> | void;
}

export default function EntryEditModal({ code, entryId, study, onClose, onSaved, onStudyRefresh }: Props) {
  const { t, tl } = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState<EntryFull | null>(null);
  const [whatMattersTypeIds, setWhatMattersTypeIds] = useState<string[]>([]);
  const [systemConditionIds, setSystemConditionIds] = useState<string[]>([]);
  const [thinkingIds, setThinkingIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${entryId}`);
      if (!cancelled && res.ok) {
        const data = await res.json();
        setEntry(data.entry);
        setWhatMattersTypeIds(data.whatMattersTypeIds || []);
        setSystemConditionIds(data.systemConditionIds || []);
        setThinkingIds(data.thinkingIds || []);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [code, entryId]);

  async function handleSave() {
    if (!entry) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      classification: entry.classification,
      demandTypeId: entry.demandTypeId || null,
      handlingTypeId: entry.handlingTypeId || null,
      contactMethodId: entry.contactMethodId || null,
      pointOfTransactionId: entry.pointOfTransactionId || null,
      workTypeId: entry.workTypeId || null,
      originalValueDemandTypeId: entry.originalValueDemandTypeId || null,
      failureCause: entry.failureCause || null,
      whatMatters: entry.whatMatters || null,
      whatMattersTypeIds,
      systemConditionIds,
      thinkingIds,
    };
    await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    onSaved?.();
    onClose();
  }

  const inputCls = 'w-full px-4 py-3 rounded-lg text-base text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  const isDemand = entry?.entryType === 'demand';
  const isFailure = entry?.classification === 'failure';
  // System conditions + Thinking visible on failure (all) and on sequence (work only).
  const scVisible = (entry?.classification === 'failure') || (entry?.entryType === 'work' && entry?.classification === 'sequence');

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">{t('reclassify.editEntry')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {loading || !entry ? (
          <div className="p-6 text-gray-500">{t('capture.loading')}</div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Verbatim (read-only) */}
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {new Date((entry as unknown as { createdAt?: string }).createdAt || Date.now()).toLocaleDateString()}
                {entry.collectorName ? ` — ${entry.collectorName}` : ''}
              </p>
              <p className="text-base text-gray-900 leading-relaxed">&ldquo;{entry.verbatim}&rdquo;</p>
            </div>

            {/* Classification — work gets an extra Sequence button */}
            {study.classificationEnabled && (() => {
              const options = isDemand
                ? (['value', 'failure', 'unknown'] as const)
                : (['value', 'sequence', 'failure', 'unknown'] as const);
              const tone = (c: 'value' | 'failure' | 'unknown' | 'sequence') =>
                c === 'value' ? { active: 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2', idle: 'bg-green-50 text-green-700 border border-green-200 hover:border-green-400' }
                : c === 'failure' ? { active: 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2', idle: 'bg-red-50 text-red-700 border border-red-200 hover:border-red-400' }
                : c === 'sequence' ? { active: 'bg-orange-500 text-white ring-2 ring-orange-500 ring-offset-2', idle: 'bg-orange-50 text-orange-700 border border-orange-200 hover:border-orange-400' }
                : { active: 'bg-gray-600 text-white ring-2 ring-gray-600 ring-offset-2', idle: 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-400' };
              const label = (c: 'value' | 'failure' | 'unknown' | 'sequence') =>
                c === 'value' ? (isDemand ? t('capture.value') : t('capture.classificationWorkValue'))
                : c === 'failure' ? (isDemand ? t('capture.failure') : t('capture.classificationWorkFailure'))
                : c === 'sequence' ? t('capture.classificationWorkSequence')
                : '?';
              return (
                <div>
                  <label className={labelCls}>{t('reclassify.classifyAs')}</label>
                  <div className={`grid ${isDemand ? 'grid-cols-3' : 'grid-cols-4'} gap-2`}>
                    {options.map((c) => {
                      const t1 = tone(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEntry({ ...entry, classification: c, demandTypeId: null })}
                          className={`py-2 rounded-lg font-semibold text-sm transition-all ${entry.classification === c ? t1.active : t1.idle}`}
                        >
                          {label(c)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Demand type (demand entries) */}
            {isDemand && study.demandTypesEnabled && entry.classification !== 'unknown' && entry.classification !== 'sequence' && (
              <div>
                <label className={labelCls}>{t('capture.demandTypeLabel', { classification: entry.classification === 'value' ? t('capture.value') : t('capture.failure') })}</label>
                <div className="flex gap-2">
                  <select
                    value={entry.demandTypeId || ''}
                    onChange={(e) => setEntry({ ...entry, demandTypeId: e.target.value || null })}
                    className={inputCls}
                  >
                    <option value="">{t('capture.selectType')}</option>
                    {study.demandTypes
                      .filter((dt) => dt.category === entry.classification)
                      .map((dt) => (
                        <option key={dt.id} value={dt.id}>{tl(dt.label)}</option>
                      ))}
                  </select>
                  <InlineTypeAdder
                    code={code}
                    apiPath="demand-types"
                    extraBody={{ category: entry.classification as string }}
                    onRefresh={onStudyRefresh}
                    onCreated={(id) => setEntry({ ...entry, demandTypeId: id })}
                    compact
                  />
                </div>
              </div>
            )}

            {/* Work type (work entries) */}
            {!isDemand && study.workTypesEnabled && (
              <div>
                <label className={labelCls}>{t('capture.workTypeLabel')}</label>
                <div className="flex gap-2">
                  <select
                    value={entry.workTypeId || ''}
                    onChange={(e) => setEntry({ ...entry, workTypeId: e.target.value || null })}
                    className={inputCls}
                  >
                    <option value="">{t('capture.selectWorkType')}</option>
                    {study.workTypes.map((wt) => (
                      <option key={wt.id} value={wt.id}>{tl(wt.label)}</option>
                    ))}
                  </select>
                  <InlineTypeAdder
                    code={code}
                    apiPath="work-types"
                    onRefresh={onStudyRefresh}
                    onCreated={(id) => setEntry({ ...entry, workTypeId: id })}
                    compact
                  />
                </div>
              </div>
            )}

            {/* Handling type */}
            {study.handlingEnabled && (
              <div>
                <label className={labelCls}>{t('capture.handlingLabel')}</label>
                <div className="flex gap-2">
                  <select
                    value={entry.handlingTypeId || ''}
                    onChange={(e) => setEntry({ ...entry, handlingTypeId: e.target.value || null })}
                    className={inputCls}
                  >
                    <option value="">{t('capture.selectHandling')}</option>
                    {study.handlingTypes.map((ht) => (
                      <option key={ht.id} value={ht.id}>{tl(ht.label)}</option>
                    ))}
                  </select>
                  <InlineTypeAdder
                    code={code}
                    apiPath="handling-types"
                    onRefresh={onStudyRefresh}
                    onCreated={(id) => setEntry({ ...entry, handlingTypeId: id })}
                    compact
                  />
                </div>
              </div>
            )}

            {/* Contact method */}
            <div>
              <label className={labelCls}>{t('capture.contactMethodLabel')}</label>
              <div className="flex gap-2">
                <select
                  value={entry.contactMethodId || ''}
                  onChange={(e) => setEntry({ ...entry, contactMethodId: e.target.value || null })}
                  className={inputCls}
                >
                  <option value="">{t('capture.selectContactMethod')}</option>
                  {study.contactMethods.map((cm) => (
                    <option key={cm.id} value={cm.id}>{tl(cm.label)}</option>
                  ))}
                </select>
                <InlineTypeAdder
                  code={code}
                  apiPath="contact-methods"
                  onRefresh={onStudyRefresh}
                  onCreated={(id) => setEntry({ ...entry, contactMethodId: id })}
                  compact
                />
              </div>
            </div>

            {/* Point of transaction */}
            <div>
              <label className={labelCls}>{t('capture.pointOfTransactionLabel')}</label>
              <div className="flex gap-2">
                <select
                  value={entry.pointOfTransactionId || ''}
                  onChange={(e) => setEntry({ ...entry, pointOfTransactionId: e.target.value || null })}
                  className={inputCls}
                >
                  <option value="">{t('capture.selectPointOfTransaction')}</option>
                  {study.pointsOfTransaction.map((pot) => (
                    <option key={pot.id} value={pot.id}>{tl(pot.label)}</option>
                  ))}
                </select>
                <InlineTypeAdder
                  code={code}
                  apiPath="points-of-transaction"
                  onRefresh={onStudyRefresh}
                  onCreated={(id) => setEntry({ ...entry, pointOfTransactionId: id })}
                  compact
                />
              </div>
            </div>

            {/* System conditions — failure (all) or sequence (work only) */}
            {scVisible && study.systemConditionsEnabled && (
              <div>
                <label className={labelCls}>{t('capture.systemConditionsLabel')}</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {study.systemConditions.map((sc) => {
                    const selected = systemConditionIds.includes(sc.id);
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() =>
                          setSystemConditionIds((prev) =>
                            selected ? prev.filter((id) => id !== sc.id) : [...prev, sc.id]
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selected
                            ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-1'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:border-red-400'
                        }`}
                      >
                        {tl(sc.label)}
                      </button>
                    );
                  })}
                  <InlineTypeAdder
                    code={code}
                    apiPath="system-conditions"
                    onRefresh={onStudyRefresh}
                    onCreated={(id) => setSystemConditionIds((prev) => [...prev, id])}
                    compact
                  />
                </div>
              </div>
            )}

            {/* Thinking — mirrors system conditions visibility */}
            {scVisible && study.systemConditionsEnabled && (
              <div>
                <label className={labelCls}>{t('capture.thinkingLabel')}</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {(study.thinkings || []).map((th) => {
                    const selected = thinkingIds.includes(th.id);
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() =>
                          setThinkingIds((prev) =>
                            selected ? prev.filter((id) => id !== th.id) : [...prev, th.id]
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selected
                            ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-1'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:border-red-400'
                        }`}
                      >
                        {tl(th.label)}
                      </button>
                    );
                  })}
                  <InlineTypeAdder
                    code={code}
                    apiPath="thinkings"
                    onRefresh={onStudyRefresh}
                    onCreated={(id) => setThinkingIds((prev) => [...prev, id])}
                    compact
                  />
                </div>
              </div>
            )}

            {/* Failure cause (failure demand only) */}
            {isFailure && isDemand && (
              <div>
                <label className={labelCls}>{t('capture.failureCauseLabel')}</label>
                <textarea
                  value={entry.failureCause || ''}
                  onChange={(e) => setEntry({ ...entry, failureCause: e.target.value })}
                  placeholder={t('capture.failureCausePlaceholder')}
                  rows={2}
                  className={inputCls}
                />
              </div>
            )}

            {/* Original value demand (failure demand only) */}
            {isFailure && isDemand && study.valueLinkingEnabled && (
              <div>
                <label className={labelCls}>{t('capture.originalValueDemandLabel')}</label>
                <div className="flex gap-2">
                  <select
                    value={entry.originalValueDemandTypeId || ''}
                    onChange={(e) => setEntry({ ...entry, originalValueDemandTypeId: e.target.value || null })}
                    className={inputCls}
                  >
                    <option value="">{t('capture.selectOriginalValueDemand')}</option>
                    {study.demandTypes.filter((dt) => dt.category === 'value').map((dt) => (
                      <option key={dt.id} value={dt.id}>{tl(dt.label)}</option>
                    ))}
                  </select>
                  <InlineTypeAdder
                    code={code}
                    apiPath="demand-types"
                    extraBody={{ category: 'value' }}
                    onRefresh={onStudyRefresh}
                    onCreated={(id) => setEntry({ ...entry, originalValueDemandTypeId: id })}
                    compact
                  />
                </div>
              </div>
            )}

            {/* What matters multi-select (demand only) */}
            {isDemand && (
              <div>
                <label className={labelCls}>{t('capture.whatMattersSelect')}</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {study.whatMattersTypes.map((wm) => {
                    const selected = whatMattersTypeIds.includes(wm.id);
                    return (
                      <button
                        key={wm.id}
                        type="button"
                        onClick={() =>
                          setWhatMattersTypeIds((prev) =>
                            selected ? prev.filter((id) => id !== wm.id) : [...prev, wm.id]
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selected
                            ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1'
                            : 'bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400'
                        }`}
                      >
                        {tl(wm.label)}
                      </button>
                    );
                  })}
                  <InlineTypeAdder
                    code={code}
                    apiPath="what-matters-types"
                    onRefresh={onStudyRefresh}
                    onCreated={(id) => setWhatMattersTypeIds((prev) => [...prev, id])}
                    compact
                  />
                </div>
              </div>
            )}

            {/* What matters free text (demand only) */}
            {isDemand && (
              <div>
                <label className={labelCls}>{t('capture.whatMattersLabel')}</label>
                <textarea
                  value={entry.whatMatters || ''}
                  onChange={(e) => setEntry({ ...entry, whatMatters: e.target.value })}
                  placeholder={t('capture.whatMattersPlaceholder')}
                  rows={2}
                  className={inputCls}
                />
              </div>
            )}
          </div>
        )}

        <div className="p-5 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 rounded-lg font-medium text-base text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {t('reclassify.skip')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !entry}
            className="flex-1 py-3 rounded-lg font-semibold text-base text-white bg-[#ac2c2d] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? t('capture.saving') : t('capture.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
