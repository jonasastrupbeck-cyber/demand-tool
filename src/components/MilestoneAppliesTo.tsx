'use client';

/**
 * MilestoneAppliesTo — authoring control for dynamic milestones (0051,
 * 2026-07-03). Toggle the demand types a milestone is scoped to. With none
 * selected the milestone applies to every case (back-compat); selecting some
 * scopes it to cases whose demand-type set intersects them. Persists the full
 * desired set via PUT milestones/{id}/conditions (diff-set server-side).
 */

import { useState } from 'react';
import { useLocale } from '@/lib/locale-context';

export interface DemandTypeOption { id: string; label: string; }

interface Props {
  code: string;
  milestoneId: string;
  selected: string[];
  demandTypes: DemandTypeOption[];
  onRefresh: () => Promise<void> | void;
}

export default function MilestoneAppliesTo({ code, milestoneId, selected, demandTypes, onRefresh }: Props) {
  const { t, tl } = useLocale();
  const [busy, setBusy] = useState(false);
  const set = new Set(selected);

  const toggle = async (dtId: string) => {
    if (busy) return;
    setBusy(true);
    const next = new Set(set);
    if (next.has(dtId)) next.delete(dtId); else next.add(dtId);
    await fetch(`/api/studies/${encodeURIComponent(code)}/milestones/${milestoneId}/conditions`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demandTypeIds: [...next] }),
    });
    await onRefresh();
    setBusy(false);
  };

  if (demandTypes.length === 0) return null;

  return (
    <div className="px-1 pb-1.5 flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] text-gray-500">{t('settings.milestoneAppliesTo')}</span>
      {set.size === 0 && <span className="text-[11px] text-gray-400 italic">{t('settings.milestoneAppliesToAll')}</span>}
      {demandTypes.map((d) => {
        const on = set.has(d.id);
        return (
          <button
            key={d.id}
            type="button"
            disabled={busy}
            onClick={() => toggle(d.id)}
            className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors disabled:opacity-50 ${on ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-100'}`}
          >
            {tl(d.label)}
          </button>
        );
      })}
    </div>
  );
}
