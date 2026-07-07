'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale-context';
import InlineTypeAdder from './InlineTypeAdder';
import CapabilityRadioGroup from './CapabilityRadioGroup';
import SegmentedToggle from './SegmentedToggle';
import PillToggle from './PillToggle';
import { WORK_TAG_PILLS } from '@/lib/work-tag-pills';
import InfoPopover from './InfoPopover';
import PillSelect from './PillSelect';
import { localDay, localDayOf } from '@/lib/local-date';
import { useSyncedTopScrollbar, TopScrollbar } from '@/components/TopScrollbar';

// Per-block date (slice 2): LOCAL-day YYYY-MM-DD helpers for <input type="date">
// (must match the local-day display; see local-date.ts).
const todayIso = () => localDay();
const isoDay = (v?: string | null) => localDayOf(v);

// Stable client-side key for a work block (reconcile by identity, not array
// index — insert-before shifts indices). Not sent to the server.
let _blockKeySeq = 0;
const nextBlockKey = () => `wb${++_blockKeySeq}`;

interface HandlingType { id: string; label: string; operationalDefinition?: string | null }
interface DemandType { id: string; category: 'value' | 'failure'; label: string }
interface ContactMethod { id: string; label: string }
interface PointOfTransaction { id: string; label: string }
interface WhatMattersType { id: string; label: string; enabled?: boolean }
interface LifeProblem { id: string; label: string }
interface WorkType { id: string; label: string; category?: 'value' | 'failure' | 'sequence' }
interface SystemCondition { id: string; label: string; operationalDefinition?: string | null }
interface Thinking { id: string; label: string }

export interface EntryEditModalStudy {
  activeLayer: number;
  // System type (2026-06-12): drives the flow-work per-block SC picker.
  systemType?: 'transactional' | 'flow';
  classificationEnabled: boolean;
  handlingEnabled: boolean;
  valueLinkingEnabled: boolean;
  demandTypesEnabled: boolean;
  workTypesEnabled: boolean;
  workStepTypesEnabled: boolean;
  // Flow toggles (migration 0014).
  flowDemandEnabled: boolean;
  flowWorkEnabled: boolean;
  // Iterative-build toggles (migration 0013).
  whatMattersEnabled: boolean;
  thinkingsEnabled: boolean;
  lifeProblemsEnabled: boolean;
  systemConditionsEnabled: boolean;
  // Flow per-block failure-demand type picker (migration 0033, 2026-06-26).
  flowFailureDemandTypesEnabled: boolean;
  valueStepsEnabled: boolean;
  oneStopHandlingType: string | null;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
  pointsOfTransaction: PointOfTransaction[];
  whatMattersTypes: WhatMattersType[];
  lifeProblems: LifeProblem[];
  workTypes: WorkType[];
  workStepTypes: { id: string; label: string; tag: 'value' | 'sequence' | 'failure'; operationalDefinition: string | null; sortOrder: number }[];
  valueSteps: { id: string; label: string; sortOrder: number }[];
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
  // Case stitching (Skipton slice 1): read-only display in this modal.
  caseId: string | null;
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
  const [saveError, setSaveError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [entry, setEntry] = useState<EntryFull | null>(null);
  const [whatMattersTypeIds, setWhatMattersTypeIds] = useState<string[]>([]);
  // Attachment flags per SC — which of the 5 capture fields this SC is about.
  // Ali feedback 2026-04-16.
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
  // Per-migration-0012: dimension lives on the thinking, attachment is just a link.
  const [thinkings, setThinkings] = useState<{
    id: string;
    logic: string;
    dimension: 'helps' | 'hinders';
    scAttachments: { systemConditionId: string }[];
  }[]>([]);
  const [whatMattersNoteOpen, setWhatMattersNoteOpen] = useState(false);
  // Phase 4 (2026-04-16) — workStepTypeId + freeText flag; see capture/page.tsx for shape rationale.
  const [workBlocks, setWorkBlocks] = useState<{ _key: string; tag: 'value' | 'sequence' | 'failure' | 'failure_demand'; text: string; workStepTypeId: string | null; freeText: boolean; systemConditionIds: string[]; demandTypeId: string | null; valueStepId: string | null }[]>([]);
  // Synced top scrollbar for the (non-flow) work-block strip in the modal.
  const wbBar = useSyncedTopScrollbar([workBlocks.length]);
  // One date for the whole work entry (2026-07-02) — mirrors the capture composer.
  // Initialised from the entry on load; on save it's written to every block.
  const [entryDate, setEntryDate] = useState(todayIso());
  // Case stitching (Skipton slice 1): the case ref this entry belongs to,
  // looked up from caseId for read-only display. Re-assigning is a later slice.
  const [caseRef, setCaseRef] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${entryId}`);
      if (!cancelled && res.ok) {
        const data = await res.json();
        setEntry(data.entry);
        // Case stitching: resolve caseId → caseRef for the read-only chip.
        if (data.entry?.caseId) {
          fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(data.entry.caseId)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((c) => { if (!cancelled && c) setCaseRef(c.caseRef); })
            .catch(() => {});
        } else {
          setCaseRef(null);
        }
        setWhatMattersTypeIds(data.whatMattersTypeIds || []);
        // Normalise loaded SCs so callers can always read the 5 attachment
        // booleans. Older rows without attachment data default to attachesToDemand.
        setSystemConditions(Array.isArray(data.systemConditions) ? data.systemConditions.map((sc: Partial<ScAttachment> & { id: string; dimension: 'helps' | 'hinders' }) => {
          const hasAny = sc.attachesToLifeProblem || sc.attachesToDemand || sc.attachesToWhatMatters || sc.attachesToCor || sc.attachesToWork;
          return {
            id: sc.id,
            dimension: sc.dimension,
            attachesToLifeProblem: !!sc.attachesToLifeProblem,
            attachesToDemand:      hasAny ? !!sc.attachesToDemand : true,
            attachesToWhatMatters: !!sc.attachesToWhatMatters,
            attachesToCor:         !!sc.attachesToCor,
            attachesToWork:        !!sc.attachesToWork,
          };
        }) : []);
        // Normalise loaded thinkings: older rows may lack dimension (default hinders)
        // or scAttachments (default []).
        setThinkings(Array.isArray(data.thinkings)
          ? data.thinkings.map((t: { id: string; logic?: string; dimension?: string; scAttachments?: { systemConditionId: string }[] }) => ({
              id: t.id,
              logic: t.logic ?? '',
              dimension: t.dimension === 'helps' ? 'helps' as const : 'hinders' as const,
              scAttachments: Array.isArray(t.scAttachments)
                ? t.scAttachments.map((a) => ({ systemConditionId: a.systemConditionId }))
                : [],
            }))
          : []);
        // Normalise on load: workStepTypeId may be missing on older rows; freeText is
        // UI-only — derive it from whether the block has text but no step reference.
        setWorkBlocks(Array.isArray(data.workBlocks)
          ? data.workBlocks.map((b: { tag: 'value' | 'sequence' | 'failure' | 'failure_demand'; text: string; workStepTypeId?: string | null; systemConditionId?: string | null; systemConditionIds?: string[]; demandTypeId?: string | null; valueStepId?: string | null }) => ({
              _key: nextBlockKey(),
              tag: b.tag,
              text: b.text,
              workStepTypeId: b.workStepTypeId ?? null,
              freeText: !b.workStepTypeId && !!b.text,
              systemConditionIds: Array.isArray(b.systemConditionIds) ? b.systemConditionIds : (b.systemConditionId ? [b.systemConditionId] : []),
              demandTypeId: b.demandTypeId ?? null,
              valueStepId: b.valueStepId ?? null,
            }))
          : []);
        // The entry's single date = earliest block date (matches effectiveAt),
        // else the entry's createdAt, else today. Legacy multi-date entries
        // collapse to their earliest on the next save.
        const blockDays: string[] = Array.isArray(data.workBlocks)
          ? data.workBlocks.map((b: { blockDate?: string | null }) => isoDay(b.blockDate)).filter((d: string) => !!d)
          : [];
        const earliest = blockDays.length ? blockDays.reduce((m, d) => (d < m ? d : m)) : '';
        setEntryDate(earliest || isoDay((data.entry as { createdAt?: string } | undefined)?.createdAt) || todayIso());
        // Auto-open the note disclosure if the field already has content.
        setWhatMattersNoteOpen(Boolean(data.entry?.whatMatters && data.entry.whatMatters.trim()));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [code, entryId]);

  async function handleSave() {
    if (!entry || saving) return;
    setSaving(true);
    setSaveError('');
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
      // Strip the UI-only freeText flag before PATCH.
      body.workBlocks = workBlocks
        .filter((b) => b.text.trim().length > 0)
        .map(({ tag, text, workStepTypeId, systemConditionIds, demandTypeId, valueStepId }) => ({ tag, text, workStepTypeId, systemConditionIds, demandTypeId, valueStepId, date: entryDate }));
    }
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setSaveError(t('capture.saveFailed')); return; }
      onSaved?.();
      onClose();
    } catch {
      setSaveError(t('capture.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  // Delete this touch (mistake). Two-click confirm (no window.confirm). Reuses
  // the existing DELETE entry endpoint, then the same refetch path as save.
  async function handleDelete() {
    if (!entry || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${entryId}`, { method: 'DELETE' });
      if (!res.ok) { setSaveError(t('capture.saveFailed')); return; }
      onSaved?.();
      onClose();
    } catch {
      setSaveError(t('capture.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-lg text-base text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  const isDemand = entry?.entryType === 'demand';
  // Flow-mode work path (2026-06-12): per-block system condition picker.
  const flowWorkPath = study.systemType === 'flow' && !isDemand;
  const isFailure = entry?.classification === 'failure';
  // System conditions + Thinking are visible on every classified entry.
  // Per Ali feedback 2026-04-16: failure work can be hidden inside ANY
  // outcome — including value demands handled one-stop, and value work —
  // so SC + Thinking must be available wherever the Flow might contain
  // failure-work steps. Only hide when classification is unset or '?'.
  const scVisible = !!entry?.classification && entry?.classification !== 'unknown';

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
                {caseRef ? ` — ${t('reclassify.caseLabel')} #${caseRef}` : ''}
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

            {/* Session context (Point of transaction + Contact method) — mirrors Capture's top strip.
                Hidden in flow (2026-06-17): flow capture doesn't use the top strip, so it's legacy
                clutter in the flow edit window. */}
            {study.systemType !== 'flow' && (study.pointsOfTransaction.length > 0 || study.contactMethods.length > 0) && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {study.pointsOfTransaction.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('capture.sessionPointOfTransactionLabel')}</label>
                      <select
                        value={entry.pointOfTransactionId || ''}
                        onChange={(e) => setEntry({ ...entry, pointOfTransactionId: e.target.value || null })}
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
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
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
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

            {/* Classification — work gets an extra Sequence button. Hidden for
                flow work (2026-06-17): the class is derived from the V/S/F block
                tags, so the "classify this demand" row is legacy clutter here. */}
            {study.classificationEnabled && !flowWorkPath && (() => {
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
                          onClick={() => setEntry({ ...entry, classification: c, demandTypeId: null, workTypeId: null, failureCause: null, originalValueDemandTypeId: null })}
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

            {/* Demand type (demand entries) — header dropped; PillSelect placeholder carries the prompt. */}
            {isDemand && study.demandTypesEnabled && entry.classification !== 'unknown' && entry.classification !== 'sequence' && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex gap-2 items-center">
                  <PillSelect
                    ariaLabel={t('capture.demandTypeLabel', { classification: entry.classification === 'value' ? t('capture.value') : t('capture.failure') })}
                    placeholder={t('capture.demandTypeLabel', { classification: entry.classification === 'value' ? t('capture.value') : t('capture.failure') })}
                    value={entry.demandTypeId || ''}
                    onChange={(id) => setEntry({ ...entry, demandTypeId: id || null })}
                    options={study.demandTypes
                      .filter((dt) => dt.category === entry.classification)
                      .map((dt) => ({ id: dt.id, label: tl(dt.label) }))}
                    variant={entry.classification === 'value' ? 'value' : 'failure'}
                  />
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
                    {study.workTypes
                      // Filter by the entry's classification, like the capture form
                      // (a value entry shouldn't be assignable a failure work type).
                      // 'unknown' / missing category → show all (safe fallback).
                      .filter((wt) => entry.classification === 'unknown' || wt.category == null || wt.category === entry.classification)
                      .map((wt) => (
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

            {/* Original value demand (failure demand only) — header dropped; PillSelect
                placeholder carries the prompt. Green inline-add to match the positive strand. */}
            {isFailure && isDemand && study.valueLinkingEnabled && (
              <div className="flex gap-2 items-center justify-center">
                <PillSelect
                  ariaLabel={t('capture.originalValueDemandLabel')}
                  placeholder={t('capture.selectOriginalValueDemand')}
                  value={entry.originalValueDemandTypeId || ''}
                  onChange={(id) => setEntry({ ...entry, originalValueDemandTypeId: id || null })}
                  options={study.demandTypes.filter((dt) => dt.category === 'value').map((dt) => ({ id: dt.id, label: tl(dt.label) }))}
                  variant="value"
                />
                <InlineTypeAdder
                  code={code}
                  apiPath="demand-types"
                  extraBody={{ category: 'value' }}
                  onRefresh={onStudyRefresh}
                  onCreated={(id) => setEntry({ ...entry, originalValueDemandTypeId: id })}
                  compact
                  inputVariant="green"
                  inputPlaceholder={t('capture.typeInOriginalValueDemandPlaceholder')}
                />
              </div>
            )}

            {/* What matters multi-select (Value Demand only — per Vanguard Method, What Matters is captured against the original Value Demand). Stored values are preserved when hidden so reclassifying back restores them. */}
            {study.whatMattersEnabled && isDemand && (entry.classification === 'value' || !study.classificationEnabled) && (
              <div>
                <label className={labelCls}>{t('capture.whatMattersSelect')}</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {study.whatMattersTypes
                    // Disabled types stay hidden for new selection but keep
                    // their pill while selected on this entry (2026-07-02).
                    .filter((wm) => wm.enabled !== false || whatMattersTypeIds.includes(wm.id))
                    .map((wm) => {
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
                    inputVariant="green"
                    inputPlaceholder={t('capture.typeInWhatMattersPlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* What matters note (Value Demand only) — collapsed by default, auto-opens if field has text */}
            {study.whatMattersEnabled && isDemand && (entry.classification === 'value' || !study.classificationEnabled) && (
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

            {/* Life problem to be solved — demand only. Light-green pill (positive).
                Zero-state uses the "+ Life problem to be solved" green dashed pill. */}
            {study.lifeProblemsEnabled && isDemand && (
              <div>
                <div className="flex gap-2 items-center justify-center">
                  {study.lifeProblems.length > 0 && (
                    <PillSelect
                      ariaLabel={t('capture.lifeProblemLabel')}
                      placeholder={t('capture.lifeProblemLabel')}
                      value={entry.lifeProblemId || ''}
                      onChange={(id) => setEntry({ ...entry, lifeProblemId: id || null })}
                      options={study.lifeProblems.map((lp) => ({ id: lp.id, label: tl(lp.label) }))}
                      variant="valueLight"
                    />
                  )}
                  <InlineTypeAdder
                    code={code}
                    apiPath="life-problems"
                    onRefresh={onStudyRefresh}
                    onCreated={(id) => setEntry({ ...entry, lifeProblemId: id })}
                    compact={study.lifeProblems.length > 0}
                    pillLabel={study.lifeProblems.length === 0 ? t('capture.addLifeProblem') : undefined}
                    pillVariant="green"
                    inputVariant="green"
                    inputPlaceholder={t('capture.typeInLifeProblemPlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* Capability of Response (formerly "Handling type") */}
            {/* Capability of response — header dropped; '+ Capability of response'
                blue pill both trailing the radio group and standing alone in zero-state. */}
            {study.handlingEnabled && (
              <div>
                {study.systemType === 'flow' ? (
                  // Flow (2026-06-17): single COR dropdown pill, matching the composer.
                  <div className="flex justify-center">
                    <PillSelect
                      ariaLabel={t('capture.handlingLabel')}
                      placeholder={t('capture.addHandlingButton')}
                      value={entry.handlingTypeId || ''}
                      onChange={(id) => setEntry({ ...entry, handlingTypeId: id || null })}
                      options={study.handlingTypes.map((h) => ({ id: h.id, label: tl(h.label), operationalDefinition: h.operationalDefinition ? tl(h.operationalDefinition) : null }))}
                      variant="add"
                    />
                  </div>
                ) : study.handlingTypes.length > 0 ? (
                  <CapabilityRadioGroup
                    code={code}
                    options={study.handlingTypes}
                    value={entry.handlingTypeId || ''}
                    onChange={(id) => setEntry({ ...entry, handlingTypeId: id || null })}
                    leading={
                      <InlineTypeAdder
                        code={code}
                        apiPath="handling-types"
                        onRefresh={onStudyRefresh}
                        onCreated={(id) => setEntry({ ...entry, handlingTypeId: id })}
                        pillLabel={t('capture.addHandlingButton')}
                        pillVariant="sky"
                        inputVariant="sky"
                        inputPlaceholder={t('capture.typeInHandlingPlaceholder')}
                      />
                    }
                  />
                ) : (
                  <div className="flex justify-center">
                    <InlineTypeAdder
                      code={code}
                      apiPath="handling-types"
                      onRefresh={onStudyRefresh}
                      onCreated={(id) => setEntry({ ...entry, handlingTypeId: id })}
                      pillLabel={t('capture.addHandlingButton')}
                      pillVariant="sky"
                      inputVariant="sky"
                      inputPlaceholder={t('capture.typeInHandlingPlaceholder')}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Flow — opt-in per entry-type via flowDemandEnabled / flowWorkEnabled
                (migration 0014). Horizontal sequence of Value/Failure steps
                describing the work behind the Capability of Response. Matches the
                Capture form's Flow section (Ali mockup 2026-04-16). For flow
                studies the work steps always show (2026-06-17) — `flowWorkPath` —
                so editing a touch shows exactly the boxes that were captured. */}
            {((isDemand && study.flowDemandEnabled) || (!isDemand && study.flowWorkEnabled) || flowWorkPath) && (
              <div>
                <div className="flex items-center gap-3 pt-2 pb-0 mb-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] tracking-widest text-gray-400 font-medium inline-flex items-center gap-1">
                    {t('capture.strand.flow')}
                    <InfoPopover label={t('capture.strand.flow')}>
                      {t('capture.workClassificationHelp')}
                    </InfoPopover>
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                {/* Flow mode stacks blocks vertically (full-width) so the
                    per-block SC picker can expand below without clipping. */}
                <TopScrollbar bar={wbBar} className="-mx-1 px-1" />
                <div ref={wbBar.mainRef} onScroll={wbBar.onMainScroll} className={flowWorkPath ? '' : 'overflow-x-auto -mx-1 px-1 pb-2'}>
                  <div className={flowWorkPath ? 'space-y-2' : 'flex gap-2 items-stretch min-w-min'}>
                    {workBlocks.map((b, idx) => {
                      // Phase 4 — same three-mode decision as in capture/page.tsx.
                      const pickerOn = study.workStepTypesEnabled && (study.workStepTypes || []).length > 0;
                      const hasStep = !!b.workStepTypeId;
                      const step = hasStep ? (study.workStepTypes || []).find(s => s.id === b.workStepTypeId) : null;
                      const valueSteps = (study.workStepTypes || []).filter(s => s.tag === 'value');
                      const sequenceSteps = (study.workStepTypes || []).filter(s => s.tag === 'sequence');
                      const failureSteps = (study.workStepTypes || []).filter(s => s.tag === 'failure');
                      // failure_demand has no managed work-step types — free-text only.
                      const showFreeText = b.tag === 'failure_demand' || !pickerOn || (!hasStep && (b.freeText || b.text !== ''));
                      const showPicker = pickerOn && !hasStep && !showFreeText;
                      // Value step (migration 0047) — which value-journey stage
                      // this work relates to. One per step, any tag. One-line
                      // row (2026-07-04): label left, row-filling milestone-sky
                      // pill right, ABOVE the tag toggle in free-text mode,
                      // card bottom otherwise — mirrors capture/page.tsx.
                      const valueStepSelector = flowWorkPath && study.valueStepsEnabled && study.valueSteps.length > 0 ? (
                        <div className="flex items-center gap-1.5 p-1.5 rounded-md border bg-green-50 border-green-200">
                          <p className="shrink-0 text-[10px] font-medium text-gray-700">{t('capture.valueStepQuestion')}</p>
                          <div className="flex-1 min-w-0">
                            <PillSelect
                              ariaLabel={t('capture.valueStepQuestion')}
                              placeholder={t('capture.selectValueStep')}
                              value={b.valueStepId ?? ''}
                              onChange={(id) => setWorkBlocks((prev) => prev.map((p, i) => i === idx ? { ...p, valueStepId: id || null } : p))}
                              options={[...study.valueSteps].sort((a, c) => a.sortOrder - c.sortOrder).map((v) => ({ id: v.id, label: tl(v.label) }))}
                              variant="milestone"
                              compact
                              compactMenu
                              fullWidth
                            />
                          </div>
                        </div>
                      ) : null;
                      return (
                        <div key={b._key} className={`p-2 rounded-lg border border-gray-200 bg-gray-50 flex flex-col gap-2 ${flowWorkPath ? 'w-full' : `flex-none ${hasStep ? 'w-28' : 'min-w-[12rem] max-w-[18rem]'}`}`}>
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
                          {hasStep && step && (
                            <div className="flex items-start justify-between gap-1">
                              <span className={`flex-1 min-w-0 px-2 py-1 rounded text-xs font-medium whitespace-normal break-words leading-snug ${step.tag === 'value' ? 'bg-green-600 text-white' : step.tag === 'sequence' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>{tl(step.label)}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  aria-label={t('capture.workStepClearAria')}
                                  onClick={() => setWorkBlocks((prev) => prev.map((p, i) => i === idx ? { ...p, workStepTypeId: null, text: '' } : p))}
                                  className="text-gray-400 hover:text-gray-600 text-xs"
                                >&times;</button>
                              </div>
                            </div>
                          )}
                          {showPicker && (() => {
                            const tagSteps = b.tag === 'value' ? valueSteps : b.tag === 'sequence' ? sequenceSteps : b.tag === 'failure' ? failureSteps : [];
                            return (
                              <>
                                <div className="flex items-start justify-between gap-1">
                                  <PillToggle
                                    ariaLabel={t('capture.workBlocksLabel')}
                                    value={b.tag}
                                    onChange={(v) => setWorkBlocks((prev) => prev.map((p, i) => i !== idx ? p
                                      : v === 'failure_demand' ? { ...p, tag: 'failure_demand', workStepTypeId: null, freeText: true }
                                      // Clear SCs when re-tagging to 'value' (the SC box is hidden for value blocks).
                                      : { ...p, tag: v as 'value' | 'sequence' | 'failure', demandTypeId: null, systemConditionIds: v === 'value' ? [] : p.systemConditionIds }))}
                                    dense
                                    options={WORK_TAG_PILLS.map((p) => ({ value: p.value, label: t(p.labelKey), activeClassName: p.activeClassName }))}
                                  />
                                  <button
                                    type="button"
                                    aria-label="Remove"
                                    onClick={() => setWorkBlocks((prev) => prev.filter((_, i) => i !== idx))}
                                    className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1 mt-0.5"
                                  >&times;</button>
                                </div>
                                <ul className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-lg overflow-hidden">
                                  {tagSteps.length === 0 && (
                                    <li className="px-2 py-1.5 text-xs text-gray-400">—</li>
                                  )}
                                  {tagSteps.map((s) => (
                                    <li key={s.id}>
                                      <button
                                        type="button"
                                        onClick={() => setWorkBlocks((prev) => prev.map((p, i) => i === idx ? { ...p, workStepTypeId: s.id, tag: s.tag, text: tl(s.label), freeText: false, demandTypeId: null } : p))}
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
                                      onClick={() => setWorkBlocks((prev) => prev.map((p, i) => i === idx ? { ...p, workStepTypeId: null, text: '', freeText: true } : p))}
                                      className="w-full text-left px-2 py-1.5 text-xs text-sky-700 hover:bg-sky-50 transition-colors"
                                    >
                                      + {t('capture.workStepPickerFreeText').replace(/^[—-]\s*/, '')}
                                    </button>
                                  </li>
                                </ul>
                              </>
                            );
                          })()}
                          {showFreeText && !hasStep && (
                            <>
                              {/* Value step FIRST (2026-07-04) — mirrors the
                                  capture composer. */}
                              {valueStepSelector}
                              <div className="flex items-start justify-between gap-1">
                                <PillToggle
                                  ariaLabel={t('capture.workBlocksLabel')}
                                  value={b.tag}
                                  onChange={(v) => {
                                    const tag: 'value' | 'sequence' | 'failure' | 'failure_demand' = v === 'value' ? 'value' : v === 'sequence' ? 'sequence' : v === 'failure_demand' ? 'failure_demand' : 'failure';
                                    setWorkBlocks((prev) => prev.map((p, i) => (i === idx ? { ...p, tag, systemConditionIds: tag === 'value' ? [] : p.systemConditionIds, demandTypeId: tag === 'failure_demand' ? p.demandTypeId : null } : p)));
                                  }}
                                  dense
                                  options={WORK_TAG_PILLS.map((p) => ({ value: p.value, label: t(p.labelKey), activeClassName: p.activeClassName }))}
                                />
                                <button
                                  type="button"
                                  onClick={() => setWorkBlocks((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1 mt-0.5"
                                  aria-label="Remove"
                                >&times;</button>
                              </div>
                              <textarea
                                value={b.text}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setWorkBlocks((prev) => prev.map((p, i) => (i === idx ? { ...p, text: v } : p)));
                                }}
                                placeholder={b.tag === 'failure_demand' ? t('capture.failureDemandPlaceholder') : t('capture.workBlockPlaceholder')}
                                rows={4}
                                className="w-full px-2 py-1 rounded text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none resize-none flex-1"
                              />
                            </>
                          )}

                          {/* Per-block system condition (2026-06-12), flow-work only.
                              Chips for chosen SCs + an "add" dropdown to add more / create
                              new — same pattern as the capture composer. */}
                          {flowWorkPath && study.systemConditionsEnabled && (b.tag === 'sequence' || b.tag === 'failure' || b.tag === 'failure_demand') && (
                            <div className={`mt-1 p-1.5 rounded-md border ${(b.tag === 'failure' || b.tag === 'failure_demand') ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                              <p className="text-[10px] font-medium text-gray-700 mb-1">{t('capture.flowScQuestion')}</p>
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {b.systemConditionIds.map((scId) => {
                                  const sc = study.systemConditions.find((s) => s.id === scId);
                                  if (!sc) return null;
                                  return (
                                    <span key={scId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-200 text-sky-900 border border-sky-500">
                                      {tl(sc.label)}
                                      <button
                                        type="button"
                                        aria-label={t('capture.removeSystemCondition')}
                                        onClick={() => setWorkBlocks((prev) => prev.map((p, i) => i === idx ? { ...p, systemConditionIds: p.systemConditionIds.filter((x) => x !== scId) } : p))}
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
                                  options={study.systemConditions.filter((sc) => !b.systemConditionIds.includes(sc.id)).map((sc) => ({ id: sc.id, label: tl(sc.label) }))}
                                  onChange={(id) => setWorkBlocks((prev) => prev.map((p, i) => i === idx ? { ...p, systemConditionIds: p.systemConditionIds.includes(id) ? p.systemConditionIds : [...p.systemConditionIds, id] } : p))}
                                  compact
                                  compactMenu
                                />
                                <InlineTypeAdder
                                  code={code}
                                  apiPath="system-conditions"
                                  onRefresh={onStudyRefresh}
                                  onCreated={(id) => setWorkBlocks((prev) => prev.map((p, i) => i === idx ? { ...p, systemConditionIds: p.systemConditionIds.includes(id) ? p.systemConditionIds : [...p.systemConditionIds, id] } : p))}
                                  compact
                                />
                              </div>
                            </div>
                          )}
                          {/* Type of failure demand (migration 0033): a 'failure demand'
                              step IS a demand hitting you — capture WHAT KIND.
                              Mirrors the entry-level demand-type picker (category='failure').
                              Gated by the study opt-in. */}
                          {flowWorkPath && study.flowFailureDemandTypesEnabled && b.tag === 'failure_demand' && (
                            <div className="mt-1 p-1.5 rounded-md border bg-red-50 border-red-200">
                              <p className="text-[10px] font-medium text-gray-700 mb-1">{t('capture.demandTypeLabel', { classification: t('capture.failure').toLowerCase() })}</p>
                              <div className="flex gap-1.5 items-center">
                                <PillSelect
                                  ariaLabel={t('capture.demandTypeLabel', { classification: t('capture.failure').toLowerCase() })}
                                  placeholder={t('capture.selectType')}
                                  value={b.demandTypeId ?? ''}
                                  onChange={(id) => setWorkBlocks((prev) => prev.map((p, i) => i === idx ? { ...p, demandTypeId: id || null } : p))}
                                  options={study.demandTypes.filter((dt) => dt.category === 'failure').map((dt) => ({ id: dt.id, label: tl(dt.label) }))}
                                  variant="failureSoft"
                                  compact
                                  compactMenu
                                />
                                <InlineTypeAdder
                                  code={code}
                                  apiPath="demand-types"
                                  extraBody={{ category: 'failure' }}
                                  onRefresh={onStudyRefresh}
                                  onCreated={(id) => setWorkBlocks((prev) => prev.map((p, i) => i === idx ? { ...p, demandTypeId: id } : p))}
                                  compact
                                />
                              </div>
                            </div>
                          )}
                          {/* Value step in badge/picker modes (no textarea) —
                              keeps its old bottom slot; free-text mode renders
                              it above the textarea instead. */}
                          {!(showFreeText && !hasStep) && valueStepSelector}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setWorkBlocks((prev) => [...prev, { _key: nextBlockKey(), tag: 'value', text: '', workStepTypeId: null, freeText: false, systemConditionIds: [], demandTypeId: null, valueStepId: null }])}
                      aria-label={t('capture.addWorkBlockButton')}
                      className={`rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-brand hover:text-brand flex items-center justify-center ${flowWorkPath ? 'w-full py-2 text-sm font-medium' : 'flex-none w-16 text-2xl'}`}
                    >
                      {flowWorkPath ? t('capture.addWorkBlockButton') : '+'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* System conditions — gated on systemConditionsEnabled. When the toggle
                is off, nothing SC-related renders (no failure-cause fallback).
                Phase 2 / Item 3: each SC carries Helps/Hinders dimension. */}
            {scVisible && study.systemConditionsEnabled && (
                <div>
                  <div className="space-y-2">
                    {systemConditions.map((entry, idx) => {
                      const def = study.systemConditions.find((x) => x.id === entry.id);
                      const isHelps = entry.dimension === 'helps';
                      return (
                        <div key={entry.id} className={`p-3 rounded-lg border space-y-2 ${isHelps ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${isHelps ? 'bg-green-600' : 'bg-red-600'}`}>
                              {def ? tl(def.label) : entry.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSystemConditions((prev) => prev.filter((_, i) => i !== idx))}
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
                              setSystemConditions((prev) => prev.map((p, i) => i === idx ? { ...p, dimension: dim } : p));
                            }}
                            ariaLabel={t('capture.systemConditionsLabel')}
                          />
                          {/* Attachment chips (Ali 2026-04-16) */}
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
                                    onClick={() => setSystemConditions((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: !p[field] } : p))}
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
                    {/* One-click add: PillSelect in add variant. Click pill → popover
                        with available SCs drops immediately. Picking appends to the list. */}
                    {(() => {
                      const available = study.systemConditions.filter((sc) => !systemConditions.some((x) => x.id === sc.id));
                      const hasAnyTypes = study.systemConditions.length > 0;
                      return (
                        <div className="flex gap-2 items-center justify-center">
                          {available.length > 0 && (
                            <PillSelect
                              variant="add"
                              placeholder={t('capture.addSystemConditionButton')}
                              value=""
                              onChange={(id) => {
                                const defaultDim: 'helps' | 'hinders' = entry?.classification === 'value' ? 'helps' : 'hinders';
                                const isWork = entry?.entryType === 'work';
                                setSystemConditions((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, {
                                  id,
                                  dimension: defaultDim,
                                  attachesToLifeProblem: false,
                                  attachesToDemand: !isWork,
                                  attachesToWhatMatters: false,
                                  attachesToCor: false,
                                  attachesToWork: isWork,
                                }]));
                              }}
                              options={available.map((sc) => ({ id: sc.id, label: tl(sc.label) }))}
                            />
                          )}
                          <InlineTypeAdder
                            code={code}
                            apiPath="system-conditions"
                            onRefresh={onStudyRefresh}
                            onCreated={(id) => {
                              const defaultDim: 'helps' | 'hinders' = entry?.classification === 'value' ? 'helps' : 'hinders';
                              const isWork = entry?.entryType === 'work';
                              setSystemConditions((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, {
                                id,
                                dimension: defaultDim,
                                attachesToLifeProblem: false,
                                attachesToDemand: !isWork,
                                attachesToWhatMatters: false,
                                attachesToCor: false,
                                attachesToWork: isWork,
                              }]));
                            }}
                            compact={hasAnyTypes}
                            pillLabel={hasAnyTypes ? undefined : t('capture.addSystemConditionButton')}
                            inputVariant="sky"
                            inputPlaceholder={t('capture.typeInSystemConditionPlaceholder')}
                          />
                          <InfoPopover label={t('capture.systemConditionsLabel')}>
                            {t('capture.systemConditionsLabel')}
                          </InfoPopover>
                        </div>
                      );
                    })()}
                  </div>
                </div>
            )}

            {/* Thinking + Logic — mirrors system conditions visibility.
                 Header dropped; ⓘ next to the "+ Add thinking" pill carries the definition. */}
            {scVisible && study.thinkingsEnabled && (
              <div>
                <div className="space-y-2">
                  {thinkings.map((th, idx) => {
                    const def = (study.thinkings || []).find((x) => x.id === th.id);
                    const isHelps = th.dimension === 'helps';
                    return (
                      <div key={th.id} className={`p-3 rounded-lg border space-y-2 ${isHelps ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${isHelps ? 'bg-green-600' : 'bg-red-600'}`}>
                            {def ? tl(def.label) : th.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => setThinkings((prev) => prev.filter((_, i) => i !== idx))}
                            className={`text-xs ${isHelps ? 'text-green-700 hover:text-green-900' : 'text-red-700 hover:text-red-900'}`}
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
                          className={`w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border outline-none ${
                            isHelps
                              ? 'border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                              : 'border-red-200 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                          }`}
                          aria-label={t('capture.thinkingLogicLabel')}
                        />
                        {/* Helps/Hinders toggle for the whole thinking (migration 0012). */}
                        <SegmentedToggle
                          options={[
                            { value: 'hinders', label: t('capture.scHinders'), activeColor: 'red' },
                            { value: 'helps',   label: t('capture.scHelps'),   activeColor: 'green' },
                          ]}
                          value={th.dimension}
                          onChange={(v) => {
                            const dim: 'helps' | 'hinders' = v === 'helps' ? 'helps' : 'hinders';
                            setThinkings((prev) => prev.map((p, i) => i === idx ? { ...p, dimension: dim } : p));
                          }}
                          ariaLabel={t('capture.thinkingLabel')}
                        />
                        {/* SC attachment chips — migration 0011/0012. Simple on/off toggle;
                            the helps/hinders dimension lives on the thinking, not the chip. */}
                        {systemConditions.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">{t('capture.thinkingScAttachLabel')}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {systemConditions.map((scEntry) => {
                                const sc = study.systemConditions.find((s) => s.id === scEntry.id);
                                if (!sc) return null;
                                const attached = th.scAttachments.some((a) => a.systemConditionId === scEntry.id);
                                return (
                                  <button
                                    key={scEntry.id}
                                    type="button"
                                    onClick={() => {
                                      setThinkings((prev) => prev.map((p, i) => {
                                        if (i !== idx) return p;
                                        if (p.scAttachments.some((a) => a.systemConditionId === scEntry.id)) {
                                          return { ...p, scAttachments: p.scAttachments.filter((a) => a.systemConditionId !== scEntry.id) };
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
                  {/* One-click add: PillSelect in add variant. Click pill → popover
                      with available thinkings drops immediately. Picking appends to the list. */}
                  {(() => {
                    const available = (study.thinkings || []).filter((th) => !thinkings.some((x) => x.id === th.id));
                    const hasAnyTypes = (study.thinkings || []).length > 0;
                    return (
                      <div className="flex gap-2 items-center justify-center">
                        {available.length > 0 && (
                          <PillSelect
                            variant="thinking"
                            placeholder={t('capture.addThinkingButton')}
                            value=""
                            onChange={(id) => {
                              setThinkings((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, { id, logic: '', scAttachments: [], dimension: 'hinders' }]));
                            }}
                            options={available.map((th) => ({ id: th.id, label: tl(th.label) }))}
                          />
                        )}
                        <InlineTypeAdder
                          code={code}
                          apiPath="thinkings"
                          onRefresh={onStudyRefresh}
                          onCreated={(id) => {
                            setThinkings((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, { id, logic: '', scAttachments: [], dimension: 'hinders' }]));
                          }}
                          compact={hasAnyTypes}
                          pillLabel={hasAnyTypes ? undefined : t('capture.addThinkingButton')}
                          pillVariant="thinking"
                          inputVariant="thinking"
                          inputPlaceholder={t('capture.typeInThinkingPlaceholder')}
                        />
                        <InfoPopover label={t('capture.thinkingLabel')}>
                          {t('capture.thinkingLabel')}
                        </InfoPopover>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}


          </div>
        )}

        <div className="p-5 border-t border-gray-200 flex flex-col gap-3 sticky bottom-0 bg-white">
          {/* One date for the whole work entry (flow) — applied to every block on save. */}
          {flowWorkPath && (
            <label className="flex items-center justify-end gap-1.5">
              <span className="text-[11px] font-medium text-gray-500">{t('capture.workEntryDate')}</span>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="text-xs px-2 py-1 rounded border border-gray-300 bg-white focus:ring-2 focus:ring-brand focus:border-brand outline-none"
              />
            </label>
          )}
          {saveError && (
            <p className="text-sm text-red-600 mb-2 text-center">{saveError}</p>
          )}
          <div className="flex gap-3">
          {confirmingDelete ? (
            <button
              onClick={handleDelete}
              disabled={saving || !entry}
              className="shrink-0 px-4 py-3 rounded-lg font-semibold text-base text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {t('capture.deleteTouchConfirm')}
            </button>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={saving || loading || !entry}
              className="shrink-0 px-4 py-3 rounded-lg font-medium text-base text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {t('capture.deleteTouch')}
            </button>
          )}
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
            className="flex-1 py-3 rounded-lg font-semibold text-base text-white bg-brand hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? t('capture.saving') : isDemand ? t('capture.save') : t('capture.saveWork')}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
