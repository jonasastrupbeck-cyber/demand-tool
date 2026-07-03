'use client';

/**
 * FormulaEditor — authoring UI for a 'calculated' subquestion (2026-07-03).
 *
 * A free-form expression editor with a token picker: click a sibling field to
 * insert its stable {sq:<id>} reference, or a helper/operator button. The
 * expression is validated structurally (src/lib/formula.ts) as you type; it is
 * persisted via onSave on blur and whenever a token button is used. Inputs are
 * the OTHER subquestions on the same milestone.
 */

import { useRef, useState } from 'react';
import { useLocale } from '@/lib/locale-context';
import { validateFormula } from '@/lib/formula';

export interface FormulaSibling {
  id: string;
  label: string;
  kind: string;
}

interface Props {
  initialFormula: string | null;
  siblings: FormulaSibling[];
  onSave: (formula: string | null) => void;
}

const OPS = ['+', '−', '×', '÷', '(', ')'] as const;
// Display → stored operator (formula.ts expects ASCII * and /).
const OP_TOKEN: Record<string, string> = { '+': ' + ', '−': ' - ', '×': ' * ', '÷': ' / ', '(': '(', ')': ')' };

export default function FormulaEditor({ initialFormula, siblings, onSave }: Props) {
  const { t, tl } = useLocale();
  const [value, setValue] = useState(initialFormula ?? '');
  const ref = useRef<HTMLTextAreaElement>(null);
  const valid = validateFormula(value);

  // Insert `snippet` at the caret (or append), keep focus, and persist.
  const insert = (snippet: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const nextVal = value.slice(0, start) + snippet + value.slice(end);
    setValue(nextVal);
    onSave(nextVal.trim() ? nextVal : null);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = start + snippet.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const tokenFor = (s: FormulaSibling) =>
    s.kind === 'duration' ? `MONTHS({sq:${s.id}})` : `{sq:${s.id}}`;

  return (
    <div className="space-y-1 pl-1 border-l-2 border-gray-100">
      <label className="block text-[11px] font-medium text-gray-500">{t('settings.subquestionFormula')}</label>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onSave(value.trim() ? value : null)}
        aria-label={t('settings.subquestionFormula')}
        rows={2}
        className={`w-full px-2 py-1 rounded text-xs font-mono text-gray-900 bg-white border ${valid ? 'border-gray-300 focus:ring-brand' : 'border-red-400 focus:ring-red-400'} focus:ring-2 outline-none`}
      />
      {!valid && <p className="text-[10px] text-red-600">{t('settings.subquestionFormulaInvalid')}</p>}
      {siblings.length === 0 ? (
        <p className="text-[10px] text-gray-400 italic">{t('settings.subquestionFormulaNoFields')}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {siblings.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => insert(tokenFor(s))}
              className="px-1.5 py-0.5 rounded text-[10px] text-sky-800 bg-sky-50 border border-sky-200 hover:bg-sky-100"
            >
              {tl(s.label)}
            </button>
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
