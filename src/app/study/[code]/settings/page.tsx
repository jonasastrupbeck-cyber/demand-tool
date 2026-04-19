'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import CaptureTogglesPanel from '@/components/CaptureTogglesPanel';
import SegmentedToggle from '@/components/SegmentedToggle';

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
  lifecycleStageId: string | null;
  lifecycleAiSuggestion: string | null;
}

interface LifecycleStage {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
}

interface ContactMethod {
  id: string;
  label: string;
}

interface PointOfTransaction {
  id: string;
  label: string;
  customerFacing: boolean;
}

interface WorkType {
  id: string;
  label: string;
  lifecycleStageId?: string | null;
  lifecycleAiSuggestion?: string | null;
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
  workStepTypesEnabled: boolean;
  volumeMode: boolean;
  lifecycleEnabled: boolean;
  activeLayer: number;
  classificationEnabled: boolean;
  handlingEnabled: boolean;
  valueLinkingEnabled: boolean;
  // Iterative-build toggles (migration 0013).
  whatMattersEnabled: boolean;
  thinkingsEnabled: boolean;
  lifeProblemsEnabled: boolean;
  consultantPin: string | null;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
  pointsOfTransaction: PointOfTransaction[];
  whatMattersTypes: { id: string; label: string; operationalDefinition: string | null }[];
  lifeProblems: { id: string; label: string; operationalDefinition: string | null }[];
  workTypes: WorkType[];
  workStepTypes: { id: string; label: string; tag: 'value' | 'failure'; operationalDefinition: string | null; sortOrder: number }[];
  systemConditions: SystemConditionType[];
  thinkings: SystemConditionType[];
  lifecycleStages: LifecycleStage[];
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
  // Phase 4 (2026-04-16) — Work Step Types add-form state.
  const [newWorkStep, setNewWorkStep] = useState('');
  const [newWorkStepTag, setNewWorkStepTag] = useState<'value' | 'failure'>('value');

  // Phase 4B (2026-04-16) — Synthesis modal state.
  type Cluster = {
    tag: 'value' | 'failure';
    suggestedLabel: string;
    blockCount: number;
    exampleTexts: string[];
    blockIds: string[];
  };
  const [synthesiseOpen, setSynthesiseOpen] = useState(false);
  const [synthesiseLoading, setSynthesiseLoading] = useState(false);
  const [synthesiseData, setSynthesiseData] = useState<{ clusters: Cluster[]; totalOrphans: number } | null>(null);
  const [synthesiseDismissed, setSynthesiseDismissed] = useState<Set<string>>(new Set());
  const [synthesiseEdits, setSynthesiseEdits] = useState<Record<string, string>>({});
  const [newSystemCondition, setNewSystemCondition] = useState('');
  const [newThinking, setNewThinking] = useState('');
  const [newLifeProblem, setNewLifeProblem] = useState('');
  const [newLifecycleStage, setNewLifecycleStage] = useState('');
  const [classifyingAll, setClassifyingAll] = useState(false);

  // Operational definition editing
  const [editingDefId, setEditingDefId] = useState<string | null>(null);
  const [editingDefValue, setEditingDefValue] = useState('');
  const [editingDefType, setEditingDefType] = useState<'handling' | 'demand' | 'whatMatters' | 'systemCondition' | 'lifeProblem'>('handling');

  // Label editing (covers all 9 taxonomies — Ali feedback 2026-04-16: fix a typo
  // in a COR title, etc. Previously the only editable field per row was
  // operationalDefinition; the label itself required delete-and-re-add which
  // broke existing references.)
  type LabelEditType = 'handling' | 'demand' | 'contactMethod' | 'pointOfTransaction' | 'whatMatters' | 'systemCondition' | 'thinking' | 'lifeProblem' | 'workType' | 'workStepType';
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');
  const [editingLabelType, setEditingLabelType] = useState<LabelEditType>('handling');

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
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/demand-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim(), category }),
    });
    if (category === 'value') setNewValueType('');
    else setNewFailureType('');
    // Fire-and-forget AI lifecycle classification if enabled
    if (study?.lifecycleEnabled && res.ok) {
      try {
        const { id: newId } = await res.json();
        if (newId) {
          fetch(`/api/studies/${encodeURIComponent(code)}/demand-types/${newId}/classify-lifecycle`, { method: 'POST' })
            .then(() => loadStudy())
            .catch(() => {});
        }
      } catch { /* noop */ }
    }
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

  async function addLifeProblemHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!newLifeProblem.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/life-problems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLifeProblem.trim() }),
    });
    setNewLifeProblem('');
    loadStudy();
  }

  async function removeLifeProblem(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/life-problems/${id}`, { method: 'DELETE' });
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

  async function togglePointOfTransactionCustomerFacing(id: string, customerFacing: boolean) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/points-of-transaction/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerFacing }),
    });
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
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/work-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newWorkType.trim() }),
    });
    setNewWorkType('');
    if (study?.lifecycleEnabled && res.ok) {
      try {
        const { id: newId } = await res.json();
        if (newId) {
          fetch(`/api/studies/${encodeURIComponent(code)}/work-types/${newId}/classify-lifecycle`, { method: 'POST' })
            .then(() => loadStudy())
            .catch(() => {});
        }
      } catch { /* noop */ }
    }
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

  // Phase 4 (2026-04-16) — Work Step Types
  async function toggleWorkStepTypes() {
    const newValue = !study?.workStepTypesEnabled;
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workStepTypesEnabled: newValue }),
    });
    loadStudy();
  }

  async function addWorkStepHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkStep.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/work-step-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newWorkStep.trim(), tag: newWorkStepTag }),
    });
    setNewWorkStep('');
    loadStudy();
  }

  async function removeWorkStep(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/work-step-types/${id}`, { method: 'DELETE' });
    loadStudy();
  }

  async function updateWorkStepTag(id: string, tag: 'value' | 'failure') {
    await fetch(`/api/studies/${encodeURIComponent(code)}/work-step-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    });
    loadStudy();
  }

  // Phase 4B — synthesis helper actions.
  // Fetch clusters from the synthesis endpoint. Called when opening the modal
  // and after each promote action to refresh the state.
  const loadSynthesis = useCallback(async () => {
    setSynthesiseLoading(true);
    try {
      const r = await fetch(`/api/studies/${encodeURIComponent(code)}/work-step-types/synthesis`);
      if (r.ok) {
        const d = await r.json();
        setSynthesiseData({ clusters: d.clusters, totalOrphans: d.totalOrphans });
      }
    } finally {
      setSynthesiseLoading(false);
    }
  }, [code]);

  function openSynthesiseModal() {
    setSynthesiseDismissed(new Set());
    setSynthesiseEdits({});
    setSynthesiseOpen(true);
    loadSynthesis();
  }

  function clusterKey(c: Cluster): string {
    // Stable-ish key for session state (dismissed set, edited labels).
    // Block IDs are the most reliable identifier for a cluster across re-fetches.
    return c.blockIds.slice().sort().join(',');
  }

  function dismissCluster(c: Cluster) {
    setSynthesiseDismissed(prev => {
      const next = new Set(prev);
      next.add(clusterKey(c));
      return next;
    });
  }

  async function promoteCluster(c: Cluster) {
    const label = (synthesiseEdits[clusterKey(c)] ?? c.suggestedLabel).trim();
    if (!label) return;
    const r = await fetch(`/api/studies/${encodeURIComponent(code)}/work-step-types/synthesis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, tag: c.tag, blockIds: c.blockIds }),
    });
    if (r.ok) {
      // Refresh both the synthesis list and the study payload (new step appears in the taxonomy).
      await loadSynthesis();
      loadStudy();
    }
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

  async function addThinkingHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!newThinking.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/thinkings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newThinking.trim() }),
    });
    setNewThinking('');
    loadStudy();
  }

  async function removeThinking(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/thinkings/${id}`, { method: 'DELETE' });
    loadStudy();
  }

  // --- Lifecycle ---
  async function toggleLifecycle() {
    const newValue = !study?.lifecycleEnabled;
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lifecycleEnabled: newValue }),
    });
    await loadStudy();
    // When turning on for the first time, kick off auto-classification of existing types in the background
    if (newValue) {
      classifyAllTypes(false);
    }
  }

  async function addLifecycleStageHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!newLifecycleStage.trim()) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/lifecycle-stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLifecycleStage.trim() }),
    });
    setNewLifecycleStage('');
    loadStudy();
  }

  async function removeLifecycleStage(id: string) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/lifecycle-stages/${id}`, { method: 'DELETE' });
    loadStudy();
  }

  async function classifyAllTypes(force: boolean) {
    setClassifyingAll(true);
    try {
      await fetch(`/api/studies/${encodeURIComponent(code)}/lifecycle/classify-all-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      await loadStudy();
    } finally {
      setClassifyingAll(false);
    }
  }

  async function setDemandTypeStage(typeId: string, stageId: string | null) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/demand-types/${typeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lifecycleStageId: stageId }),
    });
    loadStudy();
  }

  async function setWorkTypeStage(typeId: string, stageId: string | null) {
    await fetch(`/api/studies/${encodeURIComponent(code)}/work-types/${typeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lifecycleStageId: stageId }),
    });
    loadStudy();
  }

  function startEditDef(id: string, currentDef: string | null, type: 'handling' | 'demand' | 'whatMatters' | 'systemCondition' | 'lifeProblem') {
    setEditingDefId(id);
    setEditingDefValue(currentDef || '');
    setEditingDefType(type);
  }

  async function saveOperationalDefinition() {
    if (!editingDefId) return;
    const typePathMap = { handling: 'handling-types', demand: 'demand-types', whatMatters: 'what-matters-types', systemCondition: 'system-conditions', lifeProblem: 'life-problems' };
    await fetch(`/api/studies/${encodeURIComponent(code)}/${typePathMap[editingDefType]}/${editingDefId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationalDefinition: editingDefValue.trim() }),
    });
    setEditingDefId(null);
    setEditingDefValue('');
    loadStudy();
  }

  // Label editing — same pattern as saveOperationalDefinition, but covers all 9
  // taxonomies that have a user-editable label.
  const LABEL_PATH_MAP: Record<LabelEditType, string> = {
    handling: 'handling-types',
    demand: 'demand-types',
    contactMethod: 'contact-methods',
    pointOfTransaction: 'points-of-transaction',
    whatMatters: 'what-matters-types',
    systemCondition: 'system-conditions',
    thinking: 'thinkings',
    lifeProblem: 'life-problems',
    workType: 'work-types',
    workStepType: 'work-step-types',
  };

  function startEditLabel(id: string, currentLabel: string, type: LabelEditType) {
    setEditingLabelId(id);
    setEditingLabelValue(currentLabel);
    setEditingLabelType(type);
  }

  async function saveLabel() {
    if (!editingLabelId) return;
    const trimmed = editingLabelValue.trim();
    if (!trimmed) { setEditingLabelId(null); return; }
    await fetch(`/api/studies/${encodeURIComponent(code)}/${LABEL_PATH_MAP[editingLabelType]}/${editingLabelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: trimmed }),
    });
    setEditingLabelId(null);
    setEditingLabelValue('');
    loadStudy();
  }

  // Renders either the label (with a small pencil icon to enter edit mode) or
  // an inline input when this row is being edited. Used in all 9 taxonomy lists.
  // `labelClassName` lets demand types keep their semantic colour (green for
  // value, red for failure) instead of the default gray.
  function renderLabel(id: string, label: string, type: LabelEditType, labelClassName: string = 'text-sm text-gray-800') {
    if (editingLabelId === id && editingLabelType === type) {
      return (
        <span className="inline-flex items-center gap-1">
          <input
            type="text"
            value={editingLabelValue}
            onChange={(e) => setEditingLabelValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(); if (e.key === 'Escape') setEditingLabelId(null); }}
            className="px-2 py-0.5 rounded text-sm text-gray-800 bg-white border border-gray-300 focus:ring-1 focus:ring-[#ac2c2d] outline-none"
          />
          <button onClick={saveLabel} className="text-xs px-2 py-0.5 bg-[#ac2c2d] text-white rounded">{t('settings.save')}</button>
          <button onClick={() => setEditingLabelId(null)} className="text-xs px-1 text-gray-500" aria-label="Cancel">&times;</button>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={labelClassName}>{tl(label)}</span>
        <button
          onClick={() => startEditLabel(id, label, type)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t('settings.editLabel')}
          title={t('settings.editLabel')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
      </span>
    );
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

        {/* What are we capturing? — toggles that replaced layer activation */}
        <div className={cardCls}>
          <CaptureTogglesPanel
            code={code}
            study={study}
            onChange={loadStudy}
            onOptimisticToggle={(field, value) => {
              setStudy((s) => s ? { ...s, [field]: value } : s);
            }}
          />
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



        {/* Handling types — visible whenever handling is enabled */}
        {study.handlingEnabled && <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.handlingTypes')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.handlingDesc')}</p>
          <ul className="space-y-2 mb-4">
            {study.handlingTypes.map((ht) => (
              <li key={ht.id} className="py-2 px-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {renderLabel(ht.id, ht.label, 'handling')}
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
                {renderLabel(cm.id, cm.label, 'contactMethod')}
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
                {renderLabel(pot.id, pot.label, 'pointOfTransaction')}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pot.customerFacing}
                      onChange={(e) => togglePointOfTransactionCustomerFacing(pot.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#ac2c2d] focus:ring-[#ac2c2d]"
                    />
                    {t('settings.customerFacing')}
                  </label>
                  <button onClick={() => removePointOfTransaction(pot.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                </div>
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
                  <li key={dt.id} className={`${itemCls} bg-green-50`}>
                    {renderLabel(dt.id, dt.label, 'demand', 'text-sm text-green-700')}
                    <button onClick={() => removeDemandType(dt.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
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
                  <li key={dt.id} className={`${itemCls} bg-red-50`}>
                    {renderLabel(dt.id, dt.label, 'demand', 'text-sm text-red-700')}
                    <button onClick={() => removeDemandType(dt.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
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
                  <li key={sc.id} className={`${itemCls} bg-red-50`}>
                    {renderLabel(sc.id, sc.label, 'systemCondition', 'text-sm text-red-700')}
                    <button onClick={() => removeSystemCondition(sc.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
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

        {/* Thinking — library mirrors System Conditions. Gated on its own toggle
            (migration 0013); decoupled from SC so teams can adopt them independently. */}
        {study.thinkingsEnabled && (
          <div className={cardCls}>
            <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.thinkings')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('settings.thinkingsDesc')}</p>
            <ul className="space-y-2 mb-4">
              {(study.thinkings || []).map((th) => (
                <li key={th.id} className={`${itemCls} bg-red-50`}>
                  {renderLabel(th.id, th.label, 'thinking', 'text-sm text-red-700')}
                  <button onClick={() => removeThinking(th.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                </li>
              ))}
            </ul>
            <form onSubmit={addThinkingHandler} className="flex gap-2">
              <input type="text" value={newThinking} onChange={(e) => setNewThinking(e.target.value)} placeholder={t('settings.addThinking')} className={inputCls} />
              <button type="submit" disabled={!newThinking.trim()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">{t('settings.add')}</button>
            </form>
          </div>
        )}

        {/* Customer Lifecycle (optional) */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.lifecycle')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.lifecycleDesc')}</p>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <div className="relative">
              <input
                type="checkbox"
                checked={study.lifecycleEnabled}
                onChange={toggleLifecycle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600 transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-gray-700 font-medium">{t('settings.enableLifecycle')}</span>
          </label>
          {study.lifecycleEnabled && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('settings.lifecycleStages')}</h3>
              <ul className="space-y-2 mb-4">
                {(study.lifecycleStages || []).map((ls) => (
                  <li key={ls.id} className={`${itemCls} bg-indigo-50`}>
                    <span className="text-sm text-indigo-700">{tl(ls.label)}</span>
                    <button onClick={() => removeLifecycleStage(ls.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                  </li>
                ))}
              </ul>
              <form onSubmit={addLifecycleStageHandler} className="flex gap-2 mb-4">
                <input type="text" value={newLifecycleStage} onChange={(e) => setNewLifecycleStage(e.target.value)} placeholder={t('settings.addLifecycleStage')} className={inputCls} />
                <button type="submit" disabled={!newLifecycleStage.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">{t('settings.add')}</button>
              </form>

              <button
                onClick={() => classifyAllTypes(true)}
                disabled={classifyingAll || (study.lifecycleStages || []).length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {classifyingAll ? t('settings.classifying') : t('settings.classifyAllTypes')}
              </button>

              {/* Per-type stage editor: demand types */}
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('settings.demandTypes')}</h3>
                <ul className="space-y-2">
                  {study.demandTypes.map((dt) => (
                    <li key={dt.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50">
                      <span className={`text-sm ${dt.category === 'value' ? 'text-green-700' : 'text-red-700'} truncate`}>{tl(dt.label)}</span>
                      <select
                        value={dt.lifecycleStageId || ''}
                        onChange={(e) => setDemandTypeStage(dt.id, e.target.value || null)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-900"
                      >
                        <option value="">{t('settings.lifecycleNoStage')}</option>
                        {(study.lifecycleStages || []).map((s) => (
                          <option key={s.id} value={s.id}>{tl(s.label)}</option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Per-type stage editor: work types */}
              {study.workTrackingEnabled && study.workTypes.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('settings.workTypes')}</h3>
                  <ul className="space-y-2">
                    {study.workTypes.map((wt) => (
                      <li key={wt.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50">
                        <span className="text-sm text-amber-700 truncate">{tl(wt.label)}</span>
                        <select
                          value={wt.lifecycleStageId || ''}
                          onChange={(e) => setWorkTypeStage(wt.id, e.target.value || null)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-900"
                        >
                          <option value="">{t('settings.lifecycleNoStage')}</option>
                          {(study.lifecycleStages || []).map((s) => (
                            <option key={s.id} value={s.id}>{tl(s.label)}</option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* What Matters Types — hidden unless the "What Matters" capture toggle is on. */}
        {study.whatMattersEnabled && (
          <div className={cardCls}>
            <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.whatMattersTypes')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('settings.whatMattersTypesDesc')}</p>
            <ul className="space-y-2 mb-4">
              {study.whatMattersTypes.map((wm) => (
                <li key={wm.id} className={`${itemCls} bg-blue-50`}>
                  {renderLabel(wm.id, wm.label, 'whatMatters', 'text-sm text-blue-700')}
                  <button onClick={() => removeWhatMattersType(wm.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                </li>
              ))}
            </ul>
            <form onSubmit={addWhatMattersTypeHandler} className="flex gap-2">
              <input type="text" value={newWhatMattersType} onChange={(e) => setNewWhatMattersType(e.target.value)} placeholder={t('settings.addWhatMattersType')} className={inputCls} />
              <button type="submit" disabled={!newWhatMattersType.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]">{t('settings.add')}</button>
            </form>
          </div>
        )}

        {/* Life Problem To Be Solved (Phase 2 item 1) — hidden unless toggle is on. */}
        {study.lifeProblemsEnabled && (
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.lifeProblems')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.lifeProblemsDesc')}</p>
          <ul className="space-y-2 mb-4">
            {study.lifeProblems.map((lp) => (
              <li key={lp.id} className="py-2 px-3 rounded-lg">
                <div className="flex items-center justify-between">
                  {renderLabel(lp.id, lp.label, 'lifeProblem')}
                  <button onClick={() => removeLifeProblem(lp.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                </div>
                {editingDefId === lp.id ? (
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
                    onClick={() => startEditDef(lp.id, lp.operationalDefinition, 'lifeProblem')}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-600 italic"
                  >
                    {lp.operationalDefinition || t('settings.operationalDefinition') + '...'}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={addLifeProblemHandler} className="flex gap-2">
            <input type="text" value={newLifeProblem} onChange={(e) => setNewLifeProblem(e.target.value)} placeholder={t('settings.addLifeProblem')} className={inputCls} />
            <button type="submit" disabled={!newLifeProblem.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d]">{t('settings.add')}</button>
          </form>
        </div>
        )}

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
                      {renderLabel(wt.id, wt.label, 'workType', 'text-sm text-amber-700')}
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

        {/* Phase 4 (2026-04-16) — Work Steps: managed taxonomy for Flow blocks.
             Only visible when Work Tracking is on. Mirrors Work Types pattern;
             each step carries a fixed tag (value/failure). */}
        {study.workTrackingEnabled && (
          <div className={cardCls}>
            <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.workSteps')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('settings.workStepsDesc')}</p>
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={study.workStepTypesEnabled}
                  onChange={toggleWorkStepTypes}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#ac2c2d] transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{t('settings.enableWorkSteps')}</span>
            </label>
            {study.workStepTypesEnabled && (
              <>
                <ul className="space-y-2 mb-4">
                  {(study.workStepTypes || []).map((wst) => (
                    <li key={wst.id} className={`${itemCls} ${wst.tag === 'value' ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2 flex-1">
                        {renderLabel(wst.id, wst.label, 'workStepType', wst.tag === 'value' ? 'text-sm text-green-700' : 'text-sm text-red-700')}
                        <SegmentedToggle
                          options={[
                            { value: 'value', label: t('capture.workBlockTagValue'), activeColor: 'green' },
                            { value: 'failure', label: t('capture.workBlockTagFailure'), activeColor: 'red' },
                          ]}
                          value={wst.tag}
                          onChange={(v) => updateWorkStepTag(wst.id, v as 'value' | 'failure')}
                        />
                      </div>
                      <button onClick={() => removeWorkStep(wst.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                    </li>
                  ))}
                </ul>
                <form onSubmit={addWorkStepHandler} className="flex gap-2 items-center">
                  <input type="text" value={newWorkStep} onChange={(e) => setNewWorkStep(e.target.value)} placeholder={t('settings.addWorkStep')} className={inputCls} />
                  <SegmentedToggle
                    options={[
                      { value: 'value', label: t('capture.workBlockTagValue'), activeColor: 'green' },
                      { value: 'failure', label: t('capture.workBlockTagFailure'), activeColor: 'red' },
                    ]}
                    value={newWorkStepTag}
                    onChange={(v) => setNewWorkStepTag(v as 'value' | 'failure')}
                  />
                  <button type="submit" disabled={!newWorkStep.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-[#ac2c2d] hover:bg-[#8a2425]">{t('settings.add')}</button>
                </form>
                {/* Phase 4B — synthesis helper entry point. */}
                <button
                  type="button"
                  onClick={openSynthesiseModal}
                  className="mt-4 text-sm text-[#ac2c2d] hover:underline font-medium"
                >
                  {t('settings.synthesiseWorkSteps')} →
                </button>
                <p className="text-xs text-gray-500 mt-1">{t('settings.synthesiseDesc')}</p>
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
              {/* Classification */}
              {study.classificationEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('capture.classification')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="py-2 text-center rounded-lg text-sm border border-green-200 bg-green-50 text-green-700">{t('capture.value')}</div>
                    <div className="py-2 text-center rounded-lg text-sm border border-red-200 bg-red-50 text-red-700">{t('capture.failure')}</div>
                  </div>
                </div>
              )}
              {/* Demand type */}
              {study.classificationEnabled && valueTypes.length > 0 && (
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
              {/* Handling */}
              {study.handlingEnabled && study.handlingTypes.length > 0 && (
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

      {/* Phase 4B (2026-04-16) — Synthesis modal: cluster existing free-text
          Flow blocks, let user promote a cluster to a new Work Step Type. */}
      {synthesiseOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setSynthesiseOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">{t('settings.synthesiseWorkSteps')}</h2>
              <button type="button" onClick={() => setSynthesiseOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label={t('settings.close')}>&times;</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {synthesiseLoading && (
                <p className="text-sm text-gray-500">{t('capture.loading')}</p>
              )}
              {!synthesiseLoading && synthesiseData && (
                <>
                  {synthesiseData.totalOrphans === 0 ? (
                    <p className="text-sm text-gray-500">{t('settings.synthesiseEmpty')}</p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500">
                        {t('settings.synthesiseSummary')
                          .replace('{orphans}', String(synthesiseData.totalOrphans))
                          .replace('{clusters}', String(synthesiseData.clusters.filter(c => !synthesiseDismissed.has(clusterKey(c))).length))}
                      </p>
                      <ul className="space-y-2">
                        {synthesiseData.clusters
                          .filter(c => !synthesiseDismissed.has(clusterKey(c)))
                          .map((c) => {
                            const key = clusterKey(c);
                            const labelValue = synthesiseEdits[key] ?? c.suggestedLabel;
                            return (
                              <li key={key} className={`p-3 rounded-lg border ${c.tag === 'value' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.tag === 'value' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                    {c.tag === 'value' ? t('capture.workBlockTagValue') : t('capture.workBlockTagFailure')}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {t('settings.clusterBlockCount').replace('{count}', String(c.blockCount))}
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={labelValue}
                                  onChange={(e) => setSynthesiseEdits(prev => ({ ...prev, [key]: e.target.value }))}
                                  className="w-full px-2 py-1 rounded text-sm text-gray-900 bg-white border border-gray-300 focus:ring-1 focus:ring-[#ac2c2d] outline-none mb-2"
                                />
                                <div className="text-xs text-gray-500 mb-2 space-y-0.5">
                                  {c.exampleTexts.slice(0, 3).map((ex, i) => (
                                    <p key={i} className="truncate">&ldquo;{ex}&rdquo;</p>
                                  ))}
                                  {c.exampleTexts.length > 3 && <p className="italic">…+{c.exampleTexts.length - 3}</p>}
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => dismissCluster(c)}
                                    className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                                  >
                                    {t('settings.dismiss')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => promoteCluster(c)}
                                    disabled={!labelValue.trim()}
                                    className="text-xs px-3 py-1 bg-[#ac2c2d] hover:bg-[#8a2425] text-white rounded font-medium disabled:opacity-50"
                                  >
                                    {t('settings.promote')}
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
