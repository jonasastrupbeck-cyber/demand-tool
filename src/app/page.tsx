'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import { LOCALE_LABELS, type Locale } from '@/lib/i18n';

export default function Home() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [accessCode, setAccessCode] = useState('');
  const [studyName, setStudyName] = useState('');
  const [studyDesc, setStudyDesc] = useState('');
  const [contactMethodChoice, setContactMethodChoice] = useState('');
  const [customContactMethod, setCustomContactMethod] = useState('');
  const [pointOfTransaction, setPointOfTransaction] = useState('');
  const [consultantPin, setConsultantPin] = useState('');
  // System type (2026-06-11): the layout regime the study starts in.
  // Transactional preselected — preserves today's behaviour.
  const [systemType, setSystemType] = useState<'transactional' | 'flow'>('transactional');
  const [showCreate, setShowCreate] = useState(false);
  // C2 (2026-06-17): study creation is gated behind a consultant unlock.
  const [showUnlock, setShowUnlock] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Study templates (0052): the library, grouped client-side per system type.
  // Choosing one creates the new study from the template's frozen settings
  // snapshot (name/description/PIN still come from this form).
  const [templates, setTemplates] = useState<{ id: string; name: string; systemType: 'transactional' | 'flow' }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!showCreate) return;
    fetch('/api/templates')
      .then((res) => (res.ok ? res.json() : { templates: [] }))
      .then((data) => setTemplates(data.templates ?? []))
      .catch(() => {});
  }, [showCreate]);

  async function deleteTemplate(id: string) {
    if (!window.confirm(t('create.templateDeleteConfirm'))) return;
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
      setSelectedTemplateId((prev) => (prev === id ? null : prev));
    }
  }

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

  // Open the create flow. If the consultant gate isn't configured (no
  // CONSULTANT_ADMIN_SECRET), go straight to the form to preserve old
  // behaviour; otherwise prompt for the consultant code first.
  async function openCreate() {
    setError('');
    try {
      const res = await fetch('/api/admin-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: '' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.configured === false) {
          setShowCreate(true);
          return;
        }
      }
    } catch {
      // Network issue — fall through to the unlock prompt.
    }
    setShowUnlock(true);
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: adminSecret }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(t('landing.adminCodeInvalid'));
      return;
    }
    setShowUnlock(false);
    setShowCreate(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!studyName.trim()) return;
    setLoading(true);
    setError('');

    // Resolve primary contact method label. Irrelevant when a template is
    // chosen — the template carries contact methods + points of transaction.
    let primaryContactMethod: string | undefined;
    if (!selectedTemplateId) {
      if (contactMethodChoice === 'phone') primaryContactMethod = t('landing.contactPhone');
      else if (contactMethodChoice === 'mail') primaryContactMethod = t('landing.contactMail');
      else if (contactMethodChoice === 'face2face') primaryContactMethod = t('landing.contactFaceToFace');
      else if (contactMethodChoice === 'other' && customContactMethod.trim()) primaryContactMethod = customContactMethod.trim();
    }

    const res = await fetch('/api/studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: studyName.trim(),
        description: studyDesc.trim(),
        locale,
        primaryContactMethod,
        pointOfTransaction: selectedTemplateId ? undefined : pointOfTransaction.trim() || undefined,
        consultantPin: consultantPin.trim() || undefined,
        systemType,
        adminSecret,
        templateId: selectedTemplateId ?? undefined,
      }),
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
            className="text-sm rounded-lg px-3 py-1.5 bg-white border border-gray-300 text-gray-600 focus:ring-2 focus:ring-brand outline-none"
          >
            {Object.entries(LOCALE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="text-center mb-8">
          {/* R5: the landing is the general entry point → Vanguard branding.
              Skipton co-branding appears only inside a flow study (see layout). */}
          <div className="flex items-center justify-center mb-4">
            <Image src="/vanguard-logo.png" alt="Vanguard" width={64} height={70} className="h-16 w-auto" priority />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 whitespace-pre-line leading-tight">{t('app.title')}</h1>
          <p className="text-gray-600 mb-3">{t('app.subtitle')}</p>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">{t('landing.methodContext')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!showCreate && !showUnlock ? (
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
                className="w-full px-4 py-3 rounded-lg text-lg tracking-widest text-center font-mono uppercase text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
              />
              <button
                type="submit"
                disabled={loading || accessCode.trim().length < 4}
                className="w-full mt-4 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-brand hover:bg-brand-hover"
              >
                {loading ? t('landing.joining') : t('landing.join')}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={openCreate}
                className="text-brand hover:text-brand-accent font-medium"
              >
                {t('landing.consultantAccess')}
              </button>
            </div>
          </div>
        ) : showUnlock ? (
          <div className="space-y-6">
            <form onSubmit={handleUnlock} className="rounded-xl shadow-sm p-6 bg-white border border-gray-200">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">{t('landing.consultantAccess')}</h2>
              <p className="text-sm text-gray-500 mb-4">{t('landing.consultantAccessHint')}</p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('landing.adminCode')}
              </label>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder={t('landing.adminCodePlaceholder')}
                autoFocus
                className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
              />
              <button
                type="submit"
                disabled={loading || !adminSecret.trim()}
                className="w-full mt-4 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-brand hover:bg-brand-hover"
              >
                {loading ? t('landing.unlocking') : t('landing.unlock')}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => { setShowUnlock(false); setAdminSecret(''); setError(''); }}
                className="text-brand hover:text-brand-accent font-medium"
              >
                {t('landing.joinExisting')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleCreate} className="rounded-xl shadow-sm p-6 bg-white border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">{t('landing.createStudy')}</h2>
              <div className="space-y-4">
                {/* System type — the first decision: which way in. Two cards,
                    transactional preselected (today's behaviour). */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('create.systemTypeLabel')}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {(['transactional', 'flow'] as const).map((type) => {
                      const isSelected = systemType === type;
                      const isFlowType = type === 'flow';
                      // Flow path carries the Skipton co-brand (mirrors R5): the
                      // selected flow card is Skipton blue, transactional stays
                      // Vanguard red. Skipton hexes match StudyChrome.tsx.
                      const selectedStyle = isSelected && isFlowType
                        ? ({ backgroundColor: '#0072C5', '--tw-ring-color': '#0072C5' } as React.CSSProperties)
                        : undefined;
                      const typeTemplates = templates.filter((tpl) => tpl.systemType === type);
                      return (
                        <div key={type}>
                        <button
                          type="button"
                          onClick={() => {
                            setSystemType(type);
                            // A template belongs to one regime — switching cards
                            // drops a selection from the other one.
                            if (selectedTemplateId && templates.find((tpl) => tpl.id === selectedTemplateId)?.systemType !== type) {
                              setSelectedTemplateId(null);
                            }
                          }}
                          style={selectedStyle}
                          className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                            isSelected
                              ? isFlowType
                                ? 'text-white ring-2 ring-offset-1'
                                : 'bg-brand text-white ring-2 ring-brand ring-offset-1'
                              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <span className="block text-sm font-semibold">
                            {t(type === 'flow' ? 'create.systemTypeFlow' : 'create.systemTypeTransactional')}
                          </span>
                          <span className={`block text-xs mt-0.5 ${isSelected ? (isFlowType ? 'text-blue-100' : 'text-red-100') : 'text-gray-500'}`}>
                            {t(type === 'flow' ? 'create.systemTypeFlowDesc' : 'create.systemTypeTransactionalDesc')}
                          </span>
                        </button>
                        {/* Template library (0052): a smaller box under each card —
                            pick a saved settings-template to start the study from. */}
                        {typeTemplates.length > 0 && (
                          <div className="ml-3 mt-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2">
                            <p className="text-xs font-medium text-gray-500 mb-1.5">{t('create.chooseTemplate')}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {typeTemplates.map((tpl) => {
                                const tplSelected = selectedTemplateId === tpl.id;
                                const tplStyle = tplSelected && isFlowType
                                  ? ({ backgroundColor: '#0072C5' } as React.CSSProperties)
                                  : undefined;
                                return (
                                  <span
                                    key={tpl.id}
                                    className={`inline-flex items-center rounded-full text-xs font-medium ${
                                      tplSelected
                                        ? isFlowType ? 'text-white' : 'bg-brand text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                                    }`}
                                    style={tplStyle}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSystemType(type);
                                        setSelectedTemplateId(tplSelected ? null : tpl.id);
                                      }}
                                      className="pl-2.5 py-1"
                                    >
                                      {tpl.name}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteTemplate(tpl.id)}
                                      aria-label={`${t('create.chooseTemplate')}: ${tpl.name} ×`}
                                      className={`px-1.5 py-1 ${tplSelected ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                      ×
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                            {selectedTemplateId && typeTemplates.some((tpl) => tpl.id === selectedTemplateId) && (
                              <p className="text-[11px] text-gray-400 mt-1.5">{t('create.templateHint')}</p>
                            )}
                          </div>
                        )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('landing.studyName')}
                  </label>
                  <input
                    type="text"
                    value={studyName}
                    onChange={(e) => setStudyName(e.target.value)}
                    placeholder={t('landing.studyNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
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
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                  />
                </div>
                {/* Flow studies capture context per case, not per study — a flow
                    consultant only needs name/description/PIN. Transactional keeps
                    the full create form (contact method + point of transaction),
                    unless a template is chosen — the template carries both. */}
                {systemType !== 'flow' && !selectedTemplateId && (
                <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('landing.contactMethodQuestion')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['none', 'phone', 'mail', 'face2face', 'other'] as const).map((choice) => {
                      const labelKey = choice === 'none' ? 'landing.contactNone'
                        : choice === 'phone' ? 'landing.contactPhone'
                        : choice === 'mail' ? 'landing.contactMail'
                        : choice === 'face2face' ? 'landing.contactFaceToFace'
                        : 'landing.contactOther';
                      const isSelected = contactMethodChoice === choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => setContactMethodChoice(choice === contactMethodChoice ? '' : choice)}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-brand text-white ring-2 ring-brand ring-offset-1'
                              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-400'
                          } ${choice === 'other' ? 'col-span-2' : ''}`}
                        >
                          {t(labelKey as Parameters<typeof t>[0])}
                        </button>
                      );
                    })}
                  </div>
                  {contactMethodChoice === 'other' && (
                    <input
                      type="text"
                      value={customContactMethod}
                      onChange={(e) => setCustomContactMethod(e.target.value)}
                      placeholder={t('landing.contactOtherPlaceholder')}
                      className="w-full mt-2 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('landing.pointOfTransactionQuestion')}
                  </label>
                  <input
                    type="text"
                    value={pointOfTransaction}
                    onChange={(e) => setPointOfTransaction(e.target.value)}
                    placeholder={t('landing.pointOfTransactionPlaceholder')}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                  />
                </div>
                </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('landing.consultantPin')}
                  </label>
                  <input
                    type="password"
                    value={consultantPin}
                    onChange={(e) => setConsultantPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={t('landing.consultantPinPlaceholder')}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !studyName.trim()}
                className="w-full mt-4 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-brand hover:bg-brand-hover"
              >
                {loading ? t('landing.creating') : t('landing.create')}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setShowCreate(false)}
                className="text-brand hover:text-brand-accent font-medium"
              >
                {t('landing.joinExisting')}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
