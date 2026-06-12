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
  lifeProblems: { id: string; label: string; operationalDefinition: string | null }[];
  whatMattersTypes: { id: string; label: string; operationalDefinition?: string | null }[];
  onPatch: (body: Record<string, unknown>) => void;
  /** Refresh study taxonomies after an inline add. */
  onTypesChanged?: () => Promise<void> | void;
}

export default function CaseContextSection({ code, contextSituation, lifeProblemId, whatMatters, whatMattersTypeIds, lifeProblems, whatMattersTypes, onPatch, onTypesChanged }: Props) {
  const { t, tl } = useLocale();

  // Local draft for the free-text fields; saved on blur. Re-sync when another
  // collector's save arrives via a timeline refetch.
  const [contextDraft, setContextDraft] = useState(contextSituation ?? '');
  const [noteDraft, setNoteDraft] = useState(whatMatters ?? '');
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
        className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
      />

      {/* P2BS — the life problem the case exists to solve. Green strand;
          reuses the canonical lifeProblem copy. */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <PillSelect
          ariaLabel={t('capture.lifeProblemLabel')}
          placeholder={t('capture.lifeProblemPlaceholder')}
          value={lifeProblemId || ''}
          onChange={(id) => onPatch({ lifeProblemId: id || null })}
          options={lifeProblems.map((lp) => ({ id: lp.id, label: tl(lp.label), operationalDefinition: lp.operationalDefinition ? tl(lp.operationalDefinition) : null }))}
          variant={lifeProblemId ? 'value' : 'valueLight'}
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

      {/* What matters — green chip multi-select + optional nuance note. */}
      {(whatMattersTypes.length > 0 || whatMattersTypeIds.length > 0) && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {whatMattersTypes.map((wm) => {
            const on = whatMattersTypeIds.includes(wm.id);
            return (
              <button
                key={wm.id}
                type="button"
                onClick={() => toggleWhatMatters(wm.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  on
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-700 border-green-300 hover:border-green-500 hover:bg-green-50'
                }`}
              >
                {tl(wm.label)}
              </button>
            );
          })}
          <InlineTypeAdder
            code={code}
            apiPath="what-matters-types"
            onCreated={(id) => onPatch({ whatMattersTypeIds: [...whatMattersTypeIds, id] })}
            onRefresh={onTypesChanged}
            compact
            inputVariant="green"
          />
        </div>
      )}
      {whatMattersTypeIds.length > 0 && (
        <input
          type="text"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            if (noteDraft.trim() !== (whatMatters ?? '').trim()) {
              onPatch({ whatMatters: noteDraft.trim() || null });
            }
          }}
          placeholder={t('capture.whatMattersPlaceholder')}
          aria-label={t('capture.whatMattersPlaceholder')}
          className="w-full px-3 py-1.5 rounded-lg text-xs text-gray-900 placeholder-gray-400 bg-white border border-green-200 focus:ring-2 focus:ring-green-500 outline-none"
        />
      )}
    </div>
  );
}
