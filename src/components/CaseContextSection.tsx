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
  lifeProblemId: string | null;
  whatMatters: string | null;
  whatMattersTypeIds: string[];
  /** Per-'by_date' what-matters target dates on this case (typeId → ISO date). */
  whatMattersTargetDates?: Record<string, string>;
  lifeProblems: { id: string; label: string; operationalDefinition: string | null }[];
  whatMattersTypes: { id: string; label: string; operationalDefinition?: string | null; timing?: 'by_date' | 'asap' | null }[];
  // Value demand (2026-06-12): in flow mode the demand the customer places on
  // the system lives here, right below the life problem it flows from — the
  // Vanguard causal order (life problem → value demand). Patched on the case.
  demandTypeId: string | null;
  valueDemandTypes: { id: string; label: string; operationalDefinition: string | null }[];
  onPatch: (body: Record<string, unknown>) => void;
  /** Refresh study taxonomies after an inline add. */
  onTypesChanged?: () => Promise<void> | void;
}

export default function CaseContextSection({ code, contextSituation, lifeProblemId, whatMatters, whatMattersTypeIds, whatMattersTargetDates, lifeProblems, whatMattersTypes, demandTypeId, valueDemandTypes, onPatch, onTypesChanged }: Props) {
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

  return (
    <div className="mt-2 space-y-2">
      {/* P2BS — the life problem the case exists to solve, the ROOT need.
          On top: the customer has a life problem ("buy a house for my
          family") and BECAUSE of it places a value demand on the system.
          Green strand; reuses the canonical lifeProblem copy. */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <PillSelect
          ariaLabel={t('capture.lifeProblemLabel')}
          placeholder={t('capture.lifeProblemPlaceholder')}
          value={lifeProblemId || ''}
          onChange={(id) => onPatch({ lifeProblemId: id || null })}
          options={lifeProblems.map((lp) => ({ id: lp.id, label: tl(lp.label), operationalDefinition: lp.operationalDefinition ? tl(lp.operationalDefinition) : null }))}
          variant={lifeProblemId ? 'value' : 'valueLight'}
          compact
        />
        <InlineTypeAdder
          code={code}
          apiPath="life-problems"
          onCreated={(id) => onPatch({ lifeProblemId: id })}
          onRefresh={onTypesChanged}
          compact
          inputVariant="green"
        />
      </div>

      {/* Value demand — what the customer places on the system BECAUSE of the
          life problem above. Sits directly beneath it (Vanguard causal order:
          life problem → value demand). */}
      {valueDemandTypes.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <PillSelect
            ariaLabel={t('capture.customerDemandTypePlaceholder')}
            placeholder={t('capture.customerDemandTypePlaceholder')}
            value={demandTypeId || ''}
            onChange={(id) => onPatch({ demandTypeId: id || null })}
            options={valueDemandTypes.map((dt) => ({ id: dt.id, label: tl(dt.label), operationalDefinition: dt.operationalDefinition ? tl(dt.operationalDefinition) : null }))}
            variant={demandTypeId ? 'value' : 'valueLight'}
            compact
          />
        </div>
      )}

      {/* Context & situation — free text, the person's circumstances. */}
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

      {/* What matters — pills first (like the transactional tool): a leading
          "+ Add what matters" pill, then the selectable green chips. The
          free-text note is collapsed behind "+ Add note" — not a persistent box. */}
      {/* Each pill is a vertical unit so a timed factor's date/hint pops out
          DIRECTLY below its own box (not below the whole row). items-start so a
          selected "When I want it" doesn't vertically shift the other pills. */}
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
  );
}
