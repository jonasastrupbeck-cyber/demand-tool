'use client';

import Image from 'next/image';
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

  const workflowTabs: Array<{ labelKey: TranslationKey; href: string }> = [
    { labelKey: 'nav.capture', href: `/study/${code}/capture` },
    { labelKey: 'nav.dashboard', href: `/study/${code}/dashboard` },
  ];
  const settingsTab = { labelKey: 'nav.settings' as TranslationKey, href: `/study/${code}/settings` };

  return (
    <div className="flex flex-col min-h-full bg-white">
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/vanguard-logo.png" alt="Vanguard" width={48} height={52} priority />
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
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
