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
