'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/locale-context';

interface Props {
  code: string;
  // API path relative to /api/studies/{code}/, e.g. "demand-types", "handling-types"
  apiPath: string;
  // Extra body (e.g. { category: 'value' } for demand types)
  extraBody?: Record<string, string>;
  // Called with the new id after creation
  onCreated: (id: string) => void;
  // Called after a new type is added so parent can refresh study data
  onRefresh?: () => Promise<void> | void;
  // Compact button style (used inside modal rows). Default shows "+ Add" dashed button.
  compact?: boolean;
}

export default function InlineTypeAdder({ code, apiPath, extraBody, onCreated, onRefresh, compact }: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    const trimmed = label.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmed, ...(extraBody || {}) }),
      });
      if (res.ok) {
        const { id } = await res.json();
        if (onRefresh) await onRefresh();
        onCreated(id);
      }
    } finally {
      setSaving(false);
      setLabel('');
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); setLabel(''); }}
        className={compact
          ? 'px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 hover:border-gray-400'
          : 'px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 transition-colors'
        }
        title={t('capture.addNew')}
      >
        + {t('capture.addNew')}
      </button>
    );
  }

  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t('capture.newTypePlaceholder')}
        className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] outline-none"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
          if (e.key === 'Escape') { setOpen(false); setLabel(''); }
        }}
        disabled={saving}
      />
      <button
        type="button"
        onClick={submit}
        disabled={!label.trim() || saving}
        className="px-3 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]"
      >
        {saving ? '...' : t('settings.add')}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setLabel(''); }}
        className="px-2 py-2 text-gray-400 hover:text-gray-600 text-sm"
      >
        &times;
      </button>
    </div>
  );
}
