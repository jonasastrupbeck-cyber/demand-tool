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
  lifeProblems: { id: string; label: string; operationalDefinition: string | null }[];
  whatMattersTypes: { id: string; label: string; operationalDefinition?: string | null; timing?: 'by_date' | 'asap' | null }[];
  // Value demand (2026-06-12): in flow mode the demand the customer places on
  // the system lives here, right below the life problem it flows from — the
  // Vanguard causal order (life problem → value demand). Patched on the case.
  demandTypeIds: string[];
  valueDemandTypes: { id: string; label: string; operationalDefinition: string | null }[];
  onPatch: (body: Record<string, unknown>) => void;
  /** Refresh study taxonomies after an inline add. */
  onTypesChanged?: () => Promise<void> | void;
}

export default function CaseContextSection({ code, contextSituation, lifeProblemIds, whatMatters, whatMattersTypeIds, whatMattersTargetDates, lifeProblems, whatMattersTypes, demandTypeIds, valueDemandTypes, onPatch, onTypesChanged }: Props) {
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
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-green-600 text-white border border-green-600 text-[11px] font-medium pl-2 pr-1 py-0.5">
              <span className="min-w-0 break-words">{tp ? tl(tp.label) : '—'}</span>
              <button type="button" onClick={() => remove(id)} aria-label={t('capture.remove')} className="shrink-0 leading-none text-white/80 hover:text-white">×</button>
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
        {whatMattersTypes.map((wm) => {
          const on = whatMattersTypeIds.includes(wm.id);
          const icon = wm.timing === 'by_date' ? '📅 ' : wm.timing === 'asap' ? '⏱ ' : '';
          return (
            <div key={wm.id} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => toggleWhatMatters(wm.id)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                  on
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
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
                  className="text-[11px] px-2 py-0.5 rounded border border-green-300 bg-white focus:ring-2 focus:ring-green-500 outline-none"
                />
              )}
              {on && wm.timing === 'asap' && (
                <span className="text-[10px] text-green-700/70">{t('capture.whatMattersAsapHint')}</span>
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
