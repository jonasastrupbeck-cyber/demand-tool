'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale-context';
import InlineTypeAdder from './InlineTypeAdder';
import CapabilityRadioGroup from './CapabilityRadioGroup';
import SegmentedToggle from './SegmentedToggle';

interface HandlingType { id: string; label: string; operationalDefinition?: string | null }
interface DemandType { id: string; category: 'value' | 'failure'; label: string }
interface ContactMethod { id: string; label: string }
interface PointOfTransaction { id: string; label: string }
interface WhatMattersType { id: string; label: string }
interface LifeProblem { id: string; label: string }
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
  oneStopHandlingType: string | null;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
  pointsOfTransaction: PointOfTransaction[];
  whatMattersTypes: WhatMattersType[];
  lifeProblems: LifeProblem[];
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
  lifeProblemId: string | null;
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
  const [systemConditions, setSystemConditions] = useState<{ id: string; dimension: 'helps' | 'hinders' }[]>([]);
  const [scPickerOpen, setScPickerOpen] = useState(false);
  const [thinkings, setThinkings] = useState<{ id: string; logic: string }[]>([]);
  const [thinkingPickerOpen, setThinkingPickerOpen] = useState(false);
  const [whatMattersNoteOpen, setWhatMattersNoteOpen] = useState(false);
  const [workBlocks, setWorkBlocks] = useState<{ tag: 'value' | 'failure'; text: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${entryId}`);
      if (!cancelled && res.ok) {
        const data = await res.json();
        setEntry(data.entry);
        setWhatMattersTypeIds(data.whatMattersTypeIds || []);
        setSystemConditions(Array.isArray(data.systemConditions) ? data.systemConditions : []);
        setThinkings(Array.isArray(data.thinkings) ? data.thinkings : []);
        setWorkBlocks(Array.isArray(data.workBlocks) ? data.workBlocks : []);
        // Auto-open the note disclosure if the field already has content.
        setWhatMattersNoteOpen(Boolean(data.entry?.whatMatters && data.entry.whatMatters.trim()));
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
      lifeProblemId: entry.lifeProblemId || null,
      whatMattersTypeIds,
      systemConditions,
      thinkings,
    };
    if (entry.entryType === 'work') {
      body.workBlocks = workBlocks.filter((b) => b.text.trim().length > 0);
    }
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
  // System conditions + Thinking visible on:
  //   - any failure entry
  //   - work + sequence
  //   - demand + value when a non-one-stop Capability is selected ("why not one stop?")
  const scVisible =
    entry?.classification === 'failure'
    || (entry?.entryType === 'work' && entry?.classification === 'sequence')
    || (
      entry?.entryType === 'demand'
      && entry?.classification === 'value'
      && !!entry?.handlingTypeId
      && entry?.handlingTypeId !== (study.oneStopHandlingType || '')
    );

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
            {/* Header: date + collector */}
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {(() => {
                  const createdAt = (entry as unknown as { createdAt?: string }).createdAt;
                  return createdAt ? new Date(createdAt).toLocaleDateString() : '';
                })()}
                {entry.collectorName ? ` — ${entry.collectorName}` : ''}
              </p>
              {/* Demand: verbatim read-only.
                  Work: block editor below; show legacy verbatim as read-only notice only when there are no blocks yet. */}
              {isDemand ? (
                <p className="text-base text-gray-900 leading-relaxed">&ldquo;{entry.verbatim}&rdquo;</p>
              ) : workBlocks.length === 0 && entry.verbatim && entry.verbatim.trim() ? (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{t('capture.legacyVerbatimNotice')}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{entry.verbatim}&rdquo;</p>
                </div>
              ) : null}
            </div>

            {/* Work tab: repeating Value/Failure blocks (replaces verbatim) */}
            {!isDemand && (
              <div>
                <label className={labelCls}>{t('capture.workBlocksLabel')}</label>
                <div className="space-y-2">
                  {workBlocks.map((b, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <SegmentedToggle
                          options={[
                            { value: 'value', label: t('capture.workBlockTagValue'), activeColor: 'green' },
                            { value: 'failure', label: t('capture.workBlockTagFailure'), activeColor: 'red' },
                          ]}
                          value={b.tag}
                          onChange={(v) => {
                            const tag = v === 'value' ? 'value' : 'failure';
                            setWorkBlocks((prev) => prev.map((p, i) => (i === idx ? { ...p, tag } : p)));
                          }}
                          ariaLabel={t('capture.workBlocksLabel')}
                        />
                        <button
                          type="button"
                          onClick={() => setWorkBlocks((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-gray-500 hover:text-gray-700"
                          aria-label="Remove"
                        >
                          &times;
                        </button>
                      </div>
                      <textarea
                        value={b.text}
                        onChange={(e) => {
                          const v = e.target.value;
                          setWorkBlocks((prev) => prev.map((p, i) => (i === idx ? { ...p, text: v } : p)));
                        }}
                        placeholder={t('capture.workBlockPlaceholder')}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWorkBlocks((prev) => [...prev, { tag: 'value', text: '' }])}
                    className="w-full py-2 rounded-lg text-sm font-medium text-gray-700 border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    {t('capture.addWorkBlockButton')}
                  </button>
                </div>
              </div>
            )}

            {/* Session context (Point of transaction + Contact method) — mirrors Capture's top strip */}
            {(study.pointsOfTransaction.length > 0 || study.contactMethods.length > 0) && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {study.pointsOfTransaction.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('capture.sessionPointOfTransactionLabel')}</label>
                      <select
                        value={entry.pointOfTransactionId || ''}
                        onChange={(e) => setEntry({ ...entry, pointOfTransactionId: e.target.value || null })}
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] outline-none"
                      >
                        <option value="">{t('capture.selectPointOfTransaction')}</option>
                        {study.pointsOfTransaction.map((pot) => (
                          <option key={pot.id} value={pot.id}>{tl(pot.label)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {study.contactMethods.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('capture.sessionContactMethodLabel')}</label>
                      <select
                        value={entry.contactMethodId || ''}
                        onChange={(e) => setEntry({ ...entry, contactMethodId: e.target.value || null })}
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] outline-none"
                      >
                        <option value="">{t('capture.selectContactMethod')}</option>
                        {study.contactMethods.map((cm) => (
                          <option key={cm.id} value={cm.id}>{tl(cm.label)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Classification — work gets an extra Sequence button */}
            {study.classificationEnabled && (() => {
              const options = isDemand
                ? (['value', 'failure', 'unknown'] as const)
                : (['value', 'sequence', 'failure', 'unknown'] as const);
              const tone = (c: 'value' | 'failure' | 'unknown' | 'sequence') =>
                c === 'value' ? { active: 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2', idle: 'bg-green-50 text-green-700 border border-green-200 hover:border-green-400' }
                : c === 'failure' ? { active: 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2', idle: 'bg-red-50 text-red-700 border border-red-200 hover:border-red-400' }
                : c === 'sequence' ? { active: 'bg-green-500 text-white ring-2 ring-green-500 ring-offset-2', idle: 'bg-green-50 text-green-700 border border-green-200 hover:border-green-400' }
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

            {/* Original value demand (failure demand only) — moved up */}
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

            {/* What matters multi-select (Value Demand only — per Vanguard Method, What Matters is captured against the original Value Demand). Stored values are preserved when hidden so reclassifying back restores them. */}
            {isDemand && entry.classification === 'value' && (
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

            {/* What matters note (Value Demand only) — collapsed by default, auto-opens if field has text */}
            {isDemand && entry.classification === 'value' && (
              (whatMattersNoteOpen || (entry.whatMatters && entry.whatMatters.trim())) ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls + ' mb-0'}>{t('capture.whatMattersLabel')}</label>
                    <button
                      type="button"
                      onClick={() => { setEntry({ ...entry, whatMatters: null }); setWhatMattersNoteOpen(false); }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {t('capture.hideNote')}
                    </button>
                  </div>
                  <textarea
                    value={entry.whatMatters || ''}
                    onChange={(e) => setEntry({ ...entry, whatMatters: e.target.value })}
                    placeholder={t('capture.whatMattersPlaceholder')}
                    rows={2}
                    className={inputCls}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setWhatMattersNoteOpen(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t('capture.addNote')}
                </button>
              )
            )}

            {/* Life problem to be solved — demand only, single-select dropdown */}
            {isDemand && (
              <div>
                <label className={labelCls}>{t('capture.lifeProblemLabel')}</label>
                <div className="flex gap-2">
                  <select
                    value={entry.lifeProblemId || ''}
                    onChange={(e) => setEntry({ ...entry, lifeProblemId: e.target.value || null })}
                    className={inputCls}
                  >
                    <option value="">{t('capture.lifeProblemPlaceholder')}</option>
                    {study.lifeProblems.map((lp) => (
                      <option key={lp.id} value={lp.id}>{tl(lp.label)}</option>
                    ))}
                  </select>
                  <InlineTypeAdder
                    code={code}
                    apiPath="life-problems"
                    onRefresh={onStudyRefresh}
                    onCreated={(id) => setEntry({ ...entry, lifeProblemId: id })}
                    compact
                  />
                </div>
              </div>
            )}

            {/* Capability of Response (formerly "Handling type") */}
            {study.handlingEnabled && (
              <div>
                <label className={labelCls}>{t('capture.handlingLabel')}</label>
                {study.handlingTypes.length > 0 ? (
                  <CapabilityRadioGroup
                    code={code}
                    options={study.handlingTypes}
                    value={entry.handlingTypeId || ''}
                    onChange={(id) => setEntry({ ...entry, handlingTypeId: id || null })}
                    trailing={
                      <InlineTypeAdder
                        code={code}
                        apiPath="handling-types"
                        onRefresh={onStudyRefresh}
                        onCreated={(id) => setEntry({ ...entry, handlingTypeId: id })}
                        compact
                      />
                    }
                  />
                ) : (
                  <InlineTypeAdder
                    code={code}
                    apiPath="handling-types"
                    onRefresh={onStudyRefresh}
                    onCreated={(id) => setEntry({ ...entry, handlingTypeId: id })}
                    compact
                  />
                )}
              </div>
            )}

            {/* System conditions OR failure-cause textarea — same slot, mirrors Capture.
                Phase 2 / Item 3: each SC carries Helps/Hinders dimension. */}
            {scVisible && (
              study.systemConditionsEnabled && study.systemConditions.length > 0 ? (
                <div>
                  <label className={labelCls}>{t('capture.systemConditionsLabel')}</label>
                  <p className="text-xs text-gray-500 -mt-1 mb-2">{t('capture.scDimensionHint')}</p>
                  <div className="space-y-2">
                    {systemConditions.map((entry, idx) => {
                      const def = study.systemConditions.find((x) => x.id === entry.id);
                      return (
                        <div key={entry.id} className="p-3 rounded-lg border border-red-200 bg-red-50 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                              {def ? tl(def.label) : entry.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSystemConditions((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-xs text-red-700 hover:text-red-900"
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
                              setSystemConditions((prev) => prev.map((p, i) => i === idx ? { ...p, dimension: dim } : p));
                            }}
                            ariaLabel={t('capture.systemConditionsLabel')}
                          />
                        </div>
                      );
                    })}
                    {scPickerOpen ? (
                      <div className="flex gap-2 items-center">
                        <select
                          value=""
                          onChange={(e) => {
                            const id = e.target.value;
                            if (id) {
                              setSystemConditions((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, { id, dimension: 'hinders' }]));
                              setScPickerOpen(false);
                            }
                          }}
                          className={inputCls}
                        >
                          <option value="">{t('capture.selectSystemCondition')}</option>
                          {study.systemConditions
                            .filter((sc) => !systemConditions.some((x) => x.id === sc.id))
                            .map((sc) => (
                              <option key={sc.id} value={sc.id}>{tl(sc.label)}</option>
                            ))}
                        </select>
                        <InlineTypeAdder
                          code={code}
                          apiPath="system-conditions"
                          onRefresh={onStudyRefresh}
                          onCreated={(id) => {
                            setSystemConditions((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, { id, dimension: 'hinders' }]));
                            setScPickerOpen(false);
                          }}
                          compact
                        />
                        <button
                          type="button"
                          onClick={() => setScPickerOpen(false)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          {t('reclassify.skip')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setScPickerOpen(true)}
                        className="text-sm text-red-700 hover:text-red-900 font-medium"
                      >
                        {t('capture.addSystemConditionButton')}
                      </button>
                    )}
                  </div>
                </div>
              ) : isFailure && isDemand ? (
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
              ) : null
            )}

            {/* Thinking + Logic — mirrors system conditions visibility */}
            {scVisible && study.systemConditionsEnabled && (
              <div>
                <label className={labelCls}>{t('capture.thinkingLabel')}</label>
                <div className="space-y-2">
                  {thinkings.map((th, idx) => {
                    const def = (study.thinkings || []).find((x) => x.id === th.id);
                    return (
                      <div key={th.id} className="p-3 rounded-lg border border-red-200 bg-red-50 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                            {def ? tl(def.label) : th.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => setThinkings((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-xs text-red-700 hover:text-red-900"
                          >
                            &times;
                          </button>
                        </div>
                        <textarea
                          value={th.logic}
                          onChange={(e) => {
                            const v = e.target.value;
                            setThinkings((prev) => prev.map((x, i) => (i === idx ? { ...x, logic: v } : x)));
                          }}
                          placeholder={t('capture.thinkingLogicPlaceholder')}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-red-200 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none"
                          aria-label={t('capture.thinkingLogicLabel')}
                        />
                      </div>
                    );
                  })}
                  {thinkingPickerOpen ? (
                    <div className="flex gap-2 items-center">
                      <select
                        value=""
                        onChange={(e) => {
                          const id = e.target.value;
                          if (id) {
                            setThinkings((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, { id, logic: '' }]));
                            setThinkingPickerOpen(false);
                          }
                        }}
                        className={inputCls}
                      >
                        <option value="">{t('capture.selectThinking')}</option>
                        {(study.thinkings || [])
                          .filter((th) => !thinkings.some((x) => x.id === th.id))
                          .map((th) => (
                            <option key={th.id} value={th.id}>{tl(th.label)}</option>
                          ))}
                      </select>
                      <InlineTypeAdder
                        code={code}
                        apiPath="thinkings"
                        onRefresh={onStudyRefresh}
                        onCreated={(id) => {
                          setThinkings((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, { id, logic: '' }]));
                          setThinkingPickerOpen(false);
                        }}
                        compact
                      />
                      <button
                        type="button"
                        onClick={() => setThinkingPickerOpen(false)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        {t('reclassify.skip')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setThinkingPickerOpen(true)}
                      className="text-sm text-red-700 hover:text-red-900 font-medium"
                    >
                      {t('capture.addThinkingButton')}
                    </button>
                  )}
                </div>
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
