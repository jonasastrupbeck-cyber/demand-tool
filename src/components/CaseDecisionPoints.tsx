'use client';

/**
 * CaseDecisionPoints — the Skipton "dotted box" (2026-06-12).
 *
 * The end-to-end decision points a case moves towards, reachable in ANY
 * order. Pending points render as dashed grey cards ("are we there yet?
 * no — still work to do"); decided points render solid green (positive) /
 * red (negative) with the date and a clean/dirty chip. Cleanliness is
 * captured HERE and only here — per-step dirtiness is too noisy (Skipton
 * req 7). Recording and editing are the same POST upsert; delete undoes.
 *
 * E2E times (decidedAt − case openedAt) feed the capability charts in a
 * later slice — this component only captures.
 */

import { useState } from 'react';
import { useLocale } from '@/lib/locale-context';
import SegmentedToggle from '@/components/SegmentedToggle';

export interface DecisionPointType {
  id: string;
  label: string;
  positiveLabel: string;
  negativeLabel: string;
  sortOrder: number;
  // C9 (2026-06-17): 'person' adds the Willingness/Ability-to-Pay sub-states.
  kind?: string | null;
}

export interface CaseDecision {
  id: string;
  decisionPointTypeId: string;
  outcome: 'positive' | 'negative';
  cleanliness: 'clean' | 'dirty';
  dirtyCause: string | null;
  decidedAt: string;
  // C9 (2026-06-17): affordability sub-states (person-kind milestones).
  willingnessToPay?: boolean | null;
  abilityToPay?: boolean | null;
}

interface Props {
  code: string;
  caseId: string;
  decisionPointTypes: DecisionPointType[];
  decisions: CaseDecision[];
  collectorName: string;
  /** Refetch the case (CasePanel.loadCase) after a save/delete. */
  onChanged: () => Promise<void> | void;
}

export default function CaseDecisionPoints({ code, caseId, decisionPointTypes, decisions, collectorName, onChanged }: Props) {
  const { t, tl } = useLocale();

  // The type whose mini-form is open; prefilled from its decision if decided.
  const [openTypeId, setOpenTypeId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<'positive' | 'negative' | ''>('');
  const [cleanliness, setCleanliness] = useState<'clean' | 'dirty' | ''>('');
  const [dirtyCause, setDirtyCause] = useState('');
  const [decidedAt, setDecidedAt] = useState('');
  // C9 (2026-06-17): affordability sub-states ('' = unset, 'yes'/'no').
  const [willingnessToPay, setWillingnessToPay] = useState<'yes' | 'no' | ''>('');
  const [abilityToPay, setAbilityToPay] = useState<'yes' | 'no' | ''>('');
  const [saving, setSaving] = useState(false);

  const boolToTri = (b: boolean | null | undefined): 'yes' | 'no' | '' => (b === true ? 'yes' : b === false ? 'no' : '');
  const triToBool = (v: 'yes' | 'no' | '') => (v === 'yes' ? true : v === 'no' ? false : null);

  function openForm(type: DecisionPointType) {
    const existing = decisions.find((d) => d.decisionPointTypeId === type.id);
    setOpenTypeId(type.id);
    setOutcome(existing?.outcome ?? '');
    setCleanliness(existing?.cleanliness ?? '');
    setDirtyCause(existing?.dirtyCause ?? '');
    setDecidedAt((existing?.decidedAt ?? new Date().toISOString()).slice(0, 10));
    setWillingnessToPay(boolToTri(existing?.willingnessToPay));
    setAbilityToPay(boolToTri(existing?.abilityToPay));
  }

  async function save(type: DecisionPointType) {
    if (!outcome || !cleanliness || saving) return;
    setSaving(true);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseId)}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decisionPointTypeId: type.id,
        outcome,
        cleanliness,
        dirtyCause: cleanliness === 'dirty' ? dirtyCause.trim() || undefined : undefined,
        decidedAt: decidedAt ? `${decidedAt}T12:00:00.000Z` : undefined,
        recordedByCollector: collectorName || undefined,
        // C9: only send pay sub-states for person-kind milestones.
        willingnessToPay: type.kind === 'person' ? triToBool(willingnessToPay) : undefined,
        abilityToPay: type.kind === 'person' ? triToBool(abilityToPay) : undefined,
      }),
    });
    if (res.ok) {
      setOpenTypeId(null);
      await onChanged();
    }
    setSaving(false);
  }

  async function remove(decisionId: string) {
    if (saving) return;
    setSaving(true);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseId)}/decisions/${encodeURIComponent(decisionId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setOpenTypeId(null);
      await onChanged();
    }
    setSaving(false);
  }

  if (decisionPointTypes.length === 0) return null;

  return (
    // The literal dotted box from Ali's wireframe.
    <div className="mt-2 rounded-xl border-2 border-dashed border-gray-300 p-2">
      <div className="flex flex-wrap justify-center gap-2">
        {decisionPointTypes.map((type) => {
          const decision = decisions.find((d) => d.decisionPointTypeId === type.id);
          const isFormOpen = openTypeId === type.id;

          if (isFormOpen) {
            return (
              <div key={type.id} className="w-full p-2 rounded-lg bg-white border border-gray-300 space-y-2">
                <p className="text-sm font-medium text-gray-800 text-center">{tl(type.label)}</p>
                {/* C9 (2026-06-17): affordability sub-states feed the person
                    decision — Willingness to Pay, then Ability to Pay. */}
                {type.kind === 'person' && (
                  <>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{t('capture.dpWillingnessToPay')}</span>
                      <SegmentedToggle
                        ariaLabel={t('capture.dpWillingnessToPay')}
                        value={willingnessToPay}
                        onChange={(v) => setWillingnessToPay(v as 'yes' | 'no')}
                        options={[
                          { value: 'no', label: t('capture.dpNo'), activeColor: 'red' },
                          { value: 'yes', label: t('capture.dpYes'), activeColor: 'green' },
                        ]}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{t('capture.dpAbilityToPay')}</span>
                      <SegmentedToggle
                        ariaLabel={t('capture.dpAbilityToPay')}
                        value={abilityToPay}
                        onChange={(v) => setAbilityToPay(v as 'yes' | 'no')}
                        options={[
                          { value: 'no', label: t('capture.dpNo'), activeColor: 'red' },
                          { value: 'yes', label: t('capture.dpYes'), activeColor: 'green' },
                        ]}
                      />
                    </div>
                  </>
                )}
                <div className="flex justify-center">
                  <SegmentedToggle
                    ariaLabel={t('capture.dpOutcomeAria')}
                    value={outcome}
                    onChange={(v) => setOutcome(v as 'positive' | 'negative')}
                    options={[
                      { value: 'positive', label: tl(type.positiveLabel), activeColor: 'green' },
                      { value: 'negative', label: tl(type.negativeLabel), activeColor: 'red' },
                    ]}
                  />
                </div>
                <div className="flex justify-center">
                  <SegmentedToggle
                    ariaLabel={t('capture.dpCleanlinessAria')}
                    value={cleanliness}
                    onChange={(v) => setCleanliness(v as 'clean' | 'dirty')}
                    options={[
                      { value: 'clean', label: t('capture.dpClean'), activeColor: 'green' },
                      { value: 'dirty', label: t('capture.dpDirty'), activeColor: 'red' },
                    ]}
                  />
                </div>
                {cleanliness === 'dirty' && (
                  <input
                    type="text"
                    value={dirtyCause}
                    onChange={(e) => setDirtyCause(e.target.value)}
                    placeholder={t('capture.dpDirtyCausePlaceholder')}
                    aria-label={t('capture.dpDirtyCausePlaceholder')}
                    className="w-full px-3 py-1.5 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white border border-red-200 focus:ring-2 focus:ring-red-400 outline-none"
                  />
                )}
                <div className="flex items-center justify-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    {t('capture.dpDecidedAtLabel')}
                    <input
                      type="date"
                      value={decidedAt}
                      onChange={(e) => setDecidedAt(e.target.value)}
                      className="px-2 py-1 rounded-lg text-xs text-gray-700 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => save(type)}
                    disabled={!outcome || !cleanliness || saving}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50 transition-colors"
                  >
                    {t('settings.save')}
                  </button>
                  {decision && (
                    <button
                      type="button"
                      onClick={() => remove(decision.id)}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      {t('settings.remove')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenTypeId(null)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {t('capture.dpCancel')}
                  </button>
                </div>
              </div>
            );
          }

          if (!decision) {
            // Pending: "are we there yet? No — still work to do."
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => openForm(type)}
                className="px-3 py-2 rounded-lg text-xs font-medium border border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors"
              >
                {tl(type.label)} +
              </button>
            );
          }

          const positive = decision.outcome === 'positive';
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => openForm(type)}
              title={decision.dirtyCause || undefined}
              className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                positive
                  ? 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                  : 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              <span className="block font-semibold">{tl(type.label)}</span>
              <span className="flex items-center gap-1.5 mt-0.5">
                {positive ? tl(type.positiveLabel) : tl(type.negativeLabel)}
                <span className="text-gray-400">·</span>
                {new Date(decision.decidedAt).toLocaleDateString()}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] border ${
                  decision.cleanliness === 'clean'
                    ? 'border-green-300 bg-white text-green-700'
                    : 'border-red-300 bg-white text-red-700'
                }`}>
                  {decision.cleanliness === 'clean' ? t('capture.dpClean') : t('capture.dpDirty')}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
