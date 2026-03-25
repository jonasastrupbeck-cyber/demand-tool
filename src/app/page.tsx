'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import { LOCALE_LABELS, type Locale } from '@/lib/i18n';

export default function Home() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [accessCode, setAccessCode] = useState('');
  const [studyName, setStudyName] = useState('');
  const [studyDesc, setStudyDesc] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch(`/api/studies/${encodeURIComponent(accessCode.trim().toUpperCase())}`);
    if (!res.ok) {
      setError(t('landing.notFound'));
      setLoading(false);
      return;
    }

    router.push(`/study/${accessCode.trim().toUpperCase()}/capture`);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!studyName.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: studyName.trim(), description: studyDesc.trim(), locale }),
    });

    if (!res.ok) {
      setError(t('landing.createFailed'));
      setLoading(false);
      return;
    }

    const { accessCode: code } = await res.json();
    router.push(`/study/${code}/settings`);
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language selector */}
        <div className="flex justify-end mb-4">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="text-sm rounded-lg px-3 py-1.5 bg-white border border-gray-300 text-gray-600 focus:ring-2 focus:ring-[#ac2c2d] outline-none"
          >
            {Object.entries(LOCALE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="text-center mb-8">
          <img src="/vanguard-logo.png" alt="Vanguard" style={{ width: '140px', height: 'auto', margin: '0 auto 16px' }} />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('app.title')}</h1>
          <p className="text-gray-600">{t('app.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!showCreate ? (
          <div className="space-y-6">
            <form onSubmit={handleJoin} className="rounded-xl shadow-sm p-6 bg-white border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">{t('landing.joinStudy')}</h2>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('landing.accessCode')}
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg text-lg tracking-widest text-center font-mono uppercase text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none"
              />
              <button
                type="submit"
                disabled={loading || accessCode.trim().length < 4}
                className="w-full mt-4 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-[#ac2c2d] hover:bg-[#8a2324]"
              >
                {loading ? t('landing.joining') : t('landing.join')}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setShowCreate(true)}
                className="text-[#ac2c2d] hover:text-[#d4393a] font-medium"
              >
                {t('landing.createNew')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleCreate} className="rounded-xl shadow-sm p-6 bg-white border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">{t('landing.createStudy')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('landing.studyName')}
                  </label>
                  <input
                    type="text"
                    value={studyName}
                    onChange={(e) => setStudyName(e.target.value)}
                    placeholder={t('landing.studyNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('landing.description')}
                  </label>
                  <textarea
                    value={studyDesc}
                    onChange={(e) => setStudyDesc(e.target.value)}
                    placeholder={t('landing.descriptionPlaceholder')}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !studyName.trim()}
                className="w-full mt-4 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-[#ac2c2d] hover:bg-[#8a2324]"
              >
                {loading ? t('landing.creating') : t('landing.create')}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setShowCreate(false)}
                className="text-[#ac2c2d] hover:text-[#d4393a] font-medium"
              >
                {t('landing.joinExisting')}
              </button>
            </div>
          </div>
        )}
      </div>
      <footer className="py-3 text-center">
        <p className="text-[10px] text-gray-400">
          Need help? Visit <a href="https://www.vanguardmetoden.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">www.vanguardmetoden.com</a> or write <a href="mailto:office@vanguard-consult.dk" className="underline hover:text-gray-500">office@vanguard-consult.dk</a>
        </p>
      </footer>
    </main>
  );
}
