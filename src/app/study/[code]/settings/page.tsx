'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';

interface HandlingType {
  id: string;
  label: string;
}

interface DemandType {
  id: string;
  category: 'value' | 'failure';
  label: string;
}

interface ContactMethod {
  id: string;
  label: string;
}

interface PointOfTransaction {
  id: string;
  label: string;
}

interface StudyData {
  id: string;
  name: string;
  description: string;
  accessCode: string;
  oneStopHandlingType: string | null;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
  pointsOfTransaction: PointOfTransaction[];
  whatMattersTypes: { id: string; label: string }[];
}

export default function SettingsPage() {
  const params = useParams();
  const code = params.code as string;
  const { t, tl } = useLocale();

  const [study, setStudy] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Add forms
  const [newHandling, setNewHandling] = useState('');
  const [newValueType, setNewValueType] = useState('');
  const [newFailureType, setNewFailureType] = useState('');
  const [newContactMethod, setNewContactMethod] = useState('');
  const [newWhatMattersType, setNewWhatMattersType] = useState('');
  const [newPointOfTransaction, setNewPointOfTransaction] = useState('');

  const loadStudy = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}`);
    if (res.ok) {
      setStudy(await res.json());
    }
    setLoading(false);
  }, [code]);

  useEffect(() => {
    loadStudy();
  }, [loadStudy]);

  async function addHandlingType(e: React.FormEvent) {
    e.preventDefault();
    if (!newHandling.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/handling-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newHandling.trim() }),
    });
    setNewHandling('');
    loadStudy();
  }

  async function removeHandlingType(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/handling-types/${id}`, { method: 'DELETE' });
    loadStudy();
  }

  async function setOneStop(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oneStopHandlingType: id }),
    });
    loadStudy();
  }

  async function addDemandType(e: React.FormEvent, category: 'value' | 'failure') {
    e.preventDefault();
    const label = category === 'value' ? newValueType : newFailureType;
    if (!label.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/demand-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim(), category }),
    });
    if (category === 'value') setNewValueType('');
    else setNewFailureType('');
    loadStudy();
  }

  async function removeDemandType(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/demand-types/${id}`, { method: 'DELETE' });
    loadStudy();
  }

  async function addContactMethodHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!newContactMethod.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/contact-methods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newContactMethod.trim() }),
    });
    setNewContactMethod('');
    loadStudy();
  }

  async function removeContactMethod(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/contact-methods/${id}`, { method: 'DELETE' });
    loadStudy();
  }

  async function addWhatMattersTypeHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!newWhatMattersType.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/what-matters-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newWhatMattersType.trim() }),
    });
    setNewWhatMattersType('');
    loadStudy();
  }

  async function removeWhatMattersType(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/what-matters-types/${id}`, { method: 'DELETE' });
    loadStudy();
  }

  async function addPointOfTransactionHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!newPointOfTransaction.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/points-of-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newPointOfTransaction.trim() }),
    });
    setNewPointOfTransaction('');
    loadStudy();
  }

  async function removePointOfTransaction(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/points-of-transaction/${id}`, { method: 'DELETE' });
    loadStudy();
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cardCls = 'rounded-xl shadow-sm p-5 bg-white border border-gray-200';
  const inputCls = 'flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none';
  const itemCls = 'flex items-center justify-between py-2 px-3 rounded-lg';

  if (loading) return <div className="p-4 text-gray-500">{t('capture.loading')}</div>;
  if (!study) return <div className="p-4 text-red-600">{t('capture.studyNotFound')}</div>;

  const valueTypes = study.demandTypes.filter(dt => dt.category === 'value');
  const failureTypes = study.demandTypes.filter(dt => dt.category === 'failure');

  return (
    <div className="pb-8">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">{t('settings.title')}</h1>

        {/* Access code */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-3 text-gray-900">{t('settings.accessCode')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.shareCode')}</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold tracking-widest px-4 py-2 rounded-lg text-[#ac2c2d] bg-red-50">
              {study.accessCode}
            </span>
            <button onClick={copyCode} className="px-4 py-2 text-sm rounded-lg transition-colors text-gray-600 bg-gray-100 hover:bg-gray-200">
              {copied ? t('settings.copied') : t('settings.copy')}
            </button>
          </div>
        </div>

        {/* Handling types */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.handlingTypes')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.handlingDesc')}</p>
          <ul className="space-y-2 mb-4">
            {study.handlingTypes.map((ht) => (
              <li key={ht.id} className={itemCls}>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{tl(ht.label)}</span>
                  {study.oneStopHandlingType === ht.id && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">{t('settings.oneStop')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {study.oneStopHandlingType !== ht.id && (
                    <button onClick={() => setOneStop(ht.id)} className="text-xs text-blue-600 hover:text-blue-800">{t('settings.setOneStop')}</button>
                  )}
                  <button onClick={() => removeHandlingType(ht.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                </div>
              </li>
            ))}
          </ul>
          <form onSubmit={addHandlingType} className="flex gap-2">
            <input type="text" value={newHandling} onChange={(e) => setNewHandling(e.target.value)} placeholder={t('settings.addHandling')} className={inputCls} />
            <button type="submit" disabled={!newHandling.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]">{t('settings.add')}</button>
          </form>
        </div>

        {/* Contact methods */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.contactMethods')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.contactMethodsDesc')}</p>
          <ul className="space-y-2 mb-4">
            {study.contactMethods.map((cm) => (
              <li key={cm.id} className={itemCls}>
                <span className="text-sm text-gray-800">{tl(cm.label)}</span>
                <button onClick={() => removeContactMethod(cm.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
              </li>
            ))}
          </ul>
          <form onSubmit={addContactMethodHandler} className="flex gap-2">
            <input type="text" value={newContactMethod} onChange={(e) => setNewContactMethod(e.target.value)} placeholder={t('settings.addContactMethod')} className={inputCls} />
            <button type="submit" disabled={!newContactMethod.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]">{t('settings.add')}</button>
          </form>
        </div>

        {/* Points of transaction */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.pointsOfTransaction')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.pointsOfTransactionDesc')}</p>
          <ul className="space-y-2 mb-4">
            {(study.pointsOfTransaction || []).map((pot) => (
              <li key={pot.id} className={itemCls}>
                <span className="text-sm text-gray-800">{tl(pot.label)}</span>
                <button onClick={() => removePointOfTransaction(pot.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
              </li>
            ))}
          </ul>
          <form onSubmit={addPointOfTransactionHandler} className="flex gap-2">
            <input type="text" value={newPointOfTransaction} onChange={(e) => setNewPointOfTransaction(e.target.value)} placeholder={t('settings.addPointOfTransaction')} className={inputCls} />
            <button type="submit" disabled={!newPointOfTransaction.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]">{t('settings.add')}</button>
          </form>
        </div>

        {/* Value demand types */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.valueDemandTypes')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.valueDesc')}</p>
          <ul className="space-y-2 mb-4">
            {valueTypes.map((dt) => (
              <li key={dt.id} className={`${itemCls} bg-green-50`}>
                <span className="text-sm text-green-700">{tl(dt.label)}</span>
                <button onClick={() => removeDemandType(dt.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
              </li>
            ))}
          </ul>
          <form onSubmit={(e) => addDemandType(e, 'value')} className="flex gap-2">
            <input type="text" value={newValueType} onChange={(e) => setNewValueType(e.target.value)} placeholder={t('settings.addValueType')} className={inputCls} />
            <button type="submit" disabled={!newValueType.trim()} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">{t('settings.add')}</button>
          </form>
        </div>

        {/* Failure demand types */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.failureDemandTypes')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.failureDesc')}</p>
          <ul className="space-y-2 mb-4">
            {failureTypes.map((dt) => (
              <li key={dt.id} className={`${itemCls} bg-red-50`}>
                <span className="text-sm text-red-700">{tl(dt.label)}</span>
                <button onClick={() => removeDemandType(dt.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
              </li>
            ))}
          </ul>
          <form onSubmit={(e) => addDemandType(e, 'failure')} className="flex gap-2">
            <input type="text" value={newFailureType} onChange={(e) => setNewFailureType(e.target.value)} placeholder={t('settings.addFailureType')} className={inputCls} />
            <button type="submit" disabled={!newFailureType.trim()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">{t('settings.add')}</button>
          </form>
        </div>

        {/* What Matters Types */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.whatMattersTypes')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.whatMattersTypesDesc')}</p>
          <ul className="space-y-2 mb-4">
            {study.whatMattersTypes.map((wm) => (
              <li key={wm.id} className={`${itemCls} bg-blue-50`}>
                <span className="text-sm text-blue-700">{tl(wm.label)}</span>
                <button onClick={() => removeWhatMattersType(wm.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
              </li>
            ))}
          </ul>
          <form onSubmit={addWhatMattersTypeHandler} className="flex gap-2">
            <input type="text" value={newWhatMattersType} onChange={(e) => setNewWhatMattersType(e.target.value)} placeholder={t('settings.addWhatMattersType')} className={inputCls} />
            <button type="submit" disabled={!newWhatMattersType.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]">{t('settings.add')}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
