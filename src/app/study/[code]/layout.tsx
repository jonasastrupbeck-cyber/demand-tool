'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import { LOCALE_LABELS, type Locale } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const code = params.code as string;
  const { locale, setLocale, t } = useLocale();
  const [reclassifyCount, setReclassifyCount] = useState(0);
  const [activeLayer, setActiveLayer] = useState(0);

  const fetchStudyMeta = useCallback(async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        fetch(`/api/studies/${encodeURIComponent(code)}/reclassify/count`),
        fetch(`/api/studies/${encodeURIComponent(code)}`),
      ]);
      if (rRes.ok) { const d = await rRes.json(); setReclassifyCount(d.count || 0); }
      if (sRes.ok) { const d = await sRes.json(); setActiveLayer(d.activeLayer ?? 1); }
    } catch { /* ignore */ }
  }, [code]);

  useEffect(() => {
    fetchStudyMeta();
  }, [fetchStudyMeta, pathname]);

  const workflowTabs: Array<{ labelKey: TranslationKey; href: string }> = [
    { labelKey: 'nav.capture', href: `/study/${code}/capture` },
    { labelKey: 'nav.dashboard', href: `/study/${code}/dashboard` },
    { labelKey: 'nav.reclassify', href: `/study/${code}/reclassify` },
  ];
  const settingsTab = { labelKey: 'nav.settings' as TranslationKey, href: `/study/${code}/settings` };

  return (
    <div className="flex flex-col min-h-full bg-white">
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/vanguard-logo.png" alt="Vanguard" style={{ height: '52px', width: 'auto' }} />
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
              {activeLayer > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ac2c2d] text-white">
                  L{activeLayer}
                </span>
              )}
            </div>
          </div>
          <div className="flex -mb-px">
            <div className="flex gap-1">
              {workflowTabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-[#ac2c2d] text-[#ac2c2d]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t(tab.labelKey)}
                    {tab.labelKey === 'nav.reclassify' && reclassifyCount > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {reclassifyCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="ml-auto">
              <Link
                href={settingsTab.href}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  pathname.startsWith(settingsTab.href)
                    ? 'border-[#ac2c2d] text-[#ac2c2d]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {t(settingsTab.labelKey)}
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
