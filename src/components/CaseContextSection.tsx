'use client';

/**
 * CaseContextSection — the person context of a case in a flow-based system
 * (slice B, 2026-06-11). Per Ali's wireframe the case entry carries:
 * Context & Situation, the problem to be solved (P2BS), and What Matters —
 * the touches that follow stay lean. Rendered inside CasePanel's open-case
 * card, only when the study's systemType is 'flow'.
 *
 * Persistence goes through the parent's optimistic patchCase (onPatch);
 * the free-text field saves on blur so typing isn't chatty.
 */

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale-context';
import PillSelect from '@/components/PillSelect';
import InlineTypeAdder from '@/components/InlineTypeAdder';

export interface WmValue {
  targetDate: string | null;
  amountSpecific: number | null;
  amountMin: number | null;
  amountMax: number | null;
  termYears: number | null;
  termMonths: number | null;
}

const EMPTY_WM_VALUE: WmValue = { targetDate: null, amountSpecific: null, amountMin: null, amountMax: null, termYears: null, termMonths: null };

interface Props {
  code: string;
  contextSituation: string | null;
  // Multi-select (2026-07-02): a case can carry several life problems / value
  // demands. The picker adds pills; each is removable.
  lifeProblemIds: string[];
  whatMatters: string | null;
  whatMattersTypeIds: string[];
  /** Per-'by_date' what-matters target dates on this case (typeId → ISO date). */
  whatMattersTargetDates?: Record<string, string>;
  /** Structured ask values per selected type (2026-07-02): the full six-field
   *  object for valueKind types (amount specific/range, date-or-duration). */
  whatMattersValues?: Record<string, WmValue>;
  lifeProblems: { id: string; label: string; operationalDefinition: string | null }[];
  whatMattersTypes: { id: string; label: string; operationalDefinition?: string | null; timing?: 'by_date' | 'asap' | null; enabled?: boolean; valueKind?: 'amount' | 'date_or_duration' | null }[];
  // Value demand (2026-06-12): in flow mode the demand the customer places on
  // the system lives here, right below the life problem it flows from — the
  // Vanguard causal order (life problem → value demand). Patched on the case.
  demandTypeIds: string[];
  valueDemandTypes: { id: string; label: string; operationalDefinition: string | null }[];
  onPatch: (body: Record<string, unknown>) => void;
  /** Refresh study taxonomies after an inline add. */
  onTypesChanged?: () => Promise<void> | void;
}

export default function CaseContextSection({ code, contextSituation, lifeProblemIds, whatMatters, whatMattersTypeIds, whatMattersTargetDates, whatMattersValues, lifeProblems, whatMattersTypes, demandTypeIds, valueDemandTypes, onPatch, onTypesChanged }: Props) {
  const { t, tl } = useLocale();

  // Local draft for the free-text fields; saved on blur. Re-sync when another
  // collector's save arrives via a timeline refetch.
  const [contextDraft, setContextDraft] = useState(contextSituation ?? '');
  const [noteDraft, setNoteDraft] = useState(whatMatters ?? '');
  // What-matters free-text note is collapsed by default (matches the
  // transactional tool — pills are the primary capture, the note is opt-in).
  const [noteOpen, setNoteOpen] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContextDraft(contextSituation ?? '');
    setNoteDraft(whatMatters ?? '');
  }, [contextSituation, whatMatters]);

  // Structured ask pop-outs (2026-07-02). Mode per type (specific/range,
  // date/duration) is UI state defaulted from data; number inputs are string
  // drafts saved on blur so typing isn't chatty. Drafts are derived LAZILY
  // from server data (no re-seed effect): an effect keyed on whatMattersValues
  // would clobber a sibling field's in-progress typing when the first field's
  // blur-PATCH response refreshes the map (e.g. range lower saved → upper wiped).
  const [wmMode, setWmMode] = useState<Record<string, 'specific' | 'range' | 'date' | 'duration'>>({});
  const [wmDrafts, setWmDrafts] = useState<Record<string, { specific: string; min: string; max: string; years: string; months: string }>>({});

  const wmValueOf = (typeId: string): WmValue => whatMattersValues?.[typeId] ?? EMPTY_WM_VALUE;
  const draftOf = (typeId: string) => {
    const touched = wmDrafts[typeId];
    if (touched) return touched;
    const v = wmValueOf(typeId);
    return {
      specific: v.amountSpecific != null ? String(v.amountSpecific) : '',
      min: v.amountMin != null ? String(v.amountMin) : '',
      max: v.amountMax != null ? String(v.amountMax) : '',
      years: v.termYears != null ? String(v.termYears) : '',
      months: v.termMonths != null ? String(v.termMonths) : '',
    };
  };
  const modeOf = (typeId: string, kind: 'amount' | 'date_or_duration'): 'specific' | 'range' | 'date' | 'duration' => {
    const explicit = wmMode[typeId];
    if (explicit) return explicit;
    const v = wmValueOf(typeId);
    if (kind === 'amount') return v.amountMin != null || v.amountMax != null ? 'range' : 'specific';
    return v.termYears != null || v.termMonths != null ? 'duration' : 'date';
  };
  const setDraft = (typeId: string, patch: Partial<{ specific: string; min: string; max: string; years: string; months: string }>) =>
    setWmDrafts((prev) => ({ ...prev, [typeId]: { ...draftOf(typeId), ...patch } }));

  // Persist the full six-field ask for one type — the abandoned shape is
  // nulled server-side atomically (full-object rule). No-op patches are
  // suppressed: a blur that changes nothing (or fires before values load)
  // must never wipe a stored ask.
  function patchWmValue(typeId: string, kind: 'amount' | 'date_or_duration', mode: 'specific' | 'range' | 'date' | 'duration', over?: { targetDate?: string | null }) {
    const d = draftOf(typeId);
    const num = (s: string) => { const n = parseFloat(s); return Number.isFinite(n) ? n : null; };
    const int = (s: string) => { const n = parseInt(s, 10); return Number.isInteger(n) ? n : null; };
    const value: WmValue = { ...EMPTY_WM_VALUE };
    if (kind === 'amount') {
      if (mode === 'specific') value.amountSpecific = num(d.specific);
      else { value.amountMin = num(d.min); value.amountMax = num(d.max); }
    } else {
      if (mode === 'date') value.targetDate = over?.targetDate !== undefined ? over.targetDate : wmValueOf(typeId).targetDate;
      else { value.termYears = int(d.years); value.termMonths = int(d.months); }
    }
    const cur = wmValueOf(typeId);
    const dateOf = (x: string | null) => (x ? x.slice(0, 10) : null);
    // Guard 1 — a patch may only fire when the ACTIVE mode's fields carry a
    // value, or previously did (explicit clearing). An empty blur in a
    // freshly-switched mode must never wipe the other shape's stored ask.
    const modeFields: (keyof WmValue)[] = kind === 'amount'
      ? (mode === 'specific' ? ['amountSpecific'] : ['amountMin', 'amountMax'])
      : (mode === 'date' ? ['targetDate'] : ['termYears', 'termMonths']);
    const newModeHasValue = modeFields.some((f) => value[f] !== null);
    const curModeHadValue = modeFields.some((f) => cur[f] !== null);
    if (!newModeHasValue && !curModeHadValue) return;
    // Guard 2 — skip no-op patches (blur without change).
    const same = value.amountSpecific === cur.amountSpecific
      && value.amountMin === cur.amountMin
      && value.amountMax === cur.amountMax
      && value.termYears === cur.termYears
      && value.termMonths === cur.termMonths
      && dateOf(value.targetDate) === dateOf(cur.targetDate);
    if (same) return;
    onPatch({ whatMattersValue: { whatMattersTypeId: typeId, ...value } });
  }

  function toggleWhatMatters(id: string) {
    const next = whatMattersTypeIds.includes(id)
      ? whatMattersTypeIds.filter((x) => x !== id)
      : [...whatMattersTypeIds, id];
    onPatch({ whatMattersTypeIds: next });
  }

  // Create a new taxonomy type inline from a PillSelect's "+ new" field, then
  // refresh study taxonomies so the fresh option is in the list before the
  // caller selects it. Returns the new id (or null on failure).
  async function createType(apiPath: string, body: Record<string, unknown>): Promise<string | null> {
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      const { id } = await res.json();
      if (!id) return null;
      await onTypesChanged?.();
      return id;
    } catch {
      return null;
    }
  }

  // Small category divider, mirroring the saved-touch section headers
  // (CasePanel sepHeader): centred small-caps label flanked by hairlines.
  const sectionHeader = (label: string) => (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] tracking-widest text-gray-400 font-medium uppercase whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );

  // Multi-select picker (2026-07-02): selected types render as removable green
  // pills; a trailing PillSelect adds another (its dropdown lists the not-yet-
  // selected types + an inline "+ create"). Picking or creating appends the id;
  // the × removes it. The trailing pill shrinks to a bare "+" once one is chosen.
  const renderMultiPicker = (opts: {
    selectedIds: string[];
    allTypes: { id: string; label: string; operationalDefinition: string | null }[];
    placeholder: string;
    ariaLabel: string;
    addNewLabel: string;
    patchKey: 'lifeProblemIds' | 'demandTypeIds';
    apiPath: string;
    extraBody?: Record<string, unknown>;
  }) => {
    const { selectedIds, allTypes, placeholder, ariaLabel, addNewLabel, patchKey, apiPath, extraBody } = opts;
    const byId = new Map(allTypes.map((tp) => [tp.id, tp]));
    const add = (id: string) => { if (id && !selectedIds.includes(id)) onPatch({ [patchKey]: [...selectedIds, id] }); };
    const remove = (id: string) => onPatch({ [patchKey]: selectedIds.filter((x) => x !== id) });
    const unselected = allTypes.filter((tp) => !selectedIds.includes(tp.id));
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {selectedIds.map((id) => {
          const tp = byId.get(id);
          return (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-800 border border-green-300 text-[11px] font-medium pl-2 pr-1 py-0.5">
              <span className="min-w-0 break-words">{tp ? tl(tp.label) : '—'}</span>
              <button type="button" onClick={() => remove(id)} aria-label={t('capture.remove')} className="shrink-0 leading-none text-green-600 hover:text-green-800">×</button>
            </span>
          );
        })}
        <PillSelect
          ariaLabel={ariaLabel}
          placeholder={selectedIds.length > 0 ? '+' : placeholder}
          value=""
          onChange={add}
          options={unselected.map((tp) => ({ id: tp.id, label: tl(tp.label), operationalDefinition: tp.operationalDefinition ? tl(tp.operationalDefinition) : null }))}
          variant="valueLight"
          onCreate={(label) => createType(apiPath, extraBody ? { label, ...extraBody } : { label })}
          addNewLabel={addNewLabel}
          compact
        />
      </div>
    );
  };

  return (
    <div className="mt-2 space-y-2">
      {/* P2BS — the life problem the case exists to solve, the ROOT need.
          On top: the customer has a life problem ("buy a house for my
          family") and BECAUSE of it places a value demand on the system.
          Green strand; reuses the canonical lifeProblem copy. */}
      <div className="space-y-1">
        {sectionHeader(t('capture.lp2bs'))}
        {renderMultiPicker({
          selectedIds: lifeProblemIds,
          allTypes: lifeProblems,
          placeholder: t('capture.lifeProblemPlaceholder'),
          ariaLabel: t('capture.lifeProblemLabel'),
          addNewLabel: t('capture.lifeProblemLabel'),
          patchKey: 'lifeProblemIds',
          apiPath: 'life-problems',
        })}
      </div>

      {/* Value demand — what the customer places on the system BECAUSE of the
          life problem above. Sits directly beneath it (Vanguard causal order:
          life problem → value demand). */}
      {valueDemandTypes.length > 0 && (
        <div className="space-y-1">
          {sectionHeader(t('capture.valueDemandHeader'))}
          {renderMultiPicker({
            selectedIds: demandTypeIds,
            allTypes: valueDemandTypes,
            placeholder: t('capture.customerDemandTypePlaceholder'),
            ariaLabel: t('capture.customerDemandTypePlaceholder'),
            addNewLabel: t('capture.valueDemandHeader'),
            patchKey: 'demandTypeIds',
            apiPath: 'demand-types',
            extraBody: { category: 'value' },
          })}
        </div>
      )}

      {/* Context & situation — free text, the person's circumstances. */}
      <div className="space-y-1">
        {sectionHeader(t('capture.contextHeader'))}
        <textarea
          value={contextDraft}
          onChange={(e) => setContextDraft(e.target.value)}
          onBlur={() => {
            if (contextDraft.trim() !== (contextSituation ?? '').trim()) {
              onPatch({ contextSituation: contextDraft.trim() || null });
            }
          }}
          placeholder={t('capture.caseContextPlaceholder')}
          aria-label={t('capture.caseContextPlaceholder')}
          rows={2}
          className="w-full px-2 py-1.5 rounded-lg text-xs text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
        />
      </div>

      {/* What matters — pills first (like the transactional tool): a leading
          "+ Add what matters" pill, then the selectable green chips. The
          free-text note is collapsed behind "+ Add note" — not a persistent box. */}
      {/* Each pill is a vertical unit so a timed factor's date/hint pops out
          DIRECTLY below its own box (not below the whole row). items-start so a
          selected "When I want it" doesn't vertically shift the other pills. */}
      <div className="space-y-1">
        {sectionHeader(t('capture.whatMattersHeader'))}
      <div className="flex flex-wrap items-start justify-center gap-2">
        <InlineTypeAdder
          code={code}
          apiPath="what-matters-types"
          onCreated={(id) => onPatch({ whatMattersTypeIds: [...whatMattersTypeIds, id] })}
          onRefresh={onTypesChanged}
          pillLabel={t('capture.addWhatMatters')}
          pillVariant="green"
          inputVariant="green"
          compact
        />
        {whatMattersTypes
          // Disabled types are hidden for NEW selection, but one already
          // selected on THIS case keeps its pill (history stays visible and
          // deselectable); once deselected it disappears from the picker.
          .filter((wm) => wm.enabled !== false || whatMattersTypeIds.includes(wm.id))
          .map((wm) => {
          const on = whatMattersTypeIds.includes(wm.id);
          const icon = wm.timing === 'by_date' ? '📅 ' : wm.timing === 'asap' ? '⏱ ' : '';
          const smallInput = 'text-[11px] px-2 py-0.5 rounded border border-green-300 bg-white focus:ring-2 focus:ring-green-500 outline-none';
          const mode = wm.valueKind ? modeOf(wm.id, wm.valueKind) : null;
          // Tiny [mode | mode] switch for the structured pop-outs. Purely
          // local: the abandoned shape is only cleared when REAL data is
          // saved in the new mode (full-object patch on blur) — so an
          // accidental toggle can never wipe a stored ask.
          const modeToggle = (a: { key: 'specific' | 'range' | 'date' | 'duration'; label: string }, b: { key: 'specific' | 'range' | 'date' | 'duration'; label: string }) => (
            <div className="flex rounded overflow-hidden border border-green-300 text-[10px]">
              {[a, b].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setWmMode((prev) => ({ ...prev, [wm.id]: m.key }))}
                  className={`px-1.5 py-0.5 ${mode === m.key ? 'bg-green-600 text-white' : 'bg-white text-green-700 hover:bg-green-50'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          );
          return (
            <div key={wm.id} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => toggleWhatMatters(wm.id)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                  on
                    ? 'bg-green-100 text-green-800 border-green-400'
                    : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                }`}
              >
                {icon}{tl(wm.label)}
              </button>
              {/* Wanted date pops out just below the "When I want it" box. */}
              {on && wm.timing === 'by_date' && (
                <input
                  type="date"
                  value={(whatMattersTargetDates?.[wm.id] || '').slice(0, 10)}
                  onChange={(e) => onPatch({ whatMattersDate: { whatMattersTypeId: wm.id, date: e.target.value || null } })}
                  aria-label={t('capture.whatMattersWhenLabel')}
                  className={smallInput}
                />
              )}
              {/* Structured ask (2026-07-02): amount = specific or range. */}
              {on && wm.valueKind === 'amount' && (
                <div className="flex flex-col items-center gap-1">
                  {modeToggle({ key: 'specific', label: t('capture.wmAmountSpecific') }, { key: 'range', label: t('capture.wmAmountRange') })}
                  {mode === 'specific' ? (
                    <input
                      type="number"
                      value={draftOf(wm.id).specific}
                      onChange={(e) => setDraft(wm.id, { specific: e.target.value })}
                      onBlur={() => patchWmValue(wm.id, 'amount', 'specific')}
                      placeholder={t('capture.wmAmountPlaceholder')}
                      aria-label={t('capture.wmAmountPlaceholder')}
                      className={`${smallInput} w-24`}
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={draftOf(wm.id).min}
                        onChange={(e) => setDraft(wm.id, { min: e.target.value })}
                        onBlur={() => patchWmValue(wm.id, 'amount', 'range')}
                        placeholder={t('capture.wmAmountMinPlaceholder')}
                        aria-label={t('capture.wmAmountMinPlaceholder')}
                        className={`${smallInput} w-20`}
                      />
                      <span className="text-[10px] text-green-700/70">–</span>
                      <input
                        type="number"
                        value={draftOf(wm.id).max}
                        onChange={(e) => setDraft(wm.id, { max: e.target.value })}
                        onBlur={() => patchWmValue(wm.id, 'amount', 'range')}
                        placeholder={t('capture.wmAmountMaxPlaceholder')}
                        aria-label={t('capture.wmAmountMaxPlaceholder')}
                        className={`${smallInput} w-20`}
                      />
                    </div>
                  )}
                </div>
              )}
              {/* Structured ask: an end date OR years+months. */}
              {on && wm.valueKind === 'date_or_duration' && (
                <div className="flex flex-col items-center gap-1">
                  {modeToggle({ key: 'date', label: t('capture.wmModeDate') }, { key: 'duration', label: t('capture.wmModeDuration') })}
                  {mode === 'date' ? (
                    <input
                      type="date"
                      value={(wmValueOf(wm.id).targetDate || '').slice(0, 10)}
                      onChange={(e) => patchWmValue(wm.id, 'date_or_duration', 'date', { targetDate: e.target.value || null })}
                      aria-label={t('capture.wmModeDate')}
                      className={smallInput}
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={draftOf(wm.id).years}
                        onChange={(e) => setDraft(wm.id, { years: e.target.value })}
                        onBlur={() => patchWmValue(wm.id, 'date_or_duration', 'duration')}
                        placeholder={t('capture.wmYearsPlaceholder')}
                        aria-label={t('capture.wmYearsPlaceholder')}
                        className={`${smallInput} w-14`}
                      />
                      <input
                        type="number"
                        value={draftOf(wm.id).months}
                        onChange={(e) => setDraft(wm.id, { months: e.target.value })}
                        onBlur={() => patchWmValue(wm.id, 'date_or_duration', 'duration')}
                        placeholder={t('capture.wmMonthsPlaceholder')}
                        aria-label={t('capture.wmMonthsPlaceholder')}
                        className={`${smallInput} w-14`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Collapsed free-text note — opt-in, mirrors transactional. */}
      {(noteOpen || (whatMatters ?? '').trim()) ? (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">{t('capture.whatMattersLabel')}</span>
            <button
              type="button"
              onClick={() => { setNoteDraft(''); onPatch({ whatMatters: null }); setNoteOpen(false); }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {t('capture.hideNote')}
            </button>
          </div>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={() => {
              if (noteDraft.trim() !== (whatMatters ?? '').trim()) {
                onPatch({ whatMatters: noteDraft.trim() || null });
              }
            }}
            placeholder={t('capture.whatMattersPlaceholder')}
            aria-label={t('capture.whatMattersPlaceholder')}
            rows={2}
            className="w-full px-3 py-1.5 rounded-lg text-xs text-gray-900 placeholder-gray-400 bg-white border border-green-200 focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
      ) : (
        <div className="flex justify-center">
          <button type="button" onClick={() => setNoteOpen(true)} className="text-xs text-green-700 hover:underline">
            {t('capture.addNote')}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
