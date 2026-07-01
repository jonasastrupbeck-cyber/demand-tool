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
  // 2026-06-18: the milestone this decision point belongs to.
  milestoneId?: string | null;
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

// 2026-06-18: a milestone (ordered container above decision points) and its
// per-case outcome.
export interface Milestone {
  id: string;
  label: string;
  sortOrder: number;
}

export interface CaseMilestone {
  id: string;
  milestoneId: string;
  outcome: 'achieved' | 'not_achieved';
  reachedAt: string;
}

interface Props {
  code: string;
  caseId: string;
  decisionPointTypes: DecisionPointType[];
  decisions: CaseDecision[];
  collectorName: string;
  /** Refetch the case (CasePanel.loadCase) after a save/delete. */
  onChanged: () => Promise<void> | void;
  // C5/R4 (2026-06-17): 'compact' (default) = the dotted-box tap-to-open cards
  // (stacked flow). 'overview' = freeze-pane right pane: each milestone's options
  // shown inline always; the date + Save appear only after an option is pressed.
  variant?: 'compact' | 'overview';
  // 2026-06-18: milestones group the decision points; the overview variant
  // renders them as an ordered, chronological stepper with its own outcome.
  milestones?: Milestone[];
  caseMilestones?: CaseMilestone[];
}

export default function CaseDecisionPoints({ code, caseId, decisionPointTypes, decisions, collectorName, onChanged, variant = 'compact', milestones = [], caseMilestones = [] }: Props) {
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

  // 2026-06-18: milestone-outcome form state (separate from the decision form).
  const [openMilestoneId, setOpenMilestoneId] = useState<string | null>(null);
  const [msOutcome, setMsOutcome] = useState<'achieved' | 'not_achieved' | ''>('');
  const [msReachedAt, setMsReachedAt] = useState('');
  const [msSaving, setMsSaving] = useState(false);
  // Per-milestone open/closed override (id → forced state). Absence = use the
  // default (only the first non-achieved milestone is open). Lets the consultant
  // expand a folded milestone to look inside, and fold an open one back.
  const [milestoneOverrides, setMilestoneOverrides] = useState<Record<string, boolean>>({});

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

  // Outcome is the defining field. Un-clicking it (deselect → '') on a SAVED
  // decision removes the decision entirely — and, for the person milestone,
  // reopens the case (handled in deleteCaseDecision). On an unsaved/in-progress
  // decision it just clears local state. Sub-fields (cleanliness / willingness /
  // ability) clear locally and re-persist on Save.
  function setOrClearOutcome(decision: CaseDecision | undefined, v: string) {
    if (v === '') {
      setOutcome('');
      if (decision) void remove(decision.id);
    } else {
      setOutcome(v as 'positive' | 'negative');
    }
  }

  // --- Milestone outcome (2026-06-18): achieved / not_achieved + reached date ---
  function openMilestoneForm(m: Milestone) {
    const rec = caseMilestones.find((r) => r.milestoneId === m.id);
    setOpenMilestoneId(m.id);
    setMsOutcome(rec?.outcome ?? '');
    setMsReachedAt((rec?.reachedAt ?? new Date().toISOString()).slice(0, 10));
  }

  async function saveMilestone(m: Milestone) {
    if (!msOutcome || msSaving) return;
    setMsSaving(true);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseId)}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        milestoneId: m.id,
        outcome: msOutcome,
        reachedAt: msReachedAt ? `${msReachedAt}T12:00:00.000Z` : undefined,
        recordedByCollector: collectorName || undefined,
      }),
    });
    if (res.ok) {
      setOpenMilestoneId(null);
      // Clear any manual override so this milestone reverts to default: once it
      // is 'achieved' it folds, and the next milestone becomes the open one.
      setMilestoneOverrides((o) => { const n = { ...o }; delete n[m.id]; return n; });
      await onChanged();
    }
    setMsSaving(false);
  }

  async function removeMilestone(recordId: string) {
    if (msSaving) return;
    setMsSaving(true);
    const rec = caseMilestones.find((r) => r.id === recordId);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(caseId)}/milestones/${encodeURIComponent(recordId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setOpenMilestoneId(null);
      if (rec) setMilestoneOverrides((o) => { const n = { ...o }; delete n[rec.milestoneId]; return n; });
      await onChanged();
    }
    setMsSaving(false);
  }

  // Un-clicking a saved milestone outcome removes it (and reopens the case if it
  // was 'not_achieved'); on an in-progress one it just clears local state.
  function setOrClearMsOutcome(rec: CaseMilestone | undefined, v: string) {
    if (v === '') {
      setMsOutcome('');
      if (rec) void removeMilestone(rec.id);
    } else {
      setMsOutcome(v as 'achieved' | 'not_achieved');
    }
  }

  if (decisionPointTypes.length === 0 && milestones.length === 0) return null;

  // C5/R4 (2026-06-17): freeze-pane overview — every milestone shows its options
  // inline (styled like the left pane's boxes); the date + Save/Remove appear
  // only once an outcome or cleanliness is pressed. Pressing any option focuses
  // that milestone (loads its saved values) so a single edit-state still drives
  // the form.
  // One decision-point card in the overview (options inline; date + Save appear
  // once an option is pressed). Extracted so milestone groups can render their
  // own decisions.
  const renderOverviewDecision = (type: DecisionPointType) => {
    const decision = decisions.find((d) => d.decisionPointTypeId === type.id);
    const isActive = openTypeId === type.id;
    const focus = () => { if (openTypeId !== type.id) openForm(type); };
    const vOutcome = isActive ? outcome : (decision?.outcome ?? '');
    const vClean = isActive ? cleanliness : (decision?.cleanliness ?? '');
    const vWilling = isActive ? willingnessToPay : boolToTri(decision?.willingnessToPay);
    const vAbility = isActive ? abilityToPay : boolToTri(decision?.abilityToPay);
    const showSave = isActive && (!!outcome || !!cleanliness);
    return (
      <div key={type.id} className="rounded-lg bg-white border border-gray-200 p-2 space-y-1.5">
        <p className="text-xs font-medium text-gray-800 text-center">{tl(type.label)}</p>
        {type.kind === 'person' && (
          <>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-gray-500">{t('capture.dpWillingnessToPay')}</span>
              <SegmentedToggle
                ariaLabel={t('capture.dpWillingnessToPay')}
                value={vWilling}
                compact
                allowDeselect
                onChange={(v) => { focus(); setWillingnessToPay(v as 'yes' | 'no' | ''); }}
                options={[
                  { value: 'no', label: t('capture.dpNo'), activeColor: 'red' },
                  { value: 'yes', label: t('capture.dpYes'), activeColor: 'green' },
                ]}
              />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-gray-500">{t('capture.dpAbilityToPay')}</span>
              <SegmentedToggle
                ariaLabel={t('capture.dpAbilityToPay')}
                value={vAbility}
                compact
                allowDeselect
                onChange={(v) => { focus(); setAbilityToPay(v as 'yes' | 'no' | ''); }}
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
            value={vOutcome}
            compact
            allowDeselect
            onChange={(v) => { focus(); setOrClearOutcome(decision, v); }}
            options={[
              { value: 'positive', label: tl(type.positiveLabel), activeColor: 'green' },
              { value: 'negative', label: tl(type.negativeLabel), activeColor: 'red' },
            ]}
          />
        </div>
        <div className="flex justify-center">
          <SegmentedToggle
            ariaLabel={t('capture.dpCleanlinessAria')}
            value={vClean}
            compact
            allowDeselect
            onChange={(v) => { focus(); setCleanliness(v as 'clean' | 'dirty' | ''); }}
            options={[
              { value: 'clean', label: t('capture.dpClean'), activeColor: 'green' },
              { value: 'dirty', label: t('capture.dpDirty'), activeColor: 'red' },
            ]}
          />
        </div>
        {isActive && cleanliness === 'dirty' && (
          <input
            type="text"
            value={dirtyCause}
            onChange={(e) => setDirtyCause(e.target.value)}
            placeholder={t('capture.dpDirtyCausePlaceholder')}
            aria-label={t('capture.dpDirtyCausePlaceholder')}
            className="w-full px-2 py-1 rounded-lg text-xs text-gray-900 placeholder-gray-400 bg-white border border-red-200 focus:ring-2 focus:ring-red-400 outline-none"
          />
        )}
        {showSave && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-center">
              <label className="flex items-center gap-1 text-[10px] text-gray-500">
                {t('capture.dpDecidedAtLabel')}
                <input
                  type="date"
                  value={decidedAt}
                  onChange={(e) => setDecidedAt(e.target.value)}
                  className="px-1.5 py-0.5 rounded text-[10px] text-gray-700 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
                />
              </label>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <button type="button" onClick={() => save(type)} disabled={!outcome || !cleanliness || saving} className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50 transition-colors">{t('settings.save')}</button>
              {decision && (
                <button type="button" onClick={() => remove(decision.id)} disabled={saving} className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors">{t('settings.remove')}</button>
              )}
              <button type="button" onClick={() => setOpenTypeId(null)} className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">{t('capture.dpCancel')}</button>
            </div>
          </div>
        )}
        {!isActive && decision && (
          <p className="text-[10px] text-gray-400 text-center">{new Date(decision.decidedAt).toLocaleDateString()}</p>
        )}
      </div>
    );
  };

  if (variant === 'overview') {
    const orderedMs = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder);
    // No milestones (legacy safety): fall back to a flat list of decisions.
    if (orderedMs.length === 0) {
      return <div className="space-y-2">{decisionPointTypes.map(renderOverviewDecision)}</div>;
    }
    const recFor = (mid: string) => caseMilestones.find((r) => r.milestoneId === mid);
    // Soft-lock: a milestone is locked once any EARLIER milestone isn't achieved.
    // Precomputed purely (no in-render mutation) — index i is locked if any
    // milestone before it lacks an 'achieved' record.
    const achievedIds = new Set(caseMilestones.filter((r) => r.outcome === 'achieved').map((r) => r.milestoneId));
    const lockedFlags = orderedMs.map((_, i) => orderedMs.slice(0, i).some((pm) => !achievedIds.has(pm.id)));
    // The one milestone open by default = the first that isn't achieved yet (the
    // "current" step). Achieved milestones fold to save space; the next opens
    // below. -1 when every milestone is achieved (all fold). This also gives the
    // cold-start "only the first is open" for free.
    const firstOpenIdx = orderedMs.findIndex((m) => recFor(m.id)?.outcome !== 'achieved');
    return (
      <div className="space-y-2">
        {orderedMs.map((m, idx) => {
          const rec = recFor(m.id);
          const achieved = rec?.outcome === 'achieved';
          const lockedByOrder = lockedFlags[idx];
          const types = decisionPointTypes.filter((d) => d.milestoneId === m.id).sort((a, b) => a.sortOrder - b.sortOrder);
          const defaultOpen = idx === firstOpenIdx;
          const isOpen = m.id in milestoneOverrides ? milestoneOverrides[m.id] : defaultOpen;
          const toggleOpen = (open: boolean) => setMilestoneOverrides((o) => ({ ...o, [m.id]: open }));

          if (!isOpen) {
            // Folded, clickable header. Achieved → green "done" chip (✓ + date);
            // locked → muted gray + 🔒; otherwise a neutral sky "+".
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleOpen(true)}
                aria-label={t('capture.milestoneExpand')}
                className={`w-full flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-left transition-colors ${achieved ? 'border-green-300 bg-green-50/70 hover:bg-green-100/70' : lockedByOrder ? 'border-dashed border-gray-200 bg-gray-50/60 opacity-70 hover:opacity-100' : 'border-sky-200 bg-sky-50/50 hover:bg-sky-100/50'}`}
              >
                <span className="shrink-0 w-4 text-[10px] text-gray-400 tabular-nums text-center">{idx + 1}</span>
                <span className={`flex-1 text-xs font-medium truncate ${achieved ? 'text-green-800' : 'text-gray-500'}`}>{m.label}</span>
                {achieved && rec && <span className="shrink-0 text-[10px] text-green-600 tabular-nums">{new Date(rec.reachedAt).toLocaleDateString()}</span>}
                <span className="shrink-0 text-[10px] text-gray-400">{achieved ? '✓' : lockedByOrder ? '🔒' : '+'}</span>
              </button>
            );
          }

          const isMsActive = openMilestoneId === m.id;
          const vMsOutcome = isMsActive ? msOutcome : (rec?.outcome ?? '');
          const showMsSave = isMsActive && !!msOutcome;
          const focusMs = () => { if (openMilestoneId !== m.id) openMilestoneForm(m); };
          return (
            <div key={m.id} className={`rounded-xl border-2 p-2 space-y-1.5 ${achieved ? 'border-green-300 bg-green-50/40' : lockedByOrder ? 'border-gray-200 bg-gray-50/60' : 'border-sky-200 bg-white'}`}>
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 w-4 text-[10px] text-gray-400 tabular-nums text-center">{idx + 1}</span>
                <p className="flex-1 text-xs font-semibold text-gray-800 truncate">{m.label}</p>
                <button type="button" onClick={() => toggleOpen(false)} aria-label={t('capture.milestoneCollapse')} className="shrink-0 text-[10px] text-gray-400 hover:text-gray-700 px-1 leading-none">▾</button>
              </div>
              {lockedByOrder && (
                <p className="text-[10px] text-amber-600 text-center px-1">{t('capture.milestoneLocked')}</p>
              )}
              <div className="flex justify-center">
                <SegmentedToggle
                  ariaLabel={t('capture.milestoneOutcomeAria')}
                  value={vMsOutcome}
                  compact
                  allowDeselect
                  onChange={(v) => { focusMs(); setOrClearMsOutcome(rec, v); }}
                  options={[
                    { value: 'achieved', label: t('capture.milestoneAchieved'), activeColor: 'green' },
                    { value: 'not_achieved', label: t('capture.milestoneNotAchieved'), activeColor: 'red' },
                  ]}
                />
              </div>
              {showMsSave && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-center">
                    <label className="flex items-center gap-1 text-[10px] text-gray-500">
                      {t('capture.milestoneReachedAtLabel')}
                      <input
                        type="date"
                        value={msReachedAt}
                        onChange={(e) => setMsReachedAt(e.target.value)}
                        className="px-1.5 py-0.5 rounded text-[10px] text-gray-700 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <button type="button" onClick={() => saveMilestone(m)} disabled={!msOutcome || msSaving} className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50 transition-colors">{t('settings.save')}</button>
                    {rec && (
                      <button type="button" onClick={() => removeMilestone(rec.id)} disabled={msSaving} className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors">{t('settings.remove')}</button>
                    )}
                    <button type="button" onClick={() => setOpenMilestoneId(null)} className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">{t('capture.dpCancel')}</button>
                  </div>
                </div>
              )}
              {!isMsActive && rec && (
                <p className="text-[10px] text-gray-400 text-center">{new Date(rec.reachedAt).toLocaleDateString()}</p>
              )}
              {types.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-gray-200/70">
                  {types.map(renderOverviewDecision)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

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
                        allowDeselect
                        onChange={(v) => setWillingnessToPay(v as 'yes' | 'no' | '')}
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
                        allowDeselect
                        onChange={(v) => setAbilityToPay(v as 'yes' | 'no' | '')}
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
                    allowDeselect
                    onChange={(v) => setOrClearOutcome(decision, v)}
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
                    allowDeselect
                    onChange={(v) => setCleanliness(v as 'clean' | 'dirty' | '')}
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
