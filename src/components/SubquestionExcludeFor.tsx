'use client';

/**
 * SubquestionExcludeFor — authoring control for per-subquestion demand-type
 * EXCLUSIONS (0054). Toggle the demand types a question is skipped for: with a
 * type selected, the question is hidden and non-gating for a case of that type
 * (exclude model — opposite of MilestoneAppliesTo's include model). None
 * selected = applies to every case. Persists the full desired set via PUT
 * subquestions/{id}/exclusions (diff-set server-side).
 */

import { useState } from 'react';
import { useLocale } from '@/lib/locale-context';

export interface DemandTypeOption { id: string; label: string; }

interface Props {
  code: string;
  sqId: string;
  selected: string[];
  demandTypes: DemandTypeOption[];
  onRefresh: () => Promise<void> | void;
}

export default function SubquestionExcludeFor({ code, sqId, selected, demandTypes, onRefresh }: Props) {
  const { t, tl } = useLocale();
  const [busy, setBusy] = useState(false);
  const set = new Set(selected);

  const toggle = async (dtId: string) => {
    if (busy) return;
    setBusy(true);
    const next = new Set(set);
    if (next.has(dtId)) next.delete(dtId); else next.add(dtId);
    await fetch(`/api/studies/${encodeURIComponent(code)}/subquestions/${sqId}/exclusions`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demandTypeIds: [...next] }),
    });
    await onRefresh();
    setBusy(false);
  };

  if (demandTypes.length === 0) return null;

  return (
    <div className="px-1 pb-1 flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] text-gray-500">{t('settings.subquestionExcludeFor')}</span>
      {demandTypes.map((d) => {
        const on = set.has(d.id);
        return (
          <button
            key={d.id}
            type="button"
            disabled={busy}
            onClick={() => toggle(d.id)}
            className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors disabled:opacity-50 ${on ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-100'}`}
          >
            {tl(d.label)}
          </button>
        );
      })}
    </div>
  );
}
