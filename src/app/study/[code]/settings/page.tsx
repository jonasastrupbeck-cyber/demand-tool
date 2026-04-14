'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import type { TranslationKey } from '@/lib/i18n';

interface HandlingType {
  id: string;
  label: string;
  operationalDefinition: string | null;
}

interface DemandType {
  id: string;
  category: 'value' | 'failure';
  label: string;
  operationalDefinition: string | null;
}

interface ContactMethod {
  id: string;
  label: string;
}

interface PointOfTransaction {
  id: string;
  label: string;
}

interface WorkType {
  id: string;
  label: string;
}

interface SystemConditionType {
  id: string;
  label: string;
  operationalDefinition: string | null;
}

interface StudyData {
  id: string;
  name: string;
  description: string;
  purpose: string | null;
  accessCode: string;
  oneStopHandlingType: string | null;
  workTrackingEnabled: boolean;
  systemConditionsEnabled: boolean;
  demandTypesEnabled: boolean;
  workTypesEnabled: boolean;
  volumeMode: boolean;
  activeLayer: number;
  consultantPin: string | null;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
  pointsOfTransaction: PointOfTransaction[];
  whatMattersTypes: { id: string; label: string; operationalDefinition: string | null }[];
  workTypes: WorkType[];
  systemConditions: SystemConditionType[];
}

export default function SettingsPage() {
  const params = useParams();
  const code = params.code as string;
  const { t, tl } = useLocale();

  const [study, setStudy] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // PIN gate
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');

  // Layer activation
  const [activatingLayer, setActivatingLayer] = useState(false);

  // Purpose
  const [purposeInput, setPurposeInput] = useState('');
  const [purposeSaved, setPurposeSaved] = useState(false);

  // Form preview
  const [showPreview, setShowPreview] = useState(false);

  // Add forms
  const [newHandling, setNewHandling] = useState('');
  const [newValueType, setNewValueType] = useState('');
  const [newFailureType, setNewFailureType] = useState('');
  const [newContactMethod, setNewContactMethod] = useState('');
  const [newWhatMattersType, setNewWhatMattersType] = useState('');
  const [newPointOfTransaction, setNewPointOfTransaction] = useState('');
  const [newWorkType, setNewWorkType] = useState('');
  const [newSystemCondition, setNewSystemCondition] = useState('');

  // Operational definition editing
  const [editingDefId, setEditingDefId] = useState<string | null>(null);
  const [editingDefValue, setEditingDefValue] = useState('');
  const [editingDefType, setEditingDefType] = useState<'handling' | 'demand' | 'whatMatters' | 'systemCondition'>('handling');

  const loadStudy = useCallback(async () => {
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      setStudy(data);
      setPurposeInput(data.purpose || '');
    }
    setLoading(false);
  }, [code]);

  useEffect(() => {
    loadStudy();
  }, [loadStudy]);

  // Check localStorage for saved PIN on load
  useEffect(() => {
    if (study) {
      if (!study.consultantPin) {
        // No PIN set — unlocked but should prompt to set one
        setIsUnlocked(true);
      } else {
        const savedPin = localStorage.getItem(`consultant_pin_${code}`);
        if (savedPin === study.consultantPin) {
          setIsUnlocked(true);
        }
      }
    }
  }, [study, code]);

  function handlePinUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (study && pinInput === study.consultantPin) {
      setIsUnlocked(true);
      setPinError(false);
      localStorage.setItem(`consultant_pin_${code}`, pinInput);
    } else {
      setPinError(true);
    }
  }

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    if (!newPinInput.trim() || newPinInput.length < 4) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultantPin: newPinInput.trim() }),
    });
    localStorage.setItem(`consultant_pin_${code}`, newPinInput.trim());
    setNewPinInput('');
    loadStudy();
  }

  async function handleActivateLayer() {
    if (!study) return;
    const nextLayer = study.activeLayer + 1;
    if (nextLayer > 5) return;

    // Check if there are pending reclassification items for the current layer
    const currentLayer = study.activeLayer;
    let reclassifyCount = 0;
    if (currentLayer >= 2) {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/reclassify?layer=${currentLayer}`);
      if (res.ok) {
        const data = await res.json();
        reclassifyCount = data.entries?.length || 0;
      }
    }

    const confirmMsg = reclassifyCount > 0
      ? t('layers.reclassifyWarning', { count: String(reclassifyCount) })
      : t('layers.noReclassifyNeeded', { layer: String(nextLayer) });

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    setActivatingLayer(true);
    const pin = localStorage.getItem(`consultant_pin_${code}`) || '';
    await fetch(`/api/studies/${encodeURIComponent(code)}/activate-layer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, targetLayer: nextLayer }),
    });
    setActivatingLayer(false);
    loadStudy();
  }

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

  async function toggleWorkTracking() {
    const newValue = !study?.workTrackingEnabled;
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workTrackingEnabled: newValue }),
    });
    loadStudy();
  }

  async function addWorkTypeHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkType.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/work-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newWorkType.trim() }),
    });
    setNewWorkType('');
    loadStudy();
  }

  async function removeWorkType(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/work-types/${id}`, { method: 'DELETE' });
    loadStudy();
  }

  async function toggleDemandTypes() {
    const newValue = !study?.demandTypesEnabled;
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demandTypesEnabled: newValue }),
    });
    loadStudy();
  }

  async function toggleVolumeMode() {
    const newValue = !study?.volumeMode;
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volumeMode: newValue }),
    });
    loadStudy();
  }

  async function toggleWorkTypes() {
    const newValue = !study?.workTypesEnabled;
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workTypesEnabled: newValue }),
    });
    loadStudy();
  }

  async function toggleSystemConditions() {
    const newValue = !study?.systemConditionsEnabled;
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemConditionsEnabled: newValue }),
    });
    loadStudy();
  }

  async function addSystemConditionHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!newSystemCondition.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/system-conditions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newSystemCondition.trim() }),
    });
    setNewSystemCondition('');
    loadStudy();
  }

  async function removeSystemCondition(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/system-conditions/${id}`, { method: 'DELETE' });
    loadStudy();
  }

  function startEditDef(id: string, currentDef: string | null, type: 'handling' | 'demand' | 'whatMatters' | 'systemCondition') {
    setEditingDefId(id);
    setEditingDefValue(currentDef || '');
    setEditingDefType(type);
  }

  async function saveOperationalDefinition() {
    if (!editingDefId) return;
    const typePathMap = { handling: 'handling-types', demand: 'demand-types', whatMatters: 'what-matters-types', systemCondition: 'system-conditions' };
    await fetch(`/api/studies/${encodeURIComponent(code)}/${typePathMap[editingDefType]}/${editingDefId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationalDefinition: editingDefValue.trim() }),
    });
    setEditingDefId(null);
    setEditingDefValue('');
    loadStudy();
  }

  async function savePurpose() {
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose: purposeInput.trim() }),
    });
    setPurposeSaved(true);
    setTimeout(() => setPurposeSaved(false), 2000);
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

  // PIN gate: if study has a PIN and user hasn't unlocked
  if (study.consultantPin && !isUnlocked) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <form onSubmit={handlePinUnlock} className="rounded-xl shadow-sm p-6 bg-white border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">{t('consultant.enterPin')}</h2>
            {pinError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{t('consultant.wrongPin')}</div>
            )}
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="PIN"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-lg tracking-widest text-center font-mono text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none"
            />
            <button
              type="submit"
              disabled={pinInput.length < 4}
              className="w-full mt-4 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-[#ac2c2d] hover:bg-[#8a2324]"
            >
              {t('consultant.unlock')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const valueTypes = study.demandTypes.filter(dt => dt.category === 'value');
  const failureTypes = study.demandTypes.filter(dt => dt.category === 'failure');

  const layerDescriptions: Record<number, string> = {
    1: t('layers.description1'),
    2: t('layers.description2'),
    3: t('layers.description3'),
    4: t('layers.description4'),
    5: t('layers.description5'),
  };

  return (
    <div className="pb-8">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">{t('settings.title')}</h1>

        {/* Set PIN prompt (for studies without a PIN) */}
        {!study.consultantPin && (
          <div className="rounded-xl shadow-sm p-5 bg-amber-50 border border-amber-200">
            <h2 className="text-base font-semibold mb-1 text-gray-900">{t('consultant.setPin')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('consultant.setPinDesc')}</p>
            <form onSubmit={handleSetPin} className="flex gap-2">
              <input
                type="password"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="1234"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none"
              />
              <button type="submit" disabled={newPinInput.length < 4} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]">{t('settings.add')}</button>
            </form>
          </div>
        )}

        {/* Purpose statement — first per Vanguard Method */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.purpose')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.purposeDesc')}</p>
          <textarea
            value={purposeInput}
            onChange={(e) => setPurposeInput(e.target.value)}
            placeholder={t('settings.purposePlaceholder')}
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-[#ac2c2d] focus:border-[#ac2c2d] outline-none mb-2"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={savePurpose}
              disabled={purposeInput.trim() === (study.purpose || '')}
              className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors bg-[#ac2c2d] hover:bg-[#8a2324]"
            >
              {t('settings.save')}
            </button>
            {purposeSaved && <span className="text-sm text-green-600">{t('settings.saved')}</span>}
          </div>
        </div>

        {/* Layer Control */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-3 text-gray-900">{t('layers.title')}</h2>
          <div className="space-y-2 mb-4">
            {[1, 2, 3, 4, 5].map((layer) => {
              const isActive = study.activeLayer >= layer;
              const isNext = layer === study.activeLayer + 1;
              return (
                <div
                  key={layer}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    isActive ? 'bg-green-50 border border-green-200' : isNext ? 'bg-gray-50 border border-dashed border-gray-300' : 'bg-gray-50 border border-gray-100 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isActive ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'}`}>
                      {layer}
                    </span>
                    <span className={`text-sm ${isActive ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                      {layerDescriptions[layer]}
                    </span>
                  </div>
                  {isActive && (
                    <span className="text-xs text-green-600 font-medium">&#10003;</span>
                  )}
                </div>
              );
            })}
          </div>
          {study.activeLayer < 5 ? (
            <>
              <div className="p-3 mb-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-medium text-amber-800 mb-1">{t('layers.guidanceTitle', { layer: String(study.activeLayer + 1) })}</p>
                <p className="text-xs text-amber-700">{t(`layers.guidance${study.activeLayer + 1}` as TranslationKey)}</p>
              </div>
              {(() => {
                const next = study.activeLayer + 1;
                const prereqKey = `layers.prereq${next}` as TranslationKey;
                const hasPrereq = next >= 2 && next <= 5;
                const prereqMet = next === 2
                  ? true
                  : next === 3 ? study.handlingTypes.length > 0
                  : next === 5 ? study.whatMattersTypes.length > 0
                  : true; // layer 4 has no hard prereq, just guidance
                if (hasPrereq && !prereqMet) {
                  return (
                    <div className="p-2.5 mb-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-xs text-red-700">{t(prereqKey)}</p>
                    </div>
                  );
                }
                return null;
              })()}
              <button
                onClick={handleActivateLayer}
                disabled={activatingLayer}
                className="w-full px-4 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors bg-[#ac2c2d] hover:bg-[#8a2324]"
              >
                {activatingLayer ? '...' : t('layers.activate', { layer: String(study.activeLayer + 1) })}
              </button>
            </>
          ) : (
            <p className="text-sm text-green-600 font-medium text-center">{t('layers.allActive')}</p>
          )}
        </div>

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



        {/* Handling types (Layer 3+) */}
        {study.activeLayer >= 3 && <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.handlingTypes')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.handlingDesc')}</p>
          <ul className="space-y-2 mb-4">
            {study.handlingTypes.map((ht) => (
              <li key={ht.id} className="py-2 px-3 rounded-lg">
                <div className="flex items-center justify-between">
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
                </div>
                {editingDefId === ht.id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={editingDefValue}
                      onChange={(e) => setEditingDefValue(e.target.value)}
                      placeholder={t('settings.operationalDefinitionPlaceholder')}
                      className="flex-1 px-2 py-1 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:ring-1 focus:ring-[#ac2c2d] outline-none"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveOperationalDefinition(); if (e.key === 'Escape') setEditingDefId(null); }}
                    />
                    <button onClick={saveOperationalDefinition} className="text-xs px-2 py-1 bg-[#ac2c2d] text-white rounded">{t('settings.add')}</button>
                    <button onClick={() => setEditingDefId(null)} className="text-xs px-2 py-1 text-gray-500">&times;</button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditDef(ht.id, ht.operationalDefinition, 'handling')}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-600 italic"
                  >
                    {ht.operationalDefinition || t('settings.operationalDefinition') + '...'}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={addHandlingType} className="flex gap-2">
            <input type="text" value={newHandling} onChange={(e) => setNewHandling(e.target.value)} placeholder={t('settings.addHandling')} className={inputCls} />
            <button type="submit" disabled={!newHandling.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]">{t('settings.add')}</button>
          </form>
        </div>}

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

        {/* Demand Types */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.demandTypes')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.demandTypesDesc')}</p>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <div className="relative">
              <input
                type="checkbox"
                checked={study.demandTypesEnabled}
                onChange={toggleDemandTypes}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#ac2c2d] transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-gray-700 font-medium">{t('settings.enableDemandTypes')}</span>
          </label>
          {study.demandTypesEnabled && (
            <>
              {/* Value demand types */}
              <h3 className="text-sm font-semibold mb-1 text-green-700">{t('settings.valueDemandTypes')}</h3>
              <p className="text-xs text-gray-500 mb-2">{t('settings.valueDesc')}</p>
              <ul className="space-y-2 mb-4">
                {valueTypes.map((dt) => (
                  <li key={dt.id} className="py-2 px-3 rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">{tl(dt.label)}</span>
                      <button onClick={() => removeDemandType(dt.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                    </div>
                    {editingDefId === dt.id ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={editingDefValue}
                          onChange={(e) => setEditingDefValue(e.target.value)}
                          placeholder={t('settings.operationalDefinitionPlaceholder')}
                          className="flex-1 px-2 py-1 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:ring-1 focus:ring-[#ac2c2d] outline-none"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') saveOperationalDefinition(); if (e.key === 'Escape') setEditingDefId(null); }}
                        />
                        <button onClick={saveOperationalDefinition} className="text-xs px-2 py-1 bg-[#ac2c2d] text-white rounded">{t('settings.add')}</button>
                        <button onClick={() => setEditingDefId(null)} className="text-xs px-2 py-1 text-gray-500">&times;</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditDef(dt.id, dt.operationalDefinition, 'demand')}
                        className="mt-1 text-xs text-gray-400 hover:text-gray-600 italic"
                      >
                        {dt.operationalDefinition || t('settings.operationalDefinition') + '...'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <form onSubmit={(e) => addDemandType(e, 'value')} className="flex gap-2 mb-6">
                <input type="text" value={newValueType} onChange={(e) => setNewValueType(e.target.value)} placeholder={t('settings.addValueType')} className={inputCls} />
                <button type="submit" disabled={!newValueType.trim()} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">{t('settings.add')}</button>
              </form>

              {/* Failure demand types */}
              <h3 className="text-sm font-semibold mb-1 text-red-700">{t('settings.failureDemandTypes')}</h3>
              <p className="text-xs text-gray-500 mb-2">{t('settings.failureDesc')}</p>
              <ul className="space-y-2 mb-4">
                {failureTypes.map((dt) => (
                  <li key={dt.id} className="py-2 px-3 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-700">{tl(dt.label)}</span>
                      <button onClick={() => removeDemandType(dt.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                    </div>
                    {editingDefId === dt.id ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={editingDefValue}
                          onChange={(e) => setEditingDefValue(e.target.value)}
                          placeholder={t('settings.operationalDefinitionPlaceholder')}
                          className="flex-1 px-2 py-1 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:ring-1 focus:ring-[#ac2c2d] outline-none"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') saveOperationalDefinition(); if (e.key === 'Escape') setEditingDefId(null); }}
                        />
                        <button onClick={saveOperationalDefinition} className="text-xs px-2 py-1 bg-[#ac2c2d] text-white rounded">{t('settings.add')}</button>
                        <button onClick={() => setEditingDefId(null)} className="text-xs px-2 py-1 text-gray-500">&times;</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditDef(dt.id, dt.operationalDefinition, 'demand')}
                        className="mt-1 text-xs text-gray-400 hover:text-gray-600 italic"
                      >
                        {dt.operationalDefinition || t('settings.operationalDefinition') + '...'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <form onSubmit={(e) => addDemandType(e, 'failure')} className="flex gap-2">
                <input type="text" value={newFailureType} onChange={(e) => setNewFailureType(e.target.value)} placeholder={t('settings.addFailureType')} className={inputCls} />
                <button type="submit" disabled={!newFailureType.trim()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">{t('settings.add')}</button>
              </form>
            </>
          )}
        </div>

        {/* System Conditions */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.systemConditions')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.systemConditionsDesc')}</p>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <div className="relative">
              <input
                type="checkbox"
                checked={study.systemConditionsEnabled}
                onChange={toggleSystemConditions}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-red-600 transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-gray-700 font-medium">{t('settings.enableSystemConditions')}</span>
          </label>
          {study.systemConditionsEnabled && (
            <>
              <ul className="space-y-2 mb-4">
                {(study.systemConditions || []).map((sc) => (
                  <li key={sc.id} className="py-2 px-3 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-700">{tl(sc.label)}</span>
                      <button onClick={() => removeSystemCondition(sc.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                    </div>
                    {editingDefId === sc.id ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={editingDefValue}
                          onChange={(e) => setEditingDefValue(e.target.value)}
                          placeholder={t('settings.operationalDefinitionPlaceholder')}
                          className="flex-1 px-2 py-1 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:ring-1 focus:ring-[#ac2c2d] outline-none"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') saveOperationalDefinition(); if (e.key === 'Escape') setEditingDefId(null); }}
                        />
                        <button onClick={saveOperationalDefinition} className="text-xs px-2 py-1 bg-[#ac2c2d] text-white rounded">{t('settings.add')}</button>
                        <button onClick={() => setEditingDefId(null)} className="text-xs px-2 py-1 text-gray-500">&times;</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditDef(sc.id, sc.operationalDefinition, 'systemCondition')}
                        className="mt-1 text-xs text-gray-400 hover:text-gray-600 italic"
                      >
                        {sc.operationalDefinition || t('settings.operationalDefinition') + '...'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <form onSubmit={addSystemConditionHandler} className="flex gap-2">
                <input type="text" value={newSystemCondition} onChange={(e) => setNewSystemCondition(e.target.value)} placeholder={t('settings.addSystemCondition')} className={inputCls} />
                <button type="submit" disabled={!newSystemCondition.trim()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">{t('settings.add')}</button>
              </form>
            </>
          )}
        </div>

        {/* What Matters Types */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.whatMattersTypes')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.whatMattersTypesDesc')}</p>
          <ul className="space-y-2 mb-4">
            {study.whatMattersTypes.map((wm) => (
              <li key={wm.id} className="py-2 px-3 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">{tl(wm.label)}</span>
                  <button onClick={() => removeWhatMattersType(wm.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                </div>
                {editingDefId === wm.id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={editingDefValue}
                      onChange={(e) => setEditingDefValue(e.target.value)}
                      placeholder={t('settings.operationalDefinitionPlaceholder')}
                      className="flex-1 px-2 py-1 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:ring-1 focus:ring-[#ac2c2d] outline-none"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveOperationalDefinition(); if (e.key === 'Escape') setEditingDefId(null); }}
                    />
                    <button onClick={saveOperationalDefinition} className="text-xs px-2 py-1 bg-[#ac2c2d] text-white rounded">{t('settings.add')}</button>
                    <button onClick={() => setEditingDefId(null)} className="text-xs px-2 py-1 text-gray-500">&times;</button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditDef(wm.id, wm.operationalDefinition, 'whatMatters')}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-600 italic"
                  >
                    {wm.operationalDefinition || t('settings.operationalDefinition') + '...'}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={addWhatMattersTypeHandler} className="flex gap-2">
            <input type="text" value={newWhatMattersType} onChange={(e) => setNewWhatMattersType(e.target.value)} placeholder={t('settings.addWhatMattersType')} className={inputCls} />
            <button type="submit" disabled={!newWhatMattersType.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]">{t('settings.add')}</button>
          </form>
        </div>

        {/* Work Tracking */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.workTracking')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.workTrackingDesc')}</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={study.workTrackingEnabled}
                onChange={toggleWorkTracking}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#ac2c2d] transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-gray-700 font-medium">{t('settings.enableWorkTracking')}</span>
          </label>
        </div>

        {/* Work Types (only when work tracking enabled) */}
        {study.workTrackingEnabled && (
          <div className={cardCls}>
            <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.workTypes')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('settings.workTypesDesc')}</p>
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={study.workTypesEnabled}
                  onChange={toggleWorkTypes}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-amber-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{t('settings.enableWorkTypes')}</span>
            </label>
            {study.workTypesEnabled && (
              <>
                <ul className="space-y-2 mb-4">
                  {(study.workTypes || []).map((wt) => (
                    <li key={wt.id} className={`${itemCls} bg-amber-50`}>
                      <span className="text-sm text-amber-700">{tl(wt.label)}</span>
                      <button onClick={() => removeWorkType(wt.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                    </li>
                  ))}
                </ul>
                <form onSubmit={addWorkTypeHandler} className="flex gap-2">
                  <input type="text" value={newWorkType} onChange={(e) => setNewWorkType(e.target.value)} placeholder={t('settings.addWorkType')} className={inputCls} />
                  <button type="submit" disabled={!newWorkType.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-amber-600 hover:bg-amber-700">{t('settings.add')}</button>
                </form>
              </>
            )}
          </div>
        )}
        {/* Volume Mode */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.volumeMode')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.volumeModeDesc')}</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={study.volumeMode}
                onChange={toggleVolumeMode}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#ac2c2d] transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-gray-700 font-medium">{t('settings.enableVolumeMode')}</span>
          </label>
        </div>

        {/* Capture form preview */}
        <div className={cardCls}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-base font-semibold text-gray-900">{t('settings.formPreview')}</h2>
            <span className="text-gray-400 text-xs">{showPreview ? '▲' : '▼'}</span>
          </button>
          {showPreview && (
            <div className="mt-4 space-y-3 pointer-events-none opacity-75">
              <p className="text-xs text-gray-500 italic">{t('settings.formPreviewDesc')}</p>
              {/* Verbatim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('capture.verbatimLabel')}</label>
                <textarea disabled rows={2} placeholder={t('capture.verbatimPlaceholder')} className="w-full px-3 py-2 rounded-lg text-sm text-gray-400 bg-gray-50 border border-gray-200" />
              </div>
              {/* Contact method */}
              {study.contactMethods.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('capture.contactMethodLabel')}</label>
                  <select disabled className="w-full px-3 py-2 rounded-lg text-sm text-gray-400 bg-gray-50 border border-gray-200">
                    <option>{t('capture.selectContactMethod')}</option>
                    {study.contactMethods.map(cm => <option key={cm.id}>{tl(cm.label)}</option>)}
                  </select>
                </div>
              )}
              {/* Point of transaction */}
              {(study.pointsOfTransaction || []).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('capture.pointOfTransactionLabel')}</label>
                  <select disabled className="w-full px-3 py-2 rounded-lg text-sm text-gray-400 bg-gray-50 border border-gray-200">
                    <option>{t('capture.selectPointOfTransaction')}</option>
                    {(study.pointsOfTransaction || []).map(pot => <option key={pot.id}>{tl(pot.label)}</option>)}
                  </select>
                </div>
              )}
              {/* Classification (Layer 2+) */}
              {study.activeLayer >= 2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('capture.classification')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="py-2 text-center rounded-lg text-sm border border-green-200 bg-green-50 text-green-700">{t('capture.value')}</div>
                    <div className="py-2 text-center rounded-lg text-sm border border-red-200 bg-red-50 text-red-700">{t('capture.failure')}</div>
                  </div>
                </div>
              )}
              {/* Demand type (Layer 2+) */}
              {study.activeLayer >= 2 && valueTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('capture.demandTypeLabel', { classification: '' })}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {valueTypes.map(dt => (
                      <span key={dt.id} className="text-xs px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700">{tl(dt.label)}</span>
                    ))}
                    {failureTypes.map(dt => (
                      <span key={dt.id} className="text-xs px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700">{tl(dt.label)}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Handling (Layer 3+) */}
              {study.activeLayer >= 3 && study.handlingTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('capture.handlingLabel')}</label>
                  <select disabled className="w-full px-3 py-2 rounded-lg text-sm text-gray-400 bg-gray-50 border border-gray-200">
                    <option>{t('capture.selectHandling')}</option>
                    {study.handlingTypes.map(ht => <option key={ht.id}>{tl(ht.label)}</option>)}
                  </select>
                </div>
              )}
              {/* What matters */}
              {study.whatMattersTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('capture.whatMattersLabel')}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {study.whatMattersTypes.map(wm => (
                      <span key={wm.id} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">{tl(wm.label)}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Submit button */}
              <button disabled className="w-full px-4 py-3 text-white rounded-lg font-medium bg-[#ac2c2d] opacity-50">
                {t('capture.save')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
