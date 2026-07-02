'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import CaptureTogglesPanel from '@/components/CaptureTogglesPanel';
import SegmentedToggle from '@/components/SegmentedToggle';
import InlineTypeAdder from '@/components/InlineTypeAdder';

interface HandlingType {
  id: string;
  label: string;
  operationalDefinition: string | null;
  customerFacing: boolean;
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
  category: 'value' | 'failure' | 'sequence';
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
  // Flow toggles (migration 0014).
  flowDemandEnabled: boolean;
  flowWorkEnabled: boolean;
  // Work sources toggle (migration 0015).
  workSourcesEnabled: boolean;
  // Work-tab classification preset (migration 0016).
  workClassificationMode: 'value-sequence-failure-unknown' | 'value-failure-unknown';
  // Work-tab classification row gate (migration 0017).
  workClassificationEnabled: boolean;
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
  // Case stitching (Skipton slice 1, 2026-06-11).
  caseTrackingEnabled: boolean;
  // System type (2026-06-11): layout regime — transactional vs flow-based.
  systemType: 'transactional' | 'flow';
  // Decision points (Skipton dotted box, 2026-06-12).
  decisionPointsEnabled: boolean;
  // Synthesis surface (migration 0028, 2026-06-24).
  synthesisEnabled: boolean;
  // Flow analytics tab (migration 0029, 2026-06-24).
  flowAnalyticsEnabled: boolean;
  // Flow per-block failure-demand type picker (migration 0033, 2026-06-26).
  flowFailureDemandTypesEnabled: boolean;
  consultantPin: string | null;
  handlingTypes: HandlingType[];
  demandTypes: DemandType[];
  contactMethods: ContactMethod[];
  pointsOfTransaction: PointOfTransaction[];
  workSources: { id: string; label: string; customerFacing: boolean; sortOrder: number }[];
  decisionPointTypes: { id: string; label: string; positiveLabel: string; negativeLabel: string; sortOrder: number; milestoneId: string | null; outcomes?: { id: string; label: string; tone: 'on_target' | 'variation' | 'negative'; sortOrder: number }[]; captureFields?: { id: string; label: string; kind: 'amount' | 'date' | 'duration' | 'choice'; choiceOptions: string | null; linkedWhatMattersTypeId: string | null; sortOrder: number }[] }[];
  milestones: { id: string; label: string; sortOrder: number; subquestions: { id: string; milestoneId: string; label: string; kind: 'amount' | 'number' | 'date' | 'duration' | 'text' | 'choice'; required: boolean; linkedWhatMattersTypeId: string | null; sortOrder: number; options: { id: string; label: string; polarity: 'positive' | 'negative' | null; sortOrder: number }[] }[] }[];
  whatMattersTypes: { id: string; label: string; operationalDefinition: string | null; timing?: 'by_date' | 'asap' | null; anchorMilestoneId?: string | null; anchorEvent?: string | null; enabled?: boolean; valueKind?: 'amount' | 'date_or_duration' | null }[];
  lifeProblems: { id: string; label: string; operationalDefinition: string | null }[];
  workTypes: WorkType[];
  workStepTypes: { id: string; label: string; tag: 'value' | 'sequence' | 'failure'; operationalDefinition: string | null; sortOrder: number }[];
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
  const [newWorkSource, setNewWorkSource] = useState('');
  // Decision points: which row has its milestone picker open (Move link).
  const [movingDpId, setMovingDpId] = useState<string | null>(null);
  // "Captured as" choice for date_or_duration what-matters rows while UNLINKED
  // (once linked, the field's kind is the source of truth). Default: duration.
  const [wmCapturedAs, setWmCapturedAs] = useState<Record<string, 'date' | 'duration'>>({});
  // Capture-field add form (2026-07-02): one open at a time, keyed by DP id.
  // Kind must be chosen at create (immutable after), so InlineTypeAdder doesn't fit.
  const [fieldAdderDpId, setFieldAdderDpId] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldKind, setNewFieldKind] = useState<'amount' | 'date' | 'duration' | 'choice'>('amount');
  // Decision-box redesign (0042): subquestion add form, one open per milestone.
  // Kind must be chosen at create (immutable after), so InlineTypeAdder doesn't fit.
  const [subqAdderMsId, setSubqAdderMsId] = useState<string | null>(null);
  const [newSubqLabel, setNewSubqLabel] = useState('');
  const [newSubqKind, setNewSubqKind] = useState<'amount' | 'number' | 'date' | 'duration' | 'text' | 'choice'>('choice');
  const [newMilestoneLabel, setNewMilestoneLabel] = useState('');
  const [newWorkType, setNewWorkType] = useState('');
  const [newWorkTypeCategory, setNewWorkTypeCategory] = useState<'value' | 'failure' | 'sequence'>('value');
  // Phase 4 (2026-04-16) — Work Step Types add-form state.
  const [newWorkStep, setNewWorkStep] = useState('');
  const [newWorkStepTag, setNewWorkStepTag] = useState<'value' | 'sequence' | 'failure'>('value');

  // Phase 4B (2026-04-16) — Synthesis modal state.
  type Cluster = {
    tag: 'value' | 'sequence' | 'failure';
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
  type LabelEditType = 'handling' | 'demand' | 'contactMethod' | 'pointOfTransaction' | 'workSource' | 'whatMatters' | 'systemCondition' | 'thinking' | 'lifeProblem' | 'workType' | 'workStepType';
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

  // Optimistic-update helpers (Jonas 2026-04-23).
  // Every mutation used to await the server response AND then re-fetch the
  // whole study payload before the UI reflected the change — two round-trips
  // per click, making toggles feel sluggish. These helpers flip the order:
  // callers update local state first, then use mutate/mutateAdd to fire the
  // request in the background. loadStudy() is only called on error so the UI
  // still recovers when a write fails.
  const mutate = useCallback((api: () => Promise<Response>) => {
    api().then((r) => { if (!r.ok) loadStudy(); }).catch(() => loadStudy());
  }, [loadStudy]);
  // Add is special: the server generates the id, so we must await the POST
  // to learn it. But we still skip the full re-fetch by splicing the new row
  // into local state via the caller's onId callback.
  const mutateAdd = useCallback(async (api: () => Promise<Response>, onId: (id: string) => void) => {
    try {
      const r = await api();
      if (r.ok) {
        const data = await r.json();
        if (data?.id) onId(data.id); else loadStudy();
      } else {
        loadStudy();
      }
    } catch {
      loadStudy();
    }
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

  function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    const pin = newPinInput.trim();
    if (!pin || pin.length < 4) return;
    setStudy((s) => (s ? { ...s, consultantPin: pin } : s));
    localStorage.setItem(`consultant_pin_${code}`, pin);
    setNewPinInput('');
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultantPin: pin }),
    }));
  }

  function addHandlingType(e: React.FormEvent) {
    e.preventDefault();
    const label = newHandling.trim();
    if (!label) return;
    setNewHandling('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/handling-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }),
      (id) => setStudy((s) => (s ? { ...s, handlingTypes: [...s.handlingTypes, { id, label, operationalDefinition: null, customerFacing: false }] } : s)),
    );
  }

  function removeHandlingType(id: string) {
    setStudy((s) => (s ? {
      ...s,
      handlingTypes: s.handlingTypes.filter((h) => h.id !== id),
      // Server cascades the one-stop FK to null; mirror it locally.
      oneStopHandlingType: s.oneStopHandlingType === id ? null : s.oneStopHandlingType,
    } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/handling-types/${id}`, { method: 'DELETE' }));
  }

  function setOneStop(id: string) {
    setStudy((s) => (s ? { ...s, oneStopHandlingType: id } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oneStopHandlingType: id }),
    }));
  }

  function addDemandType(e: React.FormEvent, category: 'value' | 'failure') {
    e.preventDefault();
    const label = (category === 'value' ? newValueType : newFailureType).trim();
    if (!label) return;
    if (category === 'value') setNewValueType(''); else setNewFailureType('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/demand-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, category }),
      }),
      (id) => {
        setStudy((s) => (s ? { ...s, demandTypes: [...s.demandTypes, { id, label, category, operationalDefinition: null, lifecycleStageId: null, lifecycleAiSuggestion: null }] } : s));
        // Fire-and-forget AI lifecycle classification if enabled; result reloads
        // the study so the stage + AI suggestion columns populate.
        if (study?.lifecycleEnabled) {
          fetch(`/api/studies/${encodeURIComponent(code)}/demand-types/${id}/classify-lifecycle`, { method: 'POST' })
            .then(() => loadStudy())
            .catch(() => {});
        }
      },
    );
  }

  function removeDemandType(id: string) {
    setStudy((s) => (s ? { ...s, demandTypes: s.demandTypes.filter((d) => d.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/demand-types/${id}`, { method: 'DELETE' }));
  }

  function addContactMethodHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newContactMethod.trim();
    if (!label) return;
    setNewContactMethod('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/contact-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }),
      (id) => setStudy((s) => (s ? { ...s, contactMethods: [...s.contactMethods, { id, label }] } : s)),
    );
  }

  function removeContactMethod(id: string) {
    setStudy((s) => (s ? { ...s, contactMethods: s.contactMethods.filter((c) => c.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/contact-methods/${id}`, { method: 'DELETE' }));
  }

  function addWhatMattersTypeHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newWhatMattersType.trim();
    if (!label) return;
    setNewWhatMattersType('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/what-matters-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }),
      (id) => setStudy((s) => (s ? { ...s, whatMattersTypes: [...s.whatMattersTypes, { id, label, operationalDefinition: null }] } : s)),
    );
  }

  function removeWhatMattersType(id: string) {
    setStudy((s) => (s ? { ...s, whatMattersTypes: s.whatMattersTypes.filter((w) => w.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/what-matters-types/${id}`, { method: 'DELETE' }));
  }

  // ASAP anchor: case open → this event. `event` is a capability token
  // ('milestone:<id>' | 'decision:<typeId>') or null. Optimistic.
  function setWhatMattersAnchor(id: string, event: string | null) {
    setStudy((s) => (s ? { ...s, whatMattersTypes: s.whatMattersTypes.map((w) => (w.id === id ? { ...w, anchorEvent: event } : w)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/what-matters-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anchorEvent: event }),
    }));
  }

  // Capture toggle (2026-07-02): off hides the pill from NEW capture selection
  // only — history and dashboards are untouched. Optimistic.
  function setWhatMattersEnabled(id: string, enabled: boolean) {
    setStudy((s) => (s ? { ...s, whatMattersTypes: s.whatMattersTypes.map((w) => (w.id === id ? { ...w, enabled } : w)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/what-matters-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }));
  }

  // The delivered-value field a what-matters type is evaluated against: the
  // FIRST capture field (across all decision points) linked to it. Manually
  // created links surface here too; extra links on the same type are left alone.
  function linkedFieldOf(wmId: string): { field: NonNullable<StudyData['decisionPointTypes'][number]['captureFields']>[number]; dpId: string } | null {
    for (const dp of study?.decisionPointTypes ?? []) {
      const field = (dp.captureFields ?? []).find((f) => f.linkedWhatMattersTypeId === wmId);
      if (field) return { field, dpId: dp.id };
    }
    return null;
  }

  // "Evaluate against" (2026-07-02): manage the linked delivered-value field
  // from the What Matters row. Link = create the field on the chosen decision
  // (named after the category, renameable there); re-point = MOVE the field
  // (case values survive); clear = DELETE the field incl. its case values
  // (Settings taxonomy-fix philosophy). Server-authoritative: reload after.
  async function setWmEvaluateAgainst(wm: StudyData['whatMattersTypes'][number], dpId: string | null, kind: 'amount' | 'date' | 'duration') {
    const linked = linkedFieldOf(wm.id);
    if (!dpId && !linked) return;
    if (dpId && linked?.dpId === dpId) return;
    if (linked && !dpId) {
      await fetch(`/api/studies/${encodeURIComponent(code)}/decision-capture-fields/${linked.field.id}`, { method: 'DELETE' });
    } else if (linked && dpId) {
      await fetch(`/api/studies/${encodeURIComponent(code)}/decision-capture-fields/${linked.field.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionPointTypeId: dpId }),
      });
    } else if (dpId) {
      await fetch(`/api/studies/${encodeURIComponent(code)}/decision-point-types/${dpId}/capture-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: wm.label, kind, linkedWhatMattersTypeId: wm.id }),
      });
    }
    await loadStudy();
  }

  // Kind is immutable per field, so switching a date_or_duration category's
  // "captured as" (or changing its Ask-for while linked) RECREATES the linked
  // field on the same decision with the new kind. Config-stage action: case
  // values recorded on the old field go with it (same as unlink).
  async function recreateLinkedField(wm: StudyData['whatMattersTypes'][number], kind: 'amount' | 'date' | 'duration') {
    const linked = linkedFieldOf(wm.id);
    if (!linked || linked.field.kind === kind) return;
    await fetch(`/api/studies/${encodeURIComponent(code)}/decision-capture-fields/${linked.field.id}`, { method: 'DELETE' });
    await fetch(`/api/studies/${encodeURIComponent(code)}/decision-point-types/${linked.dpId}/capture-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: linked.field.label, kind, linkedWhatMattersTypeId: wm.id }),
    });
    await loadStudy();
  }

  // Structured ask kind (2026-07-02): null = plain pill; 'amount' = specific or
  // range; 'date_or_duration' = end date or years+months. Non-timed types only.
  function setWhatMattersValueKind(id: string, kind: 'amount' | 'date_or_duration' | null) {
    const wm = study?.whatMattersTypes.find((w) => w.id === id);
    setStudy((s) => (s ? { ...s, whatMattersTypes: s.whatMattersTypes.map((w) => (w.id === id ? { ...w, valueKind: kind } : w)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/what-matters-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueKind: kind }),
    }));
    // Keep a linked delivered-value field's kind in step with the ask kind;
    // clearing the ask kind removes the evaluation link (nothing to compare).
    if (wm && linkedFieldOf(id)) {
      if (kind === 'amount') void recreateLinkedField(wm, 'amount');
      else if (kind === 'date_or_duration') void recreateLinkedField(wm, 'duration');
      else void setWmEvaluateAgainst(wm, null, 'amount');
    }
  }

  // Decision capture fields (2026-07-02) — optimistic, mirroring the outcome
  // handlers below.
  function patchCaptureField(dpId: string, fieldId: string, patch: { label?: string; choiceOptions?: string | null; linkedWhatMattersTypeId?: string | null }) {
    const clean: typeof patch = {};
    if (typeof patch.label === 'string' && patch.label.trim()) clean.label = patch.label.trim();
    if (patch.choiceOptions !== undefined) clean.choiceOptions = patch.choiceOptions;
    if (patch.linkedWhatMattersTypeId !== undefined) clean.linkedWhatMattersTypeId = patch.linkedWhatMattersTypeId;
    if (Object.keys(clean).length === 0) return;
    setStudy((s) => (s ? { ...s, decisionPointTypes: s.decisionPointTypes.map((d) => (d.id === dpId ? { ...d, captureFields: (d.captureFields ?? []).map((f) => (f.id === fieldId ? { ...f, ...clean } : f)) } : d)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/decision-capture-fields/${fieldId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean),
    }));
  }

  function removeCaptureField(dpId: string, fieldId: string) {
    setStudy((s) => (s ? { ...s, decisionPointTypes: s.decisionPointTypes.map((d) => (d.id === dpId ? { ...d, captureFields: (d.captureFields ?? []).filter((f) => f.id !== fieldId) } : d)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/decision-capture-fields/${fieldId}`, { method: 'DELETE' }));
  }

  function addCaptureFieldHandler(dpId: string) {
    const label = newFieldLabel.trim();
    if (!label) return;
    setNewFieldLabel('');
    setFieldAdderDpId(null);
    // Reload after add so the new field's id is real (mirrors outcome adds).
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/decision-point-types/${dpId}/capture-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, kind: newFieldKind }),
      }),
      () => loadStudy(),
    );
  }

  // ── Subquestions on milestones (0042) — optimistic where the id is stable ──
  const patchMsSubqs = (msId: string, fn: (subs: StudyData['milestones'][number]['subquestions']) => StudyData['milestones'][number]['subquestions']) =>
    setStudy((s) => (s ? { ...s, milestones: s.milestones.map((m) => (m.id === msId ? { ...m, subquestions: fn(m.subquestions) } : m)) } : s));

  function patchSubquestion(msId: string, sqId: string, patch: { label?: string; required?: boolean; linkedWhatMattersTypeId?: string | null }) {
    const clean: typeof patch = {};
    if (typeof patch.label === 'string' && patch.label.trim()) clean.label = patch.label.trim();
    if (typeof patch.required === 'boolean') clean.required = patch.required;
    if (patch.linkedWhatMattersTypeId !== undefined) clean.linkedWhatMattersTypeId = patch.linkedWhatMattersTypeId;
    if (Object.keys(clean).length === 0) return;
    patchMsSubqs(msId, (subs) => subs.map((f) => (f.id === sqId ? { ...f, ...clean } : f)));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/subquestions/${sqId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clean),
    }));
  }

  function removeSubquestion(msId: string, sqId: string) {
    patchMsSubqs(msId, (subs) => subs.filter((f) => f.id !== sqId));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/subquestions/${sqId}`, { method: 'DELETE' }));
  }

  function addSubquestionHandler(msId: string) {
    const label = newSubqLabel.trim();
    if (!label) return;
    setNewSubqLabel('');
    setSubqAdderMsId(null);
    const kind = newSubqKind;
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/milestones/${msId}/subquestions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label, kind }),
      }),
      () => loadStudy(),
    );
  }

  function patchOption(msId: string, sqId: string, optId: string, patch: { label?: string; polarity?: 'positive' | 'negative' | null }) {
    const clean: typeof patch = {};
    if (typeof patch.label === 'string' && patch.label.trim()) clean.label = patch.label.trim();
    if (patch.polarity !== undefined) clean.polarity = patch.polarity;
    if (Object.keys(clean).length === 0) return;
    patchMsSubqs(msId, (subs) => subs.map((f) => (f.id === sqId ? { ...f, options: f.options.map((o) => (o.id === optId ? { ...o, ...clean } : o)) } : f)));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/subquestion-options/${optId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clean),
    }));
  }

  function removeOption(msId: string, sqId: string, optId: string) {
    patchMsSubqs(msId, (subs) => subs.map((f) => (f.id === sqId ? { ...f, options: f.options.filter((o) => o.id !== optId) } : f)));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/subquestion-options/${optId}`, { method: 'DELETE' }));
  }

  function addLifeProblemHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newLifeProblem.trim();
    if (!label) return;
    setNewLifeProblem('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/life-problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }),
      (id) => setStudy((s) => (s ? { ...s, lifeProblems: [...s.lifeProblems, { id, label, operationalDefinition: null }] } : s)),
    );
  }

  function removeLifeProblem(id: string) {
    setStudy((s) => (s ? { ...s, lifeProblems: s.lifeProblems.filter((l) => l.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/life-problems/${id}`, { method: 'DELETE' }));
  }

  function addPointOfTransactionHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newPointOfTransaction.trim();
    if (!label) return;
    setNewPointOfTransaction('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/points-of-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }),
      (id) => setStudy((s) => (s ? { ...s, pointsOfTransaction: [...s.pointsOfTransaction, { id, label, customerFacing: false }] } : s)),
    );
  }

  function removePointOfTransaction(id: string) {
    setStudy((s) => (s ? { ...s, pointsOfTransaction: s.pointsOfTransaction.filter((p) => p.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/points-of-transaction/${id}`, { method: 'DELETE' }));
  }

  function togglePointOfTransactionCustomerFacing(id: string, customerFacing: boolean) {
    setStudy((s) => (s ? { ...s, pointsOfTransaction: s.pointsOfTransaction.map((p) => (p.id === id ? { ...p, customerFacing } : p)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/points-of-transaction/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerFacing }),
    }));
  }

  // Mark a Capability of Response as customer-facing (the customer is affected)
  // vs internal. Replaces the per-touch felt/internal toggle (2026-06-18).
  function toggleHandlingTypeCustomerFacing(id: string, customerFacing: boolean) {
    setStudy((s) => (s ? { ...s, handlingTypes: s.handlingTypes.map((h) => (h.id === id ? { ...h, customerFacing } : h)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/handling-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerFacing }),
    }));
  }

  function addWorkSourceHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newWorkSource.trim();
    if (!label) return;
    setNewWorkSource('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/work-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }),
      (id) => setStudy((s) => (s ? { ...s, workSources: [...s.workSources, { id, label, customerFacing: false, sortOrder: s.workSources.length }] } : s)),
    );
  }

  function removeWorkSource(id: string) {
    setStudy((s) => (s ? { ...s, workSources: s.workSources.filter((w) => w.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/work-sources/${id}`, { method: 'DELETE' }));
  }

  function toggleWorkSourceCustomerFacing(id: string, customerFacing: boolean) {
    setStudy((s) => (s ? { ...s, workSources: s.workSources.map((w) => (w.id === id ? { ...w, customerFacing } : w)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/work-sources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerFacing }),
    }));
  }

  // --- Decision outcomes (2026-07-01): a decision point's list of answers. ---
  // Update one outcome's local state (label or tone) under its parent dp.
  function patchOutcomeLocal(dpId: string, outcomeId: string, patch: Partial<{ label: string; tone: 'on_target' | 'variation' | 'negative' }>) {
    setStudy((s) => (s ? { ...s, decisionPointTypes: s.decisionPointTypes.map((d) => (d.id === dpId ? { ...d, outcomes: (d.outcomes ?? []).map((o) => (o.id === outcomeId ? { ...o, ...patch } : o)) } : d)) } : s));
  }

  function patchDecisionOutcome(dpId: string, outcomeId: string, patch: { label?: string; tone?: 'on_target' | 'variation' | 'negative' }) {
    const clean: typeof patch = {};
    if (typeof patch.label === 'string' && patch.label.trim()) clean.label = patch.label.trim();
    if (patch.tone) clean.tone = patch.tone;
    if (Object.keys(clean).length === 0) return;
    patchOutcomeLocal(dpId, outcomeId, clean);
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/decision-outcome-types/${outcomeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean),
    }));
  }

  function removeDecisionOutcome(dpId: string, outcomeId: string) {
    setStudy((s) => (s ? { ...s, decisionPointTypes: s.decisionPointTypes.map((d) => (d.id === dpId ? { ...d, outcomes: (d.outcomes ?? []).filter((o) => o.id !== outcomeId) } : d)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/decision-outcome-types/${outcomeId}`, { method: 'DELETE' }));
  }

  function patchDecisionPointType(id: string, data: { label?: string; positiveLabel?: string; negativeLabel?: string }) {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === 'string' && v.trim()));
    if (Object.keys(clean).length === 0) return;
    setStudy((s) => (s ? { ...s, decisionPointTypes: s.decisionPointTypes.map((d) => (d.id === id ? { ...d, ...clean } : d)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/decision-point-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean),
    }));
  }

  // Move a decision point into a milestone (or unassign with null).
  function assignDecisionToMilestone(id: string, milestoneId: string | null) {
    setStudy((s) => (s ? { ...s, decisionPointTypes: s.decisionPointTypes.map((d) => (d.id === id ? { ...d, milestoneId } : d)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/decision-point-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestoneId }),
    }));
  }

  function removeDecisionPointType(id: string) {
    // Per-case decision records cascade server-side (deliberate).
    setMovingDpId((v) => (v === id ? null : v));
    setStudy((s) => (s ? { ...s, decisionPointTypes: s.decisionPointTypes.filter((d) => d.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/decision-point-types/${id}`, { method: 'DELETE' }));
  }

  // --- Milestones (2026-06-18) — optimistic, mirroring the taxonomy handlers ---
  function addMilestoneHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newMilestoneLabel.trim();
    if (!label) return;
    setNewMilestoneLabel('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }),
      (id) => setStudy((s) => (s ? { ...s, milestones: [...s.milestones, { id, label, sortOrder: s.milestones.length, subquestions: [] }] } : s)),
    );
  }

  function patchMilestone(id: string, label: string) {
    const clean = label.trim();
    if (!clean) return;
    setStudy((s) => (s ? { ...s, milestones: s.milestones.map((m) => (m.id === id ? { ...m, label: clean } : m)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/milestones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: clean }),
    }));
  }

  function removeMilestone(id: string) {
    // Decision points fall back to unassigned (server SET NULL); mirror locally.
    setStudy((s) => (s ? {
      ...s,
      milestones: s.milestones.filter((m) => m.id !== id),
      decisionPointTypes: s.decisionPointTypes.map((d) => (d.milestoneId === id ? { ...d, milestoneId: null } : d)),
    } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/milestones/${id}`, { method: 'DELETE' }));
  }

  function moveMilestone(id: string, dir: -1 | 1) {
    setStudy((s) => {
      if (!s) return s;
      const ordered = [...s.milestones].sort((a, b) => a.sortOrder - b.sortOrder);
      const i = ordered.findIndex((m) => m.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ordered.length) return s;
      [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      const renumbered = ordered.map((m, k) => ({ ...m, sortOrder: k }));
      mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/milestones/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: renumbered.map((m) => m.id) }),
      }));
      return { ...s, milestones: renumbered };
    });
  }

  function addWorkTypeHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newWorkType.trim();
    if (!label) return;
    const category = newWorkTypeCategory;
    setNewWorkType('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/work-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, category }),
      }),
      (id) => {
        setStudy((s) => (s ? { ...s, workTypes: [...s.workTypes, { id, label, category, lifecycleStageId: null, lifecycleAiSuggestion: null }] } : s));
        if (study?.lifecycleEnabled) {
          fetch(`/api/studies/${encodeURIComponent(code)}/work-types/${id}/classify-lifecycle`, { method: 'POST' })
            .then(() => loadStudy())
            .catch(() => {});
        }
      },
    );
  }

  function removeWorkType(id: string) {
    setStudy((s) => (s ? { ...s, workTypes: s.workTypes.filter((w) => w.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/work-types/${id}`, { method: 'DELETE' }));
  }

  function setWorkTypeCategory(typeId: string, category: 'value' | 'failure' | 'sequence') {
    setStudy((s) => (s ? { ...s, workTypes: s.workTypes.map((w) => (w.id === typeId ? { ...w, category } : w)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/work-types/${typeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    }));
  }

  function toggleVolumeMode() {
    const newValue = !study?.volumeMode;
    setStudy((s) => (s ? { ...s, volumeMode: newValue } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volumeMode: newValue }),
    }));
  }

  // Phase 4 (2026-04-16) — Work Step Types. Uses the shared mutate/mutateAdd
  // optimistic helpers defined above.
  function toggleWorkStepTypes() {
    const newValue = !study?.workStepTypesEnabled;
    setStudy((s) => (s ? { ...s, workStepTypesEnabled: newValue } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workStepTypesEnabled: newValue }),
    }));
  }

  function addWorkStepHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newWorkStep.trim();
    if (!label) return;
    const tag = newWorkStepTag;
    setNewWorkStep('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/work-step-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, tag }),
      }),
      (id) => setStudy((s) => (s ? { ...s, workStepTypes: [...(s.workStepTypes || []), { id, label, tag, operationalDefinition: null, sortOrder: (s.workStepTypes || []).length }] } : s)),
    );
  }

  function removeWorkStep(id: string) {
    setStudy((s) => (s ? { ...s, workStepTypes: (s.workStepTypes || []).filter((w) => w.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/work-step-types/${id}`, { method: 'DELETE' }));
  }

  function updateWorkStepTag(id: string, tag: 'value' | 'sequence' | 'failure') {
    setStudy((s) => (s ? { ...s, workStepTypes: (s.workStepTypes || []).map((w) => (w.id === id ? { ...w, tag } : w)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/work-step-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    }));
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

  function addSystemConditionHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newSystemCondition.trim();
    if (!label) return;
    setNewSystemCondition('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/system-conditions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }),
      (id) => setStudy((s) => (s ? { ...s, systemConditions: [...s.systemConditions, { id, label, operationalDefinition: null }] } : s)),
    );
  }

  function removeSystemCondition(id: string) {
    setStudy((s) => (s ? { ...s, systemConditions: s.systemConditions.filter((sc) => sc.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/system-conditions/${id}`, { method: 'DELETE' }));
  }

  function addThinkingHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newThinking.trim();
    if (!label) return;
    setNewThinking('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/thinkings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }),
      (id) => setStudy((s) => (s ? { ...s, thinkings: [...s.thinkings, { id, label, operationalDefinition: null }] } : s)),
    );
  }

  function removeThinking(id: string) {
    setStudy((s) => (s ? { ...s, thinkings: s.thinkings.filter((th) => th.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/thinkings/${id}`, { method: 'DELETE' }));
  }

  // --- Lifecycle ---
  function toggleLifecycle() {
    const newValue = !study?.lifecycleEnabled;
    setStudy((s) => (s ? { ...s, lifecycleEnabled: newValue } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lifecycleEnabled: newValue }),
    }));
    // When turning on for the first time, kick off auto-classification of
    // existing types in the background. classifyAllTypes still awaits its
    // own request because it exposes a `classifyingAll` progress flag.
    if (newValue) classifyAllTypes(false);
  }

  function addLifecycleStageHandler(e: React.FormEvent) {
    e.preventDefault();
    const label = newLifecycleStage.trim();
    if (!label) return;
    setNewLifecycleStage('');
    mutateAdd(
      () => fetch(`/api/studies/${encodeURIComponent(code)}/lifecycle-stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      }),
      // The server generates `code` from the label (slug) and assigns sortOrder
      // from the existing count. Close enough for the optimistic row; the next
      // server-driven reload (if any) will correct if needed.
      (id) => setStudy((s) => (s ? { ...s, lifecycleStages: [...s.lifecycleStages, { id, code: label.toLowerCase().replace(/\s+/g, '-'), label, sortOrder: s.lifecycleStages.length }] } : s)),
    );
  }

  function removeLifecycleStage(id: string) {
    setStudy((s) => (s ? { ...s, lifecycleStages: s.lifecycleStages.filter((st) => st.id !== id) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/lifecycle-stages/${id}`, { method: 'DELETE' }));
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

  function setDemandTypeStage(typeId: string, stageId: string | null) {
    setStudy((s) => (s ? { ...s, demandTypes: s.demandTypes.map((d) => (d.id === typeId ? { ...d, lifecycleStageId: stageId } : d)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/demand-types/${typeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lifecycleStageId: stageId }),
    }));
  }

  function setWorkTypeStage(typeId: string, stageId: string | null) {
    setStudy((s) => (s ? { ...s, workTypes: s.workTypes.map((w) => (w.id === typeId ? { ...w, lifecycleStageId: stageId } : w)) } : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/work-types/${typeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lifecycleStageId: stageId }),
    }));
  }

  function startEditDef(id: string, currentDef: string | null, type: 'handling' | 'demand' | 'whatMatters' | 'systemCondition' | 'lifeProblem') {
    setEditingDefId(id);
    setEditingDefValue(currentDef || '');
    setEditingDefType(type);
  }

  function saveOperationalDefinition() {
    if (!editingDefId) return;
    const typePathMap = { handling: 'handling-types', demand: 'demand-types', whatMatters: 'what-matters-types', systemCondition: 'system-conditions', lifeProblem: 'life-problems' };
    const id = editingDefId;
    const type = editingDefType;
    const def = editingDefValue.trim();
    setEditingDefId(null);
    setEditingDefValue('');
    const applyLocal = (s: StudyData): StudyData => {
      const patch = <T extends { id: string; operationalDefinition: string | null }>(arr: T[]): T[] =>
        arr.map((row) => (row.id === id ? { ...row, operationalDefinition: def || null } : row));
      switch (type) {
        case 'handling': return { ...s, handlingTypes: patch(s.handlingTypes) };
        case 'demand': return { ...s, demandTypes: patch(s.demandTypes) };
        case 'whatMatters': return { ...s, whatMattersTypes: patch(s.whatMattersTypes) };
        case 'systemCondition': return { ...s, systemConditions: patch(s.systemConditions) };
        case 'lifeProblem': return { ...s, lifeProblems: patch(s.lifeProblems) };
      }
    };
    setStudy((s) => (s ? applyLocal(s) : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/${typePathMap[type]}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationalDefinition: def }),
    }));
  }

  // Label editing — same pattern as saveOperationalDefinition, but covers all 9
  // taxonomies that have a user-editable label.
  const LABEL_PATH_MAP: Record<LabelEditType, string> = {
    handling: 'handling-types',
    demand: 'demand-types',
    contactMethod: 'contact-methods',
    pointOfTransaction: 'points-of-transaction',
    workSource: 'work-sources',
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

  function saveLabel() {
    if (!editingLabelId) return;
    const trimmed = editingLabelValue.trim();
    if (!trimmed) { setEditingLabelId(null); return; }
    const id = editingLabelId;
    const type = editingLabelType;
    setEditingLabelId(null);
    setEditingLabelValue('');
    const applyLocal = (s: StudyData): StudyData => {
      const patch = <T extends { id: string; label: string }>(arr: T[]): T[] =>
        arr.map((row) => (row.id === id ? { ...row, label: trimmed } : row));
      switch (type) {
        case 'handling': return { ...s, handlingTypes: patch(s.handlingTypes) };
        case 'demand': return { ...s, demandTypes: patch(s.demandTypes) };
        case 'contactMethod': return { ...s, contactMethods: patch(s.contactMethods) };
        case 'pointOfTransaction': return { ...s, pointsOfTransaction: patch(s.pointsOfTransaction) };
        case 'workSource': return { ...s, workSources: patch(s.workSources) };
        case 'whatMatters': return { ...s, whatMattersTypes: patch(s.whatMattersTypes) };
        case 'systemCondition': return { ...s, systemConditions: patch(s.systemConditions) };
        case 'thinking': return { ...s, thinkings: patch(s.thinkings) };
        case 'lifeProblem': return { ...s, lifeProblems: patch(s.lifeProblems) };
        case 'workType': return { ...s, workTypes: patch(s.workTypes) };
        case 'workStepType': return { ...s, workStepTypes: patch(s.workStepTypes || []) };
      }
    };
    setStudy((s) => (s ? applyLocal(s) : s));
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}/${LABEL_PATH_MAP[type]}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: trimmed }),
    }));
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
            className="px-2 py-0.5 rounded text-sm text-gray-800 bg-white border border-gray-300 focus:ring-1 focus:ring-brand outline-none"
          />
          <button onClick={saveLabel} className="text-xs px-2 py-0.5 bg-brand text-white rounded">{t('settings.save')}</button>
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

  function savePurpose() {
    const purpose = purposeInput.trim();
    setStudy((s) => (s ? { ...s, purpose } : s));
    setPurposeSaved(true);
    setTimeout(() => setPurposeSaved(false), 2000);
    mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose }),
    }));
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cardCls = 'rounded-xl shadow-sm p-5 bg-white border border-gray-200';
  const inputCls = 'flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none';
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
              className="w-full px-4 py-3 rounded-lg text-lg tracking-widest text-center font-mono text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
            />
            <button
              type="submit"
              disabled={pinInput.length < 4}
              className="w-full mt-4 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-brand hover:bg-brand-hover"
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
  // R9 (2026-06-18): a flow study's settings are trimmed to what a flow
  // consultant actually configures — the demand-only boxes (purpose, system
  // type, capture toggles, contact methods, points of transaction, form
  // preview) are hidden. Strands are preset at creation, so the kept sections
  // still show via their own *Enabled toggles.
  const isFlow = study.systemType === 'flow';

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
                className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none"
              />
              <button type="submit" disabled={newPinInput.length < 4} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-brand">{t('settings.add')}</button>
            </form>
          </div>
        )}

        {/* Purpose statement — first per Vanguard Method */}
        {!isFlow && <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.purpose')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.purposeDesc')}</p>
          <textarea
            value={purposeInput}
            onChange={(e) => setPurposeInput(e.target.value)}
            placeholder={t('settings.purposePlaceholder')}
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none mb-2"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={savePurpose}
              disabled={purposeInput.trim() === (study.purpose || '')}
              className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors bg-brand hover:bg-brand-hover"
            >
              {t('settings.save')}
            </button>
            {purposeSaved && <span className="text-sm text-green-600">{t('settings.saved')}</span>}
          </div>
        </div>}

        {/* System type — the layout regime (2026-06-11). A regime, not a
            strand toggle, so it lives outside CaptureTogglesPanel. Switching
            to flow re-applies the additive preset server-side; switching back
            only changes the layout — nothing is ever turned off. Hidden for
            flow studies (R9): you never switch a flow study back. */}
        {!isFlow && <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.systemTypeTitle')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.systemTypeDesc')}</p>
          <SegmentedToggle
            ariaLabel={t('settings.systemTypeTitle')}
            value={study.systemType}
            onChange={async (next) => {
              if (next === study.systemType) return;
              if (next === 'flow' && !window.confirm(t('settings.systemTypeConfirmFlow'))) return;
              // Optimistic flip; full reload after so the preset toggles the
              // server flipped on arrive too.
              setStudy((s) => s ? { ...s, systemType: next as 'transactional' | 'flow' } : s);
              const res = await fetch(`/api/studies/${encodeURIComponent(code)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemType: next }),
              });
              if (res.ok) await loadStudy();
              else setStudy((s) => s ? { ...s, systemType: study.systemType } : s);
            }}
            options={[
              { value: 'transactional', label: t('create.systemTypeTransactional'), activeColor: 'burgundy' },
              { value: 'flow', label: t('create.systemTypeFlow'), activeColor: 'green' },
            ]}
          />
        </div>}

        {/* What are we capturing? — toggles that replaced layer activation.
            Hidden for flow (R9): flow strands are preset, not consultant-tuned. */}
        {!isFlow && <div className={cardCls}>
          <CaptureTogglesPanel
            code={code}
            study={study}
            onChange={loadStudy}
            onOptimisticToggle={(field, value) => {
              setStudy((s) => s ? { ...s, [field]: value } : s);
            }}
          />
        </div>}

        {/* Dashboard features (0029/0030): flow studies hide the strand-toggle
            panel (R9 — strands are preset), but Synthesise + Flow analytics are
            dashboard/analysis views the consultant DOES choose, so surface just
            those two here for flow. Non-flow studies get them in the panel above. */}
        {isFlow && <div className={cardCls}>
          <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.dashboardFeaturesTitle')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.dashboardFeaturesDesc')}</p>
          <div className="flex flex-col items-center gap-3">
            {([
              { field: 'synthesisEnabled' as const, label: t('capture.toggles.synthesis'), value: study.synthesisEnabled },
              { field: 'flowAnalyticsEnabled' as const, label: t('capture.toggles.flowAnalytics'), value: study.flowAnalyticsEnabled },
              { field: 'flowFailureDemandTypesEnabled' as const, label: t('capture.toggles.flowFailureDemandTypes'), value: study.flowFailureDemandTypesEnabled },
            ]).map((row) => (
              <button
                key={row.field}
                type="button"
                role="switch"
                aria-checked={row.value}
                onClick={() => {
                  const next = !row.value;
                  setStudy((s) => s ? { ...s, [row.field]: next } : s);
                  mutate(() => fetch(`/api/studies/${encodeURIComponent(code)}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [row.field]: next }),
                  }));
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors text-left ${
                  row.value
                    ? 'bg-gray-200 text-gray-900 border-gray-400 hover:bg-gray-300'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                }`}
              >
                {row.label}
              </button>
            ))}
          </div>
        </div>}

        {/* Access code */}
        <div className={cardCls}>
          <h2 className="text-base font-semibold mb-3 text-gray-900">{t('settings.accessCode')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('settings.shareCode')}</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold tracking-widest px-4 py-2 rounded-lg text-brand bg-red-50">
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
                  <div className="flex items-center gap-3">
                    {/* Customer-facing flag hidden for flow studies (R9). */}
                    {!isFlow && <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ht.customerFacing}
                        onChange={(e) => toggleHandlingTypeCustomerFacing(ht.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      {t('settings.customerFacing')}
                    </label>}
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
                      className="flex-1 px-2 py-1 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:ring-1 focus:ring-brand outline-none"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveOperationalDefinition(); if (e.key === 'Escape') setEditingDefId(null); }}
                    />
                    <button onClick={saveOperationalDefinition} className="text-xs px-2 py-1 bg-brand text-white rounded">{t('settings.add')}</button>
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
            <button type="submit" disabled={!newHandling.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-brand">{t('settings.add')}</button>
          </form>
        </div>}

        {/* Contact methods — demand-only, hidden for flow (R9). */}
        {!isFlow && <div className={cardCls}>
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
            <button type="submit" disabled={!newContactMethod.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-brand">{t('settings.add')}</button>
          </form>
        </div>}

        {/* Points of transaction — demand-only, hidden for flow (R9). */}
        {!isFlow && <div className={cardCls}>
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
                      className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
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
            <button type="submit" disabled={!newPointOfTransaction.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-brand">{t('settings.add')}</button>
          </form>
        </div>}

        {/* Decision box (redesigned 0042): milestones hold SUBQUESTIONS directly.
            Completion is implicit — every REQUIRED subquestion answered — so
            there are no outcome pills and no achieved/not-achieved toggle. A
            choice option can carry positive/negative polarity (negative prompts
            to close the case at capture). */}
        {study.decisionPointsEnabled && (() => {
          const orderedMs = [...(study.milestones || [])].sort((a, b) => a.sortOrder - b.sortOrder);
          const kindLabel = (k: string) =>
            k === 'amount' ? t('settings.captureFieldKindAmount')
            : k === 'number' ? t('settings.subquestionKindNumber')
            : k === 'date' ? t('settings.captureFieldKindDate')
            : k === 'duration' ? t('settings.captureFieldKindDuration')
            : k === 'text' ? t('settings.subquestionKindText')
            : t('settings.captureFieldKindChoice');
          const canLink = (k: string) => k === 'amount' || k === 'number' || k === 'date' || k === 'duration';
          const renderSubqRow = (msId: string, sq: StudyData['milestones'][number]['subquestions'][number]) => (
            <li key={sq.id} className="p-2 rounded-lg bg-white border border-gray-200 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  defaultValue={sq.label}
                  aria-label={t('settings.subquestions')}
                  onBlur={(e) => patchSubquestion(msId, sq.id, { label: e.target.value })}
                  className="flex-1 px-2 py-1 rounded text-sm font-medium text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                />
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400 font-medium">{kindLabel(sq.kind)}</span>
                <button onClick={() => removeSubquestion(msId, sq.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0 px-1" aria-label={t('settings.remove')}>×</button>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  <input type="checkbox" checked={sq.required} onChange={(e) => patchSubquestion(msId, sq.id, { required: e.target.checked })} className="accent-brand" />
                  {t('settings.subquestionRequired')}
                </label>
                {canLink(sq.kind) && (
                  <label className="flex items-center gap-1 text-xs text-gray-500 flex-1 min-w-0">
                    {t('settings.captureFieldLink')}
                    <select
                      value={sq.linkedWhatMattersTypeId ?? ''}
                      onChange={(e) => patchSubquestion(msId, sq.id, { linkedWhatMattersTypeId: e.target.value || null })}
                      className="flex-1 min-w-0 px-1.5 py-1 rounded text-xs text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                    >
                      <option value="">—</option>
                      {(study.whatMattersTypes || []).map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
                    </select>
                  </label>
                )}
              </div>
              {sq.kind === 'choice' && (
                <div className="space-y-1 pl-1 border-l-2 border-gray-100">
                  {[...sq.options].sort((a, b) => a.sortOrder - b.sortOrder).map((o) => (
                    <div key={o.id} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        defaultValue={o.label}
                        aria-label={t('settings.addOption')}
                        onBlur={(e) => patchOption(msId, sq.id, o.id, { label: e.target.value })}
                        className="flex-1 px-2 py-0.5 rounded text-xs text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                      />
                      <SegmentedToggle
                        compact
                        ariaLabel={t('settings.optionPolarity')}
                        value={o.polarity ?? 'none'}
                        onChange={(v) => patchOption(msId, sq.id, o.id, { polarity: v === 'none' ? null : (v as 'positive' | 'negative') })}
                        options={[
                          { value: 'positive', label: t('settings.polarityPositive'), activeColor: 'green' },
                          { value: 'none', label: t('settings.polarityNone'), activeColor: 'blue' },
                          { value: 'negative', label: t('settings.polarityNegative'), activeColor: 'red' },
                        ]}
                      />
                      <button onClick={() => removeOption(msId, sq.id, o.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0 px-1" aria-label={t('settings.remove')}>×</button>
                    </div>
                  ))}
                  <InlineTypeAdder
                    code={code}
                    apiPath={`subquestions/${sq.id}/options`}
                    compact
                    inputVariant="sky"
                    inputPlaceholder={t('settings.addOption')}
                    onCreated={() => {}}
                    onRefresh={loadStudy}
                  />
                </div>
              )}
            </li>
          );
          return (
          <div className={cardCls}>
            <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.milestones')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('settings.subquestionsDesc')}</p>
            <div className="space-y-3 mb-4">
              {orderedMs.map((m, idx) => (
                <div key={m.id} className="rounded-lg border border-gray-200 bg-gray-100/70 p-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="shrink-0 w-5 text-xs text-gray-400 tabular-nums text-center">{idx + 1}</span>
                    <input
                      type="text"
                      defaultValue={m.label}
                      aria-label={t('settings.milestoneLabel')}
                      onBlur={(e) => patchMilestone(m.id, e.target.value)}
                      className="flex-1 px-2 py-1 rounded text-sm font-semibold text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                    />
                    <button type="button" aria-label={t('settings.moveUp')} disabled={idx === 0} onClick={() => moveMilestone(m.id, -1)} className="px-1.5 py-1 text-xs text-gray-600 disabled:opacity-30 hover:text-gray-900">↑</button>
                    <button type="button" aria-label={t('settings.moveDown')} disabled={idx === orderedMs.length - 1} onClick={() => moveMilestone(m.id, 1)} className="px-1.5 py-1 text-xs text-gray-600 disabled:opacity-30 hover:text-gray-900">↓</button>
                    <button type="button" onClick={() => removeMilestone(m.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0">{t('settings.remove')}</button>
                  </div>
                  {idx === orderedMs.length - 1 && orderedMs.length > 1 && (
                    <p className="px-1 mb-1.5 text-[11px] text-gray-400">{t('settings.finalMilestoneHint')}</p>
                  )}
                  <ul className="space-y-2">
                    {[...m.subquestions].sort((a, b) => a.sortOrder - b.sortOrder).map((sq) => renderSubqRow(m.id, sq))}
                  </ul>
                  {subqAdderMsId === m.id ? (
                    <div className="flex gap-1.5 items-center mt-1.5">
                      <input
                        type="text"
                        value={newSubqLabel}
                        onChange={(e) => setNewSubqLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubquestionHandler(m.id); } if (e.key === 'Escape') { setSubqAdderMsId(null); setNewSubqLabel(''); } }}
                        placeholder={t('settings.addSubquestion')}
                        autoFocus
                        className="flex-1 min-w-0 px-2 py-1 rounded text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                      />
                      <select
                        value={newSubqKind}
                        onChange={(e) => setNewSubqKind(e.target.value as typeof newSubqKind)}
                        aria-label={t('settings.wmValueKind')}
                        className="shrink-0 px-1.5 py-1 rounded text-xs text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                      >
                        <option value="choice">{t('settings.captureFieldKindChoice')}</option>
                        <option value="amount">{t('settings.captureFieldKindAmount')}</option>
                        <option value="number">{t('settings.subquestionKindNumber')}</option>
                        <option value="date">{t('settings.captureFieldKindDate')}</option>
                        <option value="duration">{t('settings.captureFieldKindDuration')}</option>
                        <option value="text">{t('settings.subquestionKindText')}</option>
                      </select>
                      <button type="button" onClick={() => addSubquestionHandler(m.id)} disabled={!newSubqLabel.trim()} className="shrink-0 px-2 py-1 rounded text-xs font-medium text-white disabled:opacity-50 bg-brand">{t('settings.add')}</button>
                      <button type="button" onClick={() => { setSubqAdderMsId(null); setNewSubqLabel(''); }} className="shrink-0 px-1 py-1 text-gray-400 hover:text-gray-600 text-sm">×</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setSubqAdderMsId(m.id); setNewSubqLabel(''); setNewSubqKind('choice'); }}
                      className="mt-1.5 px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 hover:border-gray-400"
                    >
                      + {t('settings.addSubquestion')}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={addMilestoneHandler} className="flex gap-2 mb-2">
              <input type="text" value={newMilestoneLabel} onChange={(e) => setNewMilestoneLabel(e.target.value)} placeholder={t('settings.milestoneLabel')} className={inputCls} />
              <button type="submit" disabled={!newMilestoneLabel.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-brand shrink-0">{t('settings.addMilestone')}</button>
            </form>
          </div>
          );
        })()}

        {/* Work sources — gated on workSourcesEnabled (toggle lives in CaptureTogglesPanel above). */}
        {study.workSourcesEnabled && (
          <div className={cardCls}>
            <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.workSources')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('settings.workSourcesDesc')}</p>
            <ul className="space-y-2 mb-4">
              {(study.workSources || []).map((ws) => (
                <li key={ws.id} className={itemCls}>
                  {renderLabel(ws.id, ws.label, 'workSource')}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ws.customerFacing}
                        onChange={(e) => toggleWorkSourceCustomerFacing(ws.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      {t('settings.customerFacing')}
                    </label>
                    <button onClick={() => removeWorkSource(ws.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                  </div>
                </li>
              ))}
            </ul>
            <form onSubmit={addWorkSourceHandler} className="flex gap-2">
              <input type="text" value={newWorkSource} onChange={(e) => setNewWorkSource(e.target.value)} placeholder={t('settings.addWorkSource')} className={inputCls} />
              <button type="submit" disabled={!newWorkSource.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-brand">{t('settings.add')}</button>
            </form>
          </div>
        )}

        {/* Demand Types — gated on demandTypesEnabled (toggle lives in CaptureTogglesPanel above) */}
        {study.demandTypesEnabled && (
          <div className={cardCls}>
            <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.demandTypes')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('settings.demandTypesDesc')}</p>
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
          </div>
        )}

        {/* System Conditions — gated on systemConditionsEnabled (toggle lives in CaptureTogglesPanel above) */}
        {study.systemConditionsEnabled && (
          <div className={cardCls}>
            <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.systemConditions')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('settings.systemConditionsDesc')}</p>
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
          </div>
        )}

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
              {/* Stacked two-line rows (2026-07-02): line 1 = identity (label
                  wraps, tag/remove pinned right), line 2 = controls that WRAP
                  on narrow widths. The old single-line layout overflowed the
                  box once the capture toggle + ask-kind/anchor selects landed. */}
              {study.whatMattersTypes.map((wm) => (
                <li key={wm.id} className="py-2 px-3 rounded-lg bg-blue-50 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      {wm.timing === 'by_date' ? <span aria-hidden>📅</span> : wm.timing === 'asap' ? <span aria-hidden>⏱</span> : null}
                      {renderLabel(wm.id, wm.label, 'whatMatters', 'text-sm text-blue-700 break-words')}
                    </span>
                    {/* The two standard timed types are protected — no delete, just a tag. */}
                    {wm.timing ? (
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400 font-medium">{t('settings.standardType')}</span>
                    ) : (
                      <button onClick={() => removeWhatMattersType(wm.id)} className="shrink-0 text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {/* Capture toggle (2026-07-02): off = pill hidden for NEW
                        selection; history + dashboards untouched. */}
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wm.enabled !== false}
                        onChange={(e) => setWhatMattersEnabled(wm.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      {t('settings.wmShowAtCapture')}
                    </label>
                    {/* Structured ask kind — non-timed types only (the two timed
                        standard types keep their timing semantics). */}
                    {!wm.timing && (
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        {t('settings.wmValueKind')}
                        <select
                          value={wm.valueKind ?? ''}
                          onChange={(e) => setWhatMattersValueKind(wm.id, (e.target.value || null) as 'amount' | 'date_or_duration' | null)}
                          className="px-1.5 py-1 rounded text-xs text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                        >
                          <option value="">{t('settings.wmValueKindNone')}</option>
                          <option value="amount">{t('settings.wmValueKindAmount')}</option>
                          <option value="date_or_duration">{t('settings.wmValueKindDateOrDuration')}</option>
                        </select>
                      </label>
                    )}
                    {/* ASAP is measured case open → this event (a milestone OR a
                        decision point), set once per study. Value is a token. */}
                    {wm.timing === 'asap' && (
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        {t('settings.measuredToMilestone')}
                        <select
                          value={wm.anchorEvent ?? (wm.anchorMilestoneId ? `milestone:${wm.anchorMilestoneId}` : '')}
                          onChange={(e) => setWhatMattersAnchor(wm.id, e.target.value || null)}
                          className="max-w-[14rem] truncate px-1.5 py-1 rounded text-xs text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                        >
                          <option value="">—</option>
                          <optgroup label={t('settings.milestones')}>
                            {[...(study.milestones || [])].sort((a, b) => a.sortOrder - b.sortOrder).map((m) => <option key={m.id} value={`milestone:${m.id}`}>◇ {m.label}</option>)}
                          </optgroup>
                          <optgroup label={t('settings.decisionPointTypes')}>
                            {[...(study.decisionPointTypes || [])].sort((a, b) => a.sortOrder - b.sortOrder).map((d) => <option key={d.id} value={`decision:${d.id}`}>{d.label}</option>)}
                          </optgroup>
                        </select>
                      </label>
                    )}
                    {/* Evaluate against (2026-07-02): pick the decision that
                        delivers on this ask — the delivered-value box on that
                        decision is created/moved/removed automatically. Shown
                        for comparable asks: the by_date standard type and any
                        valueKind type. */}
                    {(wm.timing === 'by_date' || (!wm.timing && wm.valueKind)) && (() => {
                      const linked = linkedFieldOf(wm.id);
                      const capturedAs: 'date' | 'duration' = linked && (linked.field.kind === 'date' || linked.field.kind === 'duration')
                        ? linked.field.kind
                        : (wmCapturedAs[wm.id] ?? 'duration');
                      const deliveredKind: 'amount' | 'date' | 'duration' =
                        wm.timing === 'by_date' ? 'date' : wm.valueKind === 'amount' ? 'amount' : capturedAs;
                      return (
                        <>
                          <label className="flex items-center gap-1 text-xs text-gray-600">
                            {t('settings.wmEvaluateAgainst')}
                            <select
                              value={linked?.dpId ?? ''}
                              onChange={(e) => void setWmEvaluateAgainst(wm, e.target.value || null, deliveredKind)}
                              className="max-w-[14rem] truncate px-1.5 py-1 rounded text-xs text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                            >
                              <option value="">—</option>
                              {/* Decisions grouped under their milestone (same
                                  visual language as the ASAP anchor select) so
                                  they're findable in a milestone-structured
                                  journey. A DECISION is always what's picked —
                                  the milestone name is just the group label. */}
                              {[...(study.milestones || [])].sort((a, b) => a.sortOrder - b.sortOrder).map((m) => {
                                const dps = (study.decisionPointTypes || []).filter((d) => d.milestoneId === m.id).sort((a, b) => a.sortOrder - b.sortOrder);
                                return dps.length > 0 ? (
                                  <optgroup key={m.id} label={`◇ ${m.label}`}>
                                    {dps.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                                  </optgroup>
                                ) : null;
                              })}
                              {(() => {
                                const unassigned = (study.decisionPointTypes || []).filter((d) => !d.milestoneId).sort((a, b) => a.sortOrder - b.sortOrder);
                                return unassigned.length > 0 ? (
                                  <optgroup label={t('settings.unassignedDecisions')}>
                                    {unassigned.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                                  </optgroup>
                                ) : null;
                              })()}
                            </select>
                          </label>
                          {!wm.timing && wm.valueKind === 'date_or_duration' && (
                            <label className="flex items-center gap-1 text-xs text-gray-600">
                              {t('settings.wmCapturedAs')}
                              <select
                                value={capturedAs}
                                onChange={(e) => {
                                  const next = e.target.value as 'date' | 'duration';
                                  setWmCapturedAs((prev) => ({ ...prev, [wm.id]: next }));
                                  // Linked: the field's kind must follow (recreate).
                                  if (linked) void recreateLinkedField(wm, next);
                                }}
                                className="px-1.5 py-1 rounded text-xs text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                              >
                                <option value="duration">{t('capture.wmModeDuration')}</option>
                                <option value="date">{t('settings.captureFieldKindDate')}</option>
                              </select>
                            </label>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </li>
              ))}
            </ul>
            <form onSubmit={addWhatMattersTypeHandler} className="flex gap-2">
              <input type="text" value={newWhatMattersType} onChange={(e) => setNewWhatMattersType(e.target.value)} placeholder={t('settings.addWhatMattersType')} className={inputCls} />
              <button type="submit" disabled={!newWhatMattersType.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-brand">{t('settings.add')}</button>
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
                      className="flex-1 px-2 py-1 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:ring-1 focus:ring-brand outline-none"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveOperationalDefinition(); if (e.key === 'Escape') setEditingDefId(null); }}
                    />
                    <button onClick={saveOperationalDefinition} className="text-xs px-2 py-1 bg-brand text-white rounded">{t('settings.add')}</button>
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
            <button type="submit" disabled={!newLifeProblem.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-brand">{t('settings.add')}</button>
          </form>
        </div>
        )}

        {/* Work Types — gated on workTrackingEnabled + workTypesEnabled (both toggles live in CaptureTogglesPanel above) */}
        {study.workTrackingEnabled && study.workTypesEnabled && (
          <div className={cardCls}>
            <h2 className="text-base font-semibold mb-1 text-gray-900">{t('settings.workTypes')}</h2>
            <p className="text-sm text-gray-600 mb-3">{t('settings.workTypesDesc')}</p>
            <ul className="space-y-2 mb-4">
              {(study.workTypes || []).map((wt) => (
                <li key={wt.id} className={`${itemCls} ${wt.category === 'value' ? 'bg-green-50' : wt.category === 'sequence' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 flex-1">
                    {renderLabel(wt.id, wt.label, 'workType', wt.category === 'value' ? 'text-sm text-green-700' : wt.category === 'sequence' ? 'text-sm text-emerald-700' : 'text-sm text-red-700')}
                    <SegmentedToggle
                      options={[
                        { value: 'value', label: t('capture.classificationWorkValue'), activeColor: 'green' },
                        { value: 'sequence', label: t('capture.classificationWorkSequence'), activeColor: 'emerald' },
                        { value: 'failure', label: t('capture.classificationWorkFailure'), activeColor: 'red' },
                      ]}
                      value={wt.category}
                      onChange={(v) => setWorkTypeCategory(wt.id, v as 'value' | 'failure' | 'sequence')}
                    />
                  </div>
                  <button onClick={() => removeWorkType(wt.id)} className="text-xs text-red-500 hover:text-red-700">{t('settings.remove')}</button>
                </li>
              ))}
            </ul>
            <form onSubmit={addWorkTypeHandler} className="flex gap-2 items-center">
              <input type="text" value={newWorkType} onChange={(e) => setNewWorkType(e.target.value)} placeholder={t('settings.addWorkType')} className={inputCls} />
              <SegmentedToggle
                options={[
                  { value: 'value', label: t('capture.classificationWorkValue'), activeColor: 'green' },
                  { value: 'sequence', label: t('capture.classificationWorkSequence'), activeColor: 'emerald' },
                  { value: 'failure', label: t('capture.classificationWorkFailure'), activeColor: 'red' },
                ]}
                value={newWorkTypeCategory}
                onChange={(v) => setNewWorkTypeCategory(v as 'value' | 'failure' | 'sequence')}
              />
              <button type="submit" disabled={!newWorkType.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-amber-600 hover:bg-amber-700">{t('settings.add')}</button>
            </form>
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
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-brand transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{t('settings.enableWorkSteps')}</span>
            </label>
            {study.workStepTypesEnabled && (
              <>
                <ul className="space-y-2 mb-4">
                  {(study.workStepTypes || []).map((wst) => (
                    <li key={wst.id} className={`${itemCls} ${wst.tag === 'value' ? 'bg-green-50' : wst.tag === 'sequence' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2 flex-1">
                        {renderLabel(wst.id, wst.label, 'workStepType', wst.tag === 'value' ? 'text-sm text-green-700' : wst.tag === 'sequence' ? 'text-sm text-emerald-700' : 'text-sm text-red-700')}
                        <SegmentedToggle
                          options={[
                            { value: 'value', label: t('capture.workBlockTagValue'), activeColor: 'green' },
                            { value: 'sequence', label: t('capture.workBlockTagSequence'), activeColor: 'emerald' },
                            { value: 'failure', label: t('capture.workBlockTagFailure'), activeColor: 'red' },
                          ]}
                          value={wst.tag}
                          onChange={(v) => updateWorkStepTag(wst.id, v as 'value' | 'sequence' | 'failure')}
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
                      { value: 'sequence', label: t('capture.workBlockTagSequence'), activeColor: 'emerald' },
                      { value: 'failure', label: t('capture.workBlockTagFailure'), activeColor: 'red' },
                    ]}
                    value={newWorkStepTag}
                    onChange={(v) => setNewWorkStepTag(v as 'value' | 'sequence' | 'failure')}
                  />
                  <button type="submit" disabled={!newWorkStep.trim()} className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 bg-brand hover:bg-[#8a2425]">{t('settings.add')}</button>
                </form>
                {/* Phase 4B — synthesis helper entry point. */}
                <button
                  type="button"
                  onClick={openSynthesiseModal}
                  className="mt-4 text-sm text-brand hover:underline font-medium"
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
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-brand transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-gray-700 font-medium">{t('settings.enableVolumeMode')}</span>
          </label>
        </div>

        {/* Capture form preview — demand-only, hidden for flow (R9). */}
        {!isFlow && <div className={cardCls}>
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
              <button disabled className="w-full px-4 py-3 text-white rounded-lg font-medium bg-brand opacity-50">
                {t('capture.save')}
              </button>
            </div>
          )}
        </div>}
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
                              <li key={key} className={`p-3 rounded-lg border ${c.tag === 'value' ? 'bg-green-50 border-green-200' : c.tag === 'sequence' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.tag === 'value' ? 'bg-green-600 text-white' : c.tag === 'sequence' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>
                                    {c.tag === 'value' ? t('capture.workBlockTagValue') : c.tag === 'sequence' ? t('capture.workBlockTagSequence') : t('capture.workBlockTagFailure')}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {t('settings.clusterBlockCount').replace('{count}', String(c.blockCount))}
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={labelValue}
                                  onChange={(e) => setSynthesiseEdits(prev => ({ ...prev, [key]: e.target.value }))}
                                  className="w-full px-2 py-1 rounded text-sm text-gray-900 bg-white border border-gray-300 focus:ring-1 focus:ring-brand outline-none mb-2"
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
                                    className="text-xs px-3 py-1 bg-brand hover:bg-[#8a2425] text-white rounded font-medium disabled:opacity-50"
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
