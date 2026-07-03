'use client';

/**
 * ConditionEditor — authoring UI for conditional subquestion visibility (0050,
 * 2026-07-03). Lists the child's existing "show only when <parent> is <value>"
 * rules and lets the author add one by picking a parent CHOICE subquestion and
 * one of its option labels. Persists via the subquestions/{id}/conditions API.
 */

import { useState } from 'react';
import { useLocale } from '@/lib/locale-context';

export interface ParentChoiceSubq {
  id: string;
  label: string;
  options: { label: string }[];
}

export interface ExistingCondition {
  id: string;
  parentSubquestionId: string;
  triggerValue: string;
}

interface Props {
  code: string;
  sqId: string;
  conditions: ExistingCondition[];
  parents: ParentChoiceSubq[];
  onRefresh: () => Promise<void> | void;
}

export default function ConditionEditor({ code, sqId, conditions, parents, onRefresh }: Props) {
  const { t, tl } = useLocale();
  const [parentId, setParentId] = useState('');
  const [triggerValue, setTriggerValue] = useState('');
  const [busy, setBusy] = useState(false);

  const parentById = new Map(parents.map((p) => [p.id, p]));
  const selectedParent = parentById.get(parentId);

  const add = async () => {
    if (!parentId || !triggerValue || busy) return;
    setBusy(true);
    await fetch(`/api/studies/${encodeURIComponent(code)}/subquestions/${sqId}/conditions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentSubquestionId: parentId, triggerValue }),
    });
    setParentId(''); setTriggerValue('');
    await onRefresh();
    setBusy(false);
  };

  const remove = async (id: string) => {
    if (busy) return;
    setBusy(true);
    await fetch(`/api/studies/${encodeURIComponent(code)}/subquestions/${sqId}/conditions`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await onRefresh();
    setBusy(false);
  };

  const selectCls = 'px-1.5 py-1 rounded text-xs text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none';

  return (
    <div className="space-y-1 pl-1 border-l-2 border-sky-100">
      <label className="block text-[11px] font-medium text-gray-500">{t('settings.subquestionCondition')}</label>
      {conditions.length === 0 && (
        <p className="text-[10px] text-gray-400 italic">{t('settings.subquestionConditionNone')}</p>
      )}
      {conditions.map((c) => {
        const p = parentById.get(c.parentSubquestionId);
        return (
          <div key={c.id} className="flex items-center gap-1 text-[11px] text-gray-600">
            <span className="rounded bg-sky-50 border border-sky-200 px-1.5 py-0.5">
              {p ? tl(p.label) : c.parentSubquestionId} {t('settings.subquestionConditionEquals')} <strong>{tl(c.triggerValue)}</strong>
            </span>
            <button type="button" onClick={() => remove(c.id)} className="text-red-500 hover:text-red-700 px-1" aria-label={t('settings.remove')}>×</button>
          </div>
        );
      })}
      {parents.length === 0 ? (
        <p className="text-[10px] text-gray-400 italic">{t('settings.subquestionConditionNoChoices')}</p>
      ) : (
        <div className="flex items-center gap-1 flex-wrap">
          <select value={parentId} onChange={(e) => { setParentId(e.target.value); setTriggerValue(''); }} aria-label={t('settings.subquestionConditionParentPlaceholder')} className={selectCls}>
            <option value="">{t('settings.subquestionConditionParentPlaceholder')}</option>
            {parents.map((p) => <option key={p.id} value={p.id}>{tl(p.label)}</option>)}
          </select>
          <span className="text-[11px] text-gray-400">{t('settings.subquestionConditionEquals')}</span>
          <select value={triggerValue} onChange={(e) => setTriggerValue(e.target.value)} disabled={!selectedParent} aria-label={t('settings.subquestionConditionValuePlaceholder')} className={selectCls}>
            <option value="">{t('settings.subquestionConditionValuePlaceholder')}</option>
            {selectedParent?.options.map((o) => <option key={o.label} value={o.label}>{tl(o.label)}</option>)}
          </select>
          <button type="button" onClick={add} disabled={!parentId || !triggerValue || busy} className="px-2 py-1 rounded text-xs font-medium text-white disabled:opacity-50 bg-sky-600 hover:bg-sky-700">{t('settings.add')}</button>
        </div>
      )}
    </div>
  );
}
