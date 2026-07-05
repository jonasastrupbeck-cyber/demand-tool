'use client';

/**
 * FormulaEditor — authoring UI for a 'calculated' subquestion (2026-07-03).
 *
 * A token picker builds a formula: click a field to insert its stable
 * {sq:<id>} reference, or a helper/operator button. The expression is validated
 * structurally (src/lib/formula.ts) as you type; it persists via onSave on blur
 * and whenever a button is used. Fields come from THIS milestone (shown first)
 * AND every other milestone (grouped below) — a formula resolves case-wide at
 * capture, so cross-milestone references (e.g. LTV = amount ÷ valuation) work.
 * A live preview renders the labels so the author reads what they're building,
 * not {sq:…} codes (2026-07-04).
 */

import { useRef, useState } from 'react';
import { useLocale } from '@/lib/locale-context';
import { validateFormula, renderFormula } from '@/lib/formula';

export interface FormulaSibling {
  id: string;
  label: string;
  kind: string;
  milestoneId: string;
}

interface Props {
  initialFormula: string | null;
  siblings: FormulaSibling[];
  currentMilestoneId: string;
  milestones: { id: string; label: string }[];
  onSave: (formula: string | null) => void;
}

const OPS = ['+', '−', '×', '÷', '(', ')'] as const;
// Display → stored operator (formula.ts expects ASCII * and /).
const OP_TOKEN: Record<string, string> = { '+': ' + ', '−': ' - ', '×': ' * ', '÷': ' / ', '(': '(', ')': ')' };

export default function FormulaEditor({ initialFormula, siblings, currentMilestoneId, milestones, onSave }: Props) {
  const { t, tl } = useLocale();
  const [value, setValue] = useState(initialFormula ?? '');
  const ref = useRef<HTMLTextAreaElement>(null);
  const valid = validateFormula(value);

  // Persist only a valid (or empty) formula — an invalid/intermediate one would
  // be stored and then render blank forever at capture. The live `value` keeps
  // the in-progress text so the author can fix it before it's saved.
  const persist = (v: string) => {
    if (!v.trim()) onSave(null);
    else if (validateFormula(v)) onSave(v);
  };

  // Insert `snippet` at the caret (or append) and keep focus. Does NOT persist
  // per click (that stored a stream of intermediate, usually-invalid formulas);
  // the onBlur save captures the final value.
  const insert = (snippet: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const nextVal = value.slice(0, start) + snippet + value.slice(end);
    setValue(nextVal);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = start + snippet.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const tokenFor = (s: FormulaSibling) =>
    s.kind === 'duration' ? `MONTHS({sq:${s.id}})` : `{sq:${s.id}}`;

  // Only fields that resolve to a number are offered as one-click operands.
  // text/choice never produce a value (a bare {sq:id} ref → null → blank field);
  // date is still available for MONTHS_BETWEEN via the operator buttons.
  const NUMERIC_KINDS = new Set(['amount', 'number', 'percent', 'currency', 'calculated', 'duration', 'duration_months']);
  const usableSiblings = siblings.filter((s) => NUMERIC_KINDS.has(s.kind));

  const fieldButton = (s: FormulaSibling) => (
    <button
      key={s.id}
      type="button"
      onClick={() => insert(tokenFor(s))}
      className="px-1.5 py-0.5 rounded text-[10px] text-sky-800 bg-sky-50 border border-sky-200 hover:bg-sky-100"
    >
      {tl(s.label)}
    </button>
  );

  const currentFields = usableSiblings.filter((s) => s.milestoneId === currentMilestoneId);
  // Other milestones, in study order, each with its own (non-empty) field group.
  const otherGroups = milestones
    .filter((m) => m.id !== currentMilestoneId)
    .map((m) => ({ milestone: m, fields: usableSiblings.filter((s) => s.milestoneId === m.id) }))
    .filter((g) => g.fields.length > 0);

  // Preview: translated field labels + a short milestone tag for cross-milestone fields.
  const labelById = new Map<string, string>();
  const milestoneTagById = new Map<string, string>();
  for (const s of siblings) {
    labelById.set(s.id, tl(s.label));
    if (s.milestoneId !== currentMilestoneId) {
      const label = milestones.find((m) => m.id === s.milestoneId)?.label;
      if (label) milestoneTagById.set(s.id, tl(label));
    }
  }
  const preview = renderFormula(value, labelById, {
    milestoneById: milestoneTagById,
    fieldFallback: t('settings.subquestionFormulaFieldFallback'),
    monthsOfWord: t('settings.formulaMonthsOf'),
    monthsBetweenWord: t('settings.formulaMonthsBetween'),
    betweenAndWord: t('settings.formulaBetweenAnd'),
  });

  return (
    <div className="space-y-1 pl-1 border-l-2 border-gray-100">
      <label className="block text-[11px] font-medium text-gray-500">{t('settings.subquestionFormula')}</label>

      {/* Human-readable preview — what this actually calculates. */}
      <div className="rounded bg-sky-50/60 border border-sky-100 px-2 py-1">
        <span className="text-[9px] uppercase tracking-wide text-sky-500">{t('settings.subquestionFormulaPreview')} </span>
        <span className="text-[11px] text-gray-800">{preview || <span className="text-gray-400 italic">{t('settings.subquestionFormulaPreviewEmpty')}</span>}</span>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => persist(value)}
        aria-label={t('settings.subquestionFormula')}
        rows={2}
        className={`w-full px-2 py-1 rounded text-[10px] font-mono text-gray-500 bg-gray-50 border ${valid ? 'border-gray-200 focus:ring-brand' : 'border-red-400 focus:ring-red-400'} focus:ring-2 outline-none`}
      />
      {!valid && <p className="text-[10px] text-red-600">{t('settings.subquestionFormulaInvalid')}</p>}

      {usableSiblings.length === 0 ? (
        <p className="text-[10px] text-gray-400 italic">{t('settings.subquestionFormulaNoFields')}</p>
      ) : (
        <div className="space-y-1">
          {currentFields.length > 0 && (
            <div className="flex flex-wrap gap-1">{currentFields.map(fieldButton)}</div>
          )}
          {otherGroups.map((g) => (
            <div key={g.milestone.id} className="space-y-0.5">
              <p className="text-[9px] font-medium text-gray-400">{tl(g.milestone.label)}</p>
              <div className="flex flex-wrap gap-1">{g.fields.map(fieldButton)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {OPS.map((op) => (
          <button key={op} type="button" onClick={() => insert(OP_TOKEN[op])} className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200">{op}</button>
        ))}
        <button type="button" onClick={() => insert('MONTHS()')} className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200">MONTHS()</button>
        <button type="button" onClick={() => insert('MONTHS_BETWEEN(, )')} className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200">MONTHS_BETWEEN()</button>
      </div>
      <p className="text-[10px] text-gray-400 leading-tight">{t('settings.subquestionFormulaHelp')}</p>
    </div>
  );
}
