'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import { CaptureBarProvider, useCaptureBar } from '@/lib/capture-bar-context';
import { LOCALE_LABELS, type Locale } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';

// Undo button (2026-06-18): removes the last saved touch. Shown only on the
// capture route when there is one to undo (state lives in CaptureBarContext,
// set by the capture page). Sits to the right of the Capture/Dashboard tabs.
function UndoButton({ code }: { code: string }) {
  const { lastTouch, setLastTouch, bumpUndoSignal } = useCaptureBar();
  const { t } = useLocale();
  const pathname = usePathname();
  const [undoing, setUndoing] = useState(false);
  if (!pathname.startsWith(`/study/${code}/capture`) || !lastTouch) return null;
  async function undo() {
    if (undoing || !lastTouch) return;
    setUndoing(true);
    try {
      await fetch(`/api/studies/${encodeURIComponent(code)}/entries/${encodeURIComponent(lastTouch.id)}`, { method: 'DELETE' });
    } catch {}
    setLastTouch(null);
    bumpUndoSignal();
    setUndoing(false);
  }
  return (
    <button
      type="button"
      onClick={undo}
      disabled={undoing}
      title={lastTouch.label}
      className="self-center inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 transition-colors"
    >
      <span aria-hidden="true">↩</span> {t('capture.undo')}
    </button>
  );
}

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const code = params.code as string;
  const { locale, setLocale, t } = useLocale();

  // R5 (2026-06-18): branding follows the study type. Demand (transactional)
  // studies stay Vanguard-branded; flow studies show the Skipton + Vanguard
  // co-brand lockup and override the brand colour to Skipton blue. Default is
  // Vanguard (red) so there's no flash for the common demand case.
  const [isFlow, setIsFlow] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/studies/${encodeURIComponent(code)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((s) => { if (!cancelled && s) setIsFlow(s.systemType === 'flow'); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [code]);

  const workflowTabs: Array<{ labelKey: TranslationKey; href: string }> = [
    { labelKey: 'nav.capture', href: `/study/${code}/capture` },
    { labelKey: 'nav.dashboard', href: `/study/${code}/dashboard` },
  ];
  const settingsTab = { labelKey: 'nav.settings' as TranslationKey, href: `/study/${code}/settings` };

  // Flow studies override the brand tokens to Skipton blue on this subtree
  // (Tailwind `*-brand*` + dashboard chart var(--color-brand) follow it).
  const brandStyle = isFlow
    ? ({ '--color-brand': '#0072C5', '--color-brand-hover': '#005a9e', '--color-brand-accent': '#069DE5' } as React.CSSProperties)
    : undefined;

  return (
    <CaptureBarProvider>
    <div className="flex flex-col min-h-full bg-white" style={brandStyle}>
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between min-h-16 py-2">
            {/* Branding by study type (R5): flow → Skipton + Vanguard co-brand
                lockup (~3.5× larger per Jonas, 2026-06-18); demand/transactional
                → the Vanguard mark only. The row uses min-h-16 so it grows for the
                tall flow lockup but stays compact for the small demand mark. */}
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              {isFlow ? (
                <Image src="/vanguard-skipton.svg" alt="Skipton Building Society · Powered by Vanguard Method" width={280} height={154} className="h-[154px] w-auto" priority />
              ) : (
                <Image src="/vanguard-logo.png" alt="Vanguard" width={44} height={48} className="h-11 w-auto" priority />
              )}
            </Link>
            <div className="flex items-center gap-3">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="text-xs rounded px-2 py-1 text-gray-600 bg-white border border-gray-300 outline-none"
              >
                {Object.entries(LOCALE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <span className="text-xs font-mono px-2 py-1 rounded text-gray-500 bg-gray-100">
                {code}
              </span>
              <Link
                href={settingsTab.href}
                aria-label={t(settingsTab.labelKey)}
                title={t(settingsTab.labelKey)}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  pathname.startsWith(settingsTab.href)
                    ? 'text-green-700 bg-green-700/10'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </Link>
            </div>
          </div>
          <div className="flex -mb-px items-center justify-between">
            <div className="flex gap-1">
              {workflowTabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t(tab.labelKey)}
                  </Link>
                );
              })}
            </div>
            <UndoButton code={code} />
          </div>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
    </CaptureBarProvider>
  );
}
