'use client';

/**
 * ChildQuestionAdder — build branching downward (decision-box builder UX,
 * 2026-07-04). Lives on each answer-option row of a choice subquestion as a
 * collapsed ghost button: `+ If "Yes", ask…`. Expanding it creates a follow-up
 * subquestion ALREADY WIRED to that answer (create → options if Yes/No →
 * condition), replacing the old wire-it-backwards ConditionEditor flow.
 *
 * Kind defaults to a `yesno` pseudo-kind (a choice created with localized
 * Yes/No options, neutral polarity). `calculated` is omitted — its formula
 * editor lives on the row after creation. If the condition POST fails midway,
 * the question degrades to a visible unwired root, fixable inline.
 */

import { useState } from 'react';
import { useLocale } from '@/lib/locale-context';

interface Props {
  code: string;
  milestoneId: string;
  parentSubquestionId: string;
  /** Raw option label (the stored trigger value). */
  triggerValue: string;
  /** Localized option label for display. */
  triggerDisplay: string;
  onRefresh: () => Promise<void> | void;
}

type AdderKind = 'yesno' | 'choice' | 'amount' | 'number' | 'percent' | 'currency' | 'date' | 'duration' | 'duration_months' | 'text';

export default function ChildQuestionAdder({ code, milestoneId, parentSubquestionId, triggerValue, triggerDisplay, onRefresh }: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<AdderKind>('yesno');
  const [busy, setBusy] = useState(false);

  const kindOptions: { value: AdderKind; label: string }[] = [
    { value: 'yesno', label: t('settings.addYesNoQuestion') },
    { value: 'text', label: t('settings.subquestionKindText') },
    { value: 'choice', label: t('settings.captureFieldKindChoice') },
    { value: 'amount', label: t('settings.captureFieldKindAmount') },
    { value: 'number', label: t('settings.subquestionKindNumber') },
    { value: 'percent', label: t('settings.subquestionKindPercent') },
    { value: 'currency', label: t('settings.subquestionKindCurrency') },
    { value: 'date', label: t('settings.captureFieldKindDate') },
    { value: 'duration', label: t('settings.captureFieldKindDuration') },
    { value: 'duration_months', label: t('settings.subquestionKindDurationMonths') },
  ];

  const reset = () => { setOpen(false); setLabel(''); setKind('yesno'); };

  // Create the follow-up already wired: subquestion → (Yes/No options) →
  // condition. Sequential awaits mirroring addPresetSubquestion; sortOrder is
  // left at end-of-milestone — both surfaces position children via the tree.
  const submit = async () => {
    const clean = label.trim();
    if (!clean || busy) return;
    setBusy(true);
    const base = `/api/studies/${encodeURIComponent(code)}`;
    try {
      const res = await fetch(`${base}/milestones/${milestoneId}/subquestions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: clean, kind: kind === 'yesno' ? 'choice' : kind }),
      });
      if (res.ok) {
        const sq = await res.json();
        if (kind === 'yesno') {
          for (const optLabel of [t('capture.dpYes'), t('capture.dpNo')]) {
            await fetch(`${base}/subquestions/${sq.id}/options`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ label: optLabel }),
            });
          }
        }
        await fetch(`${base}/subquestions/${sq.id}/conditions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentSubquestionId, triggerValue }),
        });
        await onRefresh();
        reset();
      }
    } finally {
      // Always clear busy — a rejected fetch must not freeze the adder.
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2 py-0.5 rounded text-[11px] text-sky-600 hover:text-sky-800 border border-dashed border-sky-300 hover:border-sky-400"
      >
        + {t('settings.ifValueAsk', { value: triggerDisplay })}
      </button>
    );
  }

  return (
    <div className="flex gap-1.5 items-center flex-wrap">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); void submit(); }
          if (e.key === 'Escape') reset();
        }}
        placeholder={t('settings.childQuestionLabelPlaceholder')}
        aria-label={t('settings.ifValueAsk', { value: triggerDisplay })}
        autoFocus
        className="flex-1 min-w-[10rem] px-2 py-1 rounded text-xs text-gray-900 bg-white border border-sky-300 focus:ring-2 focus:ring-sky-400 outline-none"
      />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as AdderKind)}
        aria-label={t('settings.wmValueKind')}
        className="shrink-0 px-1.5 py-1 rounded text-xs text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-sky-400 outline-none"
      >
        {kindOptions.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
      </select>
      <button type="button" onClick={() => void submit()} disabled={!label.trim() || busy} className="shrink-0 px-2 py-1 rounded text-xs font-medium text-white disabled:opacity-50 bg-sky-600 hover:bg-sky-700">{t('settings.add')}</button>
      <button type="button" onClick={reset} className="shrink-0 px-1 py-1 text-gray-400 hover:text-gray-600 text-sm">×</button>
    </div>
  );
}
