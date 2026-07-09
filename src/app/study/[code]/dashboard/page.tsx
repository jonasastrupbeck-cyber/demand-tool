/* Dashboard – demand / work / overview tabs */
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, LabelList, Sankey, ReferenceLine,
} from 'recharts';
import type { NodeProps, LinkProps } from 'recharts/types/chart/Sankey';
import type { DashboardData, BudgetCapabilityField } from '@/types';
import { formatCurrency, currencyForSubquestion } from '@/lib/format-currency';
import PillToggle from '@/components/PillToggle';
import PillMultiSelect from '@/components/PillMultiSelect';
import InfoPopover from '@/components/InfoPopover';
import { useLocale } from '@/lib/locale-context';
import { exportDashboardToPptx } from '@/lib/pptx-export';
import { exportCapabilityChartsToPptx } from '@/lib/pptx-capability-export';
import EntryEditModal, { type EntryEditModalStudy } from '@/components/EntryEditModal';
import { type PillSelectOption } from '@/components/PillSelect';
import CapabilityChart from '@/components/CapabilityChart';
import TouchesPerCaseChart from '@/components/TouchesPerCaseChart';
import StepsPerCaseChart from '@/components/StepsPerCaseChart';
import CorDistributionChart from '@/components/CorDistributionChart';
import TaxonomySynthesis, { type SynthesisLabels } from '@/components/TaxonomySynthesis';
import { nodeToPngDataUrl } from '@/lib/chart-image';
import { CollapsibleCardsContext, useCollapsibleCards } from '@/components/collapsible-cards-context';

const THEME = {
  text: '#1f2937',
  textSecondary: '#6b7280',
  accent: 'var(--color-brand)', // C11: brand token (globals.css) — flips with the scheme
  grid: '#e5e7eb',
};

const COLORS = {
  value: '#22c55e',    // Tailwind green-500 — matches capture's value strand
  failure: '#ef4444',  // Tailwind red-500 — matches capture's failure strand
  sequence: '#10b981', // Tailwind emerald-500 — matches capture's sequence pill (work-only)
  unknown: '#6b7280',  // Tailwind gray-500 — matches capture's "?" unknown pill
  // Blue-to-grey shades for categorical / non-classification data (PoT, contact method, etc.)
  neutral: ['#3b82f6', '#60a5fa', '#93c5fd', '#6b7280', '#9ca3af', '#475569', '#94a3b8', '#64748b'],
};

const tooltipStyle = {
  contentStyle: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: THEME.text },
  labelStyle: { color: THEME.text },
  itemStyle: { color: THEME.textSecondary },
};

type DateRange = 'all' | 'today' | '7d' | '30d' | 'custom';

type DashboardView = 'demand' | 'work' | 'overview' | 'capability' | 'synthesis' | 'analytics';

// P2BS → value demand band (2026-07-09). Mirrors P2bsVdLink in
// dashboard-aggregations.ts (kept local — the page only imports types from
// @/types, never from server modules). null id = "Not set" on that side.
type P2bsVdLink = {
  lifeProblemId: string | null;
  lifeProblemLabel: string | null;
  demandTypeId: string | null;
  demandTypeLabel: string | null;
  caseCount: number;
  caseIds: string[];
};
type P2bsVdData = { links: P2bsVdLink[]; cases: Record<string, { caseRef: string; whatMatters: string | null }> };

export default function DashboardPage() {
  const params = useParams();
  const code = params.code as string;
  const { locale, t, tl } = useLocale();

  const [data, setData] = useState<DashboardData | null>(null);
  const [studyName, setStudyName] = useState('');
  const [studyPurpose, setStudyPurpose] = useState('');
  const [workTrackingEnabled, setWorkTrackingEnabled] = useState(false);
  const [demandTypesEnabled, setDemandTypesEnabled] = useState(false);
  const [activeLayer, setActiveLayer] = useState(5);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [dashboardView, setDashboardView] = useState<DashboardView>('demand');
  const [uploading, setUploading] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<{ sourceLabel: string; targetLabel: string; sourceName: string; targetName: string; count: number } | null>(null);
  const [flowCauses, setFlowCauses] = useState<Array<{ cause: string; count: number }> | null>(null);
  const [flowCausesLoading, setFlowCausesLoading] = useState(false);
  // P2BS → value demand Sankey (2026-07-09): what problems the cases' value
  // demands trace back to. The payload carries the click-through detail
  // (caseRef + whatMatters per case) eagerly, so a band click is pure state.
  const [p2bsVd, setP2bsVd] = useState<P2bsVdData | null>(null);
  const [selectedP2bsVd, setSelectedP2bsVd] = useState<P2bsVdLink | null>(null);
  // Ask delivery (2026-07-02, slice 4): how often decisions delivered what
  // mattered, per linked capture field. Fetched when the Analytics tab opens.
  const [askDelivery, setAskDelivery] = useState<Array<{ fieldId: string; fieldLabel: string; decisionLabel: string; whatMattersTypeId: string; whatMattersLabel: string; kind: 'amount' | 'number' | 'currency' | 'date' | 'duration' | 'choice'; n: number; metCount: number; notCaptured: number; lateCount: number; avgDaysLate: number | null; avgDiffMonths: number | null; overCount: number; avgAmountOver: number | null }> | null>(null);
  // Budget capability (2026-07-05): signed budget variance per case, XmR-style.
  const [budgetCapability, setBudgetCapability] = useState<BudgetCapabilityField[] | null>(null);
  const [budgetFieldId, setBudgetFieldId] = useState<string>('');
  const [budgetUnit, setBudgetUnit] = useState<'pct' | 'amount'>('pct');
  const [showEntries, setShowEntries] = useState(false);
  // Bumped after an xlsx import so the open raw-entries list + demand-type map
  // refresh (the aggregates refresh via loadDashboard, but the list effect only
  // re-ran on showEntries/code).
  const [entriesRefreshTick, setEntriesRefreshTick] = useState(0);
  const [entries, setEntries] = useState<Array<{ id: string; verbatim: string; classification: string; createdAt: string; demandTypeId: string | null; entryType: string; collectorName: string | null }>>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entryFilter, setEntryFilter] = useState('');
  const [demandTypeMap, setDemandTypeMap] = useState<Map<string, string>>(new Map());
  const [notesGroupBy, setNotesGroupBy] = useState<'date' | 'type'>('date');
  // Flow export dropdown (2026-07-05): one sky "Export" pill → the two actions.
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [fullStudy, setFullStudy] = useState<EntryEditModalStudy | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  // Capability / lead-time (2026-06-18): event-pair pickers + XmR chart data.
  const [systemType, setSystemType] = useState<string | null>(null); // R7: flow → capability-only
  const [caseTrackingEnabled, setCaseTrackingEnabled] = useState(false);
  // Synthesis (0028/0030): gates the "Synthesise" tab + which taxonomies it covers.
  const [systemConditionsEnabled, setSystemConditionsEnabled] = useState(false);
  const [synthesisEnabled, setSynthesisEnabled] = useState(false);
  const [workTypesEnabled, setWorkTypesEnabled] = useState(false);
  const [workStepTypesEnabled, setWorkStepTypesEnabled] = useState(false);
  const [synthTax, setSynthTax] = useState<'sc' | 'wt' | 'wst'>('sc');
  // Flow analytics (0029): gates the demand-style "Analytics" tab on flow dashboards.
  const [flowAnalyticsEnabled, setFlowAnalyticsEnabled] = useState(false);
  // Value-demand data-scope filter (empty = all data), multi-select. Replaces the
  // former P2BS (life-problem) filter on the flow dashboard. + collapsed coverage box.
  const [valueDemandFilter, setValueDemandFilter] = useState<string[]>([]);
  const [valueDemandTypes, setValueDemandTypes] = useState<{ id: string; label: string }[]>([]);
  const [valueSteps, setValueSteps] = useState<{ id: string; label: string }[]>([]);
  // "Work by value step" ordering (Analytics): journey order (default) or ranked
  // by a waste type, so "which step generates the most X" is answerable at a glance.
  const [vsSort, setVsSort] = useState<'journey' | 'failureDemand' | 'failure' | 'sequence' | 'waste'>('journey');
  const [showCoverage, setShowCoverage] = useState(false);
  const [lifeProblemsEnabled, setLifeProblemsEnabled] = useState(false);
  const [lifeProblems, setLifeProblems] = useState<{ id: string; label: string }[]>([]);
  // Case list for the Touches-over-time scope selector.
  const [cases, setCases] = useState<{ id: string; caseRef: string }[]>([]);
  const [milestones, setMilestones] = useState<{ id: string; label: string; sortOrder: number }[]>([]);
  const [whatMattersTypes, setWhatMattersTypes] = useState<{ id: string; label: string; sortOrder: number; timing: 'by_date' | 'asap' | null; anchorMilestoneId?: string | null; anchorEvent?: string | null }[]>([]);
  // What-matters scope (flow): restrict every capability chart to cases that
  // selected this timed factor (null = all). Gives the ASAP measure its meaning.
  const [whatMattersScope, setWhatMattersScope] = useState<string | null>(null);
  // R11: the flow capability view is a stack of independent <CapabilityChart>s.
  // Each owns its own measure + data + inspector + export region. ids are a plain
  // counter (no Date/random — keeps SSR/build deterministic).
  const [chartIds, setChartIds] = useState<string[]>(['cap-1']);
  const [capPptxExporting, setCapPptxExporting] = useState(false);

  const getDateRangeParams = useCallback((): { from?: string; to?: string } => {
    if (dateRange === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return { from: today.toISOString() };
    } else if (dateRange === '7d') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return { from: d.toISOString() };
    } else if (dateRange === '30d') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      return { from: d.toISOString() };
    } else if (dateRange === 'custom') {
      const params: { from?: string; to?: string } = {};
      // Parse the picked day as LOCAL midnight..end-of-day. `new Date('YYYY-MM-DD')`
      // is UTC midnight, which dropped the first 1–2 local hours of the start day
      // for UTC+ users; appending T00:00:00 (no Z) parses in local time to match
      // the local end-of-day `to` below and the local-day 'today' branch.
      if (customFrom) { const d = new Date(`${customFrom}T00:00:00`); params.from = d.toISOString(); }
      if (customTo) {
        const toDate = new Date(`${customTo}T00:00:00`); toDate.setHours(23, 59, 59, 999);
        params.to = toDate.toISOString();
      }
      return params;
    }
    return {};
  }, [dateRange, customFrom, customTo]);

  // Word-cloud theme extraction is O(notes × words) and was recomputed on every
  // dashboard render; memoize on the notes it reads (DASH-10). The other derived
  // arrays below are trivial O(n) maps, left inline.
  const whatMattersThemes = useMemo(
    () => (data?.whatMattersNotes ? extractThemes(data.whatMattersNotes.map((n) => n.text)) : []),
    [data?.whatMattersNotes],
  );

  // Stable range object for the capability view's chart props. Computed in the
  // render body it would mint a fresh (ms-precision) object every render, and
  // since dateFrom/dateTo are fetch-effect deps in each chart, that re-fired
  // every chart's fetch on any unrelated re-render. Memoized on the same inputs
  // as getDateRangeParams so the identity is stable until the filter changes.
  const capRange = useMemo(() => getDateRangeParams(), [getDateRangeParams]);

  const dateRangeLabels: Record<DateRange, string> = {
    all: t('dashboard.allTime'),
    today: t('dashboard.today'),
    '7d': t('dashboard.7days'),
    '30d': t('dashboard.30days'),
    custom: t('dashboard.custom'),
  };

  // Latest-request token: a slower earlier response (e.g. after a fast filter
  // change) must not overwrite the current view. Bumped per call; a resolved
  // fetch only applies if it is still the latest.
  const dashReqRef = useRef(0);
  const loadDashboard = useCallback(async () => {
    const reqId = ++dashReqRef.current;
    setLoading(true);
    let url = `/api/studies/${encodeURIComponent(code)}/dashboard`;
    const range = getDateRangeParams();
    const queryParams: string[] = [];
    if (range.from) queryParams.push(`from=${range.from}`);
    if (range.to) queryParams.push(`to=${range.to}`);
    if (valueDemandFilter.length) queryParams.push(`valueDemands=${encodeURIComponent(valueDemandFilter.join(','))}`);
    if (queryParams.length) url += '?' + queryParams.join('&');

    try {
      const res = await fetch(url);
      if (dashReqRef.current !== reqId) return; // superseded by a newer request
      if (res.ok) setData(await res.json());
    } finally {
      if (dashReqRef.current === reqId) setLoading(false);
    }
  }, [code, getDateRangeParams, valueDemandFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    fetch(`/api/studies/${encodeURIComponent(code)}`)
      .then(r => r.ok ? r.json() : null)
      .then(s => {
        if (!s) return;
        setStudyName(s.name);
        setStudyPurpose(s.purpose || '');
        setSystemType(s.systemType ?? null);
        setWorkTrackingEnabled(s.workTrackingEnabled);
        setDemandTypesEnabled(s.demandTypesEnabled ?? false);
        setCaseTrackingEnabled(s.caseTrackingEnabled ?? false);
        setSystemConditionsEnabled(s.systemConditionsEnabled ?? false);
        setSynthesisEnabled(s.synthesisEnabled ?? false);
        setWorkTypesEnabled(s.workTypesEnabled ?? false);
        setWorkStepTypesEnabled(s.workStepTypesEnabled ?? false);
        setFlowAnalyticsEnabled(s.flowAnalyticsEnabled ?? false);
        setLifeProblemsEnabled(s.lifeProblemsEnabled ?? false);
        setLifeProblems(Array.isArray(s.lifeProblems) ? s.lifeProblems : []);
        setValueDemandTypes((Array.isArray(s.demandTypes) ? s.demandTypes : [])
          .filter((d: { category?: string }) => d.category === 'value')
          .map((d: { id: string; label: string }) => ({ id: d.id, label: d.label })));
        setValueSteps((Array.isArray(s.valueSteps) ? s.valueSteps : [])
          .slice()
          .sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder)
          .map((v: { id: string; label: string }) => ({ id: v.id, label: v.label })));
        setMilestones(Array.isArray(s.milestones) ? s.milestones : []);
        setWhatMattersTypes(Array.isArray(s.whatMattersTypes) ? s.whatMattersTypes : []);
        // Derive effective layer from the capture toggles so the dashboard
        // gates stay in sync with what the team chose to capture.
        let effective = 1;
        if (s.classificationEnabled) effective = 2;
        if (s.handlingEnabled) effective = Math.max(effective, 3);
        if (s.valueLinkingEnabled) effective = Math.max(effective, 4);
        if ((s.whatMattersTypes?.length || 0) > 0) effective = Math.max(effective, 5);
        setActiveLayer(effective);
        setFullStudy(s as EntryEditModalStudy);
      });
  }, [code]);

  // Case list for the Touches-over-time scope selector (only when case tracking is on).
  useEffect(() => {
    if (!caseTrackingEnabled) return;
    fetch(`/api/studies/${encodeURIComponent(code)}/cases`)
      .then((r) => r.ok ? r.json() : [])
      .then((rows) => setCases(Array.isArray(rows) ? rows.map((c: { id: string; caseRef: string }) => ({ id: c.id, caseRef: c.caseRef })) : []));
  }, [code, caseTrackingEnabled]);

  // Fetch system conditions when a Sankey flow link is clicked
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedFlow) { setFlowCauses(null); return; }
    setFlowCausesLoading(true);
    const qp = new URLSearchParams({
      source: selectedFlow.sourceLabel,
      target: selectedFlow.targetLabel,
    });
    const range = getDateRangeParams();
    if (range.from) qp.set('from', range.from);
    if (range.to) qp.set('to', range.to);
    let cancelled = false;
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/flow-causes?${qp}`)
      .then(r => r.ok ? r.json() : { causes: [] })
      .then(d => { if (!cancelled) setFlowCauses(d.causes); })
      .finally(() => { if (!cancelled) setFlowCausesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedFlow, code, getDateRangeParams]);

  // Ask delivery (slice 4): refetch when the Analytics tab is open and the
  // date range / P2BS scope changes. Same params as the main dashboard fetch.
  useEffect(() => {
    if (dashboardView !== 'analytics') return;
    const qp = new URLSearchParams();
    const range = getDateRangeParams();
    if (range.from) qp.set('from', range.from);
    if (range.to) qp.set('to', range.to);
    if (valueDemandFilter.length) qp.set('valueDemands', valueDemandFilter.join(','));
    let cancelled = false;
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/ask-delivery?${qp}`)
      .then(r => r.ok ? r.json() : { rows: [] })
      .then(d => { if (!cancelled) setAskDelivery(d.rows); })
      .catch(() => { if (!cancelled) setAskDelivery([]); });
    return () => { cancelled = true; };
  }, [dashboardView, code, getDateRangeParams, valueDemandFilter]);

  // P2BS → value demand Sankey: refetch when the Analytics tab is open and the
  // date range / value-demand scope changes. Flow-only endpoint (P2BS + value
  // demands live on cases). `systemType` directly — `isFlow` is declared later.
  useEffect(() => {
    if (dashboardView !== 'analytics' || systemType !== 'flow') return;
    const qp = new URLSearchParams();
    const range = getDateRangeParams();
    if (range.from) qp.set('from', range.from);
    if (range.to) qp.set('to', range.to);
    if (valueDemandFilter.length) qp.set('valueDemands', valueDemandFilter.join(','));
    let cancelled = false;
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/p2bs-value-demand?${qp}`)
      .then(r => r.ok ? r.json() : { links: [], cases: {} })
      .then(d => { if (!cancelled) setP2bsVd(d); })
      .catch(() => { if (!cancelled) setP2bsVd({ links: [], cases: {} }); });
    return () => { cancelled = true; };
  }, [dashboardView, systemType, code, getDateRangeParams, valueDemandFilter]);

  // Budget capability (2026-07-05): fetch only when Ask delivery reports an
  // amount-kind field, so studies without budget asks never pay the request.
  // Same params as the ask-delivery fetch.
  const hasAmountAsk = !!askDelivery?.some((r) => r.kind === 'amount' || r.kind === 'number' || r.kind === 'currency');
  useEffect(() => {
    // No clearing setState here (lint: set-state-in-effect) — the card render
    // is ALSO gated on hasAmountAsk, so stale data can never show.
    if (dashboardView !== 'analytics' || !hasAmountAsk) return;
    const qp = new URLSearchParams();
    const range = getDateRangeParams();
    if (range.from) qp.set('from', range.from);
    if (range.to) qp.set('to', range.to);
    if (valueDemandFilter.length) qp.set('valueDemands', valueDemandFilter.join(','));
    let cancelled = false;
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/budget-capability?${qp}`)
      .then(r => r.ok ? r.json() : { fields: [] })
      .then(d => { if (!cancelled) setBudgetCapability(d.fields); })
      .catch(() => { if (!cancelled) setBudgetCapability([]); });
    return () => { cancelled = true; };
  }, [dashboardView, hasAmountAsk, code, getDateRangeParams, valueDemandFilter]);

  // Capability: event options (fixed + milestones + decision points) for the
  // two pickers. Token ids match the backend (caseOpen/caseClose,
  // milestone:<id>).
  const capabilityAvailable = caseTrackingEnabled && milestones.length > 0;
  // R7: flow studies get a capability-only dashboard (demand widgets stripped).
  const isFlow = systemType === 'flow';
  // Synthesis (0028/0030): the "Synthesise" tab is available once the toggle is
  // on and there's at least one synthesisable taxonomy (system conditions, work
  // types, or work step types).
  const synthesisAvailable = synthesisEnabled && (systemConditionsEnabled || workTypesEnabled || workStepTypesEnabled);
  // Flow analytics (0029): the demand-style "Analytics" tab, opt-in per study.
  const flowAnalyticsAvailable = isFlow && flowAnalyticsEnabled;
  const eventOptions: PillSelectOption[] = useMemo(() => {
    const ms = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder).map((m) => ({ id: `milestone:${m.id}`, label: `◇ ${tl(m.label)}` }));
    // 'by_date' what-matters types add a target-date event (the customer's
    // wanted date). Pair it with a completion event + the "days early/late"
    // metric to measure whether we met the date.
    const wm = whatMattersTypes.filter((w) => w.timing === 'by_date').map((w) => ({ id: `whatMattersTarget:${w.id}`, label: `📅 ${tl(w.label)}` }));
    // 'asap' types with an anchor (a milestone OR decision-point event token) add
    // a case-open → that-event measure (auto-scoped to ASAP-tagged cases). Pair
    // with case opened + Lead time.
    const anchorLabel = (tok: string) => {
      if (tok.startsWith('milestone:')) { const m = milestones.find((x) => x.id === tok.slice('milestone:'.length)); return m ? `◇ ${tl(m.label)}` : '?'; }
      return '?';
    };
    const wmAsap = whatMattersTypes
      .filter((w) => w.timing === 'asap')
      .map((w) => ({ w, tok: w.anchorEvent ?? (w.anchorMilestoneId ? `milestone:${w.anchorMilestoneId}` : null) }))
      .filter((x) => x.tok)
      .map((x) => ({ id: `whatMattersAsap:${x.w.id}`, label: `⏱ ${tl(x.w.label)} → ${anchorLabel(x.tok!)}` }));
    return [
      { id: 'caseOpen', label: t('dashboard.evCaseOpened') },
      ...ms,
      ...wm,
      ...wmAsap,
      { id: 'caseClose', label: t('dashboard.evCaseClosed') },
    ];
  }, [milestones, whatMattersTypes, t, tl]);

  // R7: flow studies show only the capability view.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isFlow) setDashboardView('capability');
  }, [isFlow]);

  // R11: add / remove a stacked capability chart. ids are a simple max+1 counter.
  const addChart = useCallback(() => {
    setChartIds((prev) => {
      const n = prev.reduce((m, id) => Math.max(m, parseInt(id.replace('cap-', ''), 10) || 0), 0) + 1;
      return [...prev, `cap-${n}`];
    });
  }, []);
  const removeChart = useCallback((id: string) => {
    setChartIds((prev) => prev.filter((x) => x !== id));
  }, []);

  // R11: branded PowerPoint of the charts in the CURRENTLY SHOWN flow view
  // (Capability or Analytics) — not just capability. Every dashboard card's
  // export region carries data-chart-export + data-chart-title (CapabilityChart
  // also has the legacy data-capability-export/data-cap-title); only the active
  // view is mounted, so a document-wide query returns exactly what's on screen.
  // Collapsed cards stay in the DOM (CSS-clipped) so they're included too.
  const handleExportCapabilityPptx = useCallback(async () => {
    if (capPptxExporting) return;
    setCapPptxExporting(true);
    try {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-chart-export], [data-capability-export]'));
      const slides: { title: string; dataUrl: string; wPx: number; hPx: number }[] = [];
      for (const node of nodes) {
        // Capture the on-screen pixel size so the slide can keep the chart's
        // exact aspect ratio (rect is full-size even when the card is collapsed).
        const rect = node.getBoundingClientRect();
        const dataUrl = await nodeToPngDataUrl(node);
        slides.push({ title: node.getAttribute('data-chart-title') || node.getAttribute('data-cap-title') || studyName || code, dataUrl, wPx: rect.width, hPx: rect.height });
      }
      if (slides.length) {
        const rangeLabel = dateRange === 'custom' && (customFrom || customTo)
          ? [customFrom, customTo].filter(Boolean).join(' – ')
          : dateRangeLabels[dateRange];
        const subtitle = dashboardView === 'analytics' ? t('dashboard.analyticsTab')
          : dashboardView === 'synthesis' ? t('dashboard.synthesisTab')
          : t('dashboard.capabilityTab');
        await exportCapabilityChartsToPptx(slides, studyName || code, rangeLabel, `${dashboardView}-${code}.pptx`, subtitle);
      }
    } catch (err) {
      console.error('Dashboard PPTX export error:', err);
    }
    setCapPptxExporting(false);
  }, [capPptxExporting, studyName, code, dateRange, customFrom, customTo, dateRangeLabels, dashboardView, t]);

  // R11: download every input made to the study as a multi-sheet spreadsheet.
  const handleDownloadAllData = useCallback(() => {
    window.open(`/api/studies/${encodeURIComponent(code)}/export-all`, '_blank');
  }, [code]);

  // Fetch raw entries and demand type map on demand
  useEffect(() => {
    if (!showEntries) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntriesLoading(true);
    Promise.all([
      fetch(`/api/studies/${encodeURIComponent(code)}/entries`).then(r => r.ok ? r.json() : { entries: [] }),
      fetch(`/api/studies/${encodeURIComponent(code)}/demand-types`).then(r => r.ok ? r.json() : []),
    ])
      .then(([entriesData, types]) => {
        setEntries(entriesData.entries || []);
        const map = new Map<string, string>();
        for (const dt of types) map.set(dt.id, dt.label);
        setDemandTypeMap(map);
      })
      .finally(() => setEntriesLoading(false));
  }, [showEntries, code, entriesRefreshTick]);

  function handleExport() {
    let url = `/api/studies/${encodeURIComponent(code)}/entries/export`;
    const range = getDateRangeParams();
    const qp: string[] = [];
    if (range.from) qp.push(`from=${range.from}`);
    if (range.to) qp.push(`to=${range.to}`);
    if (qp.length) url += '?' + qp.join('&');
    window.open(url, '_blank');
  }

  async function handleExportPptx() {
    if (!data) return;
    setExportingPptx(true);
    try {
      const rangeLabel = dateRange === 'custom' && (customFrom || customTo)
        ? [customFrom, customTo].filter(Boolean).join(' – ')
        : dateRangeLabels[dateRange];
      await exportDashboardToPptx(data, studyName || code, locale, rangeLabel, tl, activeLayer, demandTypesEnabled);
    } catch (err) {
      console.error('PPTX export error:', err);
    }
    setExportingPptx(false);
  }

  function handleDownloadTemplate() {
    window.open(`/api/studies/${encodeURIComponent(code)}/entries/template`, '_blank');
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/import`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setUploadMessage({ type: 'error', text: t('dashboard.uploadError', { error: result.error || 'Unknown error' }) });
      } else {
        let msg = t('dashboard.uploadSuccess', { count: String(result.imported) });
        if (result.errors?.length > 0) {
          msg += ` (${result.errors.length} errors)`;
        }
        setUploadMessage({ type: 'success', text: msg });
        loadDashboard();
        // Also refresh the open raw-entries list + demand-type map.
        setEntriesRefreshTick((n) => n + 1);
      }
    } catch {
      setUploadMessage({ type: 'error', text: t('dashboard.uploadError', { error: 'Network error' }) });
    }

    setUploading(false);
    e.target.value = '';
  }

  if (loading && !data) {
    return <div className="p-4 text-gray-500">{t('dashboard.loading')}</div>;
  }

  if (!data) {
    return <div className="p-4 text-red-600">{t('dashboard.loadFailed')}</div>;
  }

  const pieData = [
    { name: t('capture.value'), value: data.valueCount, color: COLORS.value },
    { name: t('capture.failure'), value: data.failureCount, color: COLORS.failure },
  ];

  const valuePercent = data.totalEntries > 0 ? Math.round((data.valueCount / data.totalEntries) * 100) : 0;
  const failurePercent = data.totalEntries > 0 ? Math.round((data.failureCount / data.totalEntries) * 100) : 0;

  // Translate labels + add percentage for bar charts
  const totalDemandTypeCount = data.demandTypeCounts.reduce((s, d) => s + d.count, 0);
  const translatedDemandTypeCounts = data.demandTypeCounts.map(d => ({
    ...d, label: tl(d.label),
    pct: totalDemandTypeCount > 0 ? `${Math.round((d.count / totalDemandTypeCount) * 100)}%` : '0%',
  }));
  const translatedHandlingTypeCounts = data.handlingTypeCounts.map(d => ({ ...d, label: tl(d.label) }));
  const translatedContactMethodCounts = data.contactMethodCounts.map(d => ({ ...d, label: tl(d.label) }));
  const translatedHandlingByClassification = data.handlingByClassification.map(d => {
    const total = d.valueCount + d.failureCount;
    return {
      ...d, label: tl(d.label),
      valuePct: total > 0 ? `${Math.round((d.valueCount / total) * 100)}%` : '',
      failurePct: total > 0 ? `${Math.round((d.failureCount / total) * 100)}%` : '',
    };
  });
  const totalWmCount = data.whatMattersCounts.reduce((s, d) => s + d.count, 0);
  const translatedWhatMattersCounts = data.whatMattersCounts.map(d => ({
    ...d, label: tl(d.label),
    pct: totalWmCount > 0 ? `${Math.round((d.count / totalWmCount) * 100)}%` : '0%',
  }));
  const translatedWmByClassification = (data.whatMattersByClassification || []).map(d => {
    const total = d.valueCount + d.failureCount;
    return {
      ...d, label: tl(d.label),
      valuePct: total > 0 ? `${Math.round((d.valueCount / total) * 100)}%` : '',
      failurePct: total > 0 ? `${Math.round((d.failureCount / total) * 100)}%` : '',
    };
  });

  const translatedPotByClassification = (data.pointOfTransactionByClassification || []).map(d => {
    const total = d.valueCount + d.failureCount;
    return {
      ...d, label: tl(d.label),
      valuePct: total > 0 ? `${Math.round((d.valueCount / total) * 100)}%` : '',
      failurePct: total > 0 ? `${Math.round((d.failureCount / total) * 100)}%` : '',
      total,
      totalPct: data.totalEntries > 0 ? `${Math.round((total / data.totalEntries) * 100)}%` : '0%',
    };
  });

  const notesByDate = new Map<string, string[]>();
  const notesByDemandType = new Map<string, Array<{ text: string; date: string; classification: string | null }>>();
  if (data.whatMattersNotes) {
    for (const note of data.whatMattersNotes) {
      const existing = notesByDate.get(note.date) || [];
      existing.push(note.text);
      notesByDate.set(note.date, existing);
      // Group by demand type label
      const groupKey = note.demandTypeLabel || '_unclassified';
      const dtGroup = notesByDemandType.get(groupKey) || [];
      dtGroup.push({ text: note.text, date: note.date, classification: note.classification });
      notesByDemandType.set(groupKey, dtGroup);
    }
  }

  const tickStyle = { fontSize: 11, fill: THEME.textSecondary };

  return (
    <div className="pb-8">
      <div className="max-w-5xl mx-auto p-4 space-y-5">
        {/* Purpose statement */}
        {studyPurpose && (
          <div className="px-4 py-3 rounded-xl bg-white border border-gray-200">
            <p className="text-xs font-medium text-gray-400 mb-0.5">{t('dashboard.purpose')}</p>
            <p className="text-sm text-gray-800 italic">{studyPurpose}</p>
          </div>
        )}

        {/* Date range + export. Flow (2026-07-02): the Capability / Analytics /
            Synthesise view tabs sit to the LEFT of the date range on this same
            row; the contextual help line drops just beneath the row. */}
        <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-start gap-2">
            {isFlow && (flowAnalyticsAvailable || synthesisAvailable) && (
              <div className="rounded-lg border border-gray-300 bg-gray-50 p-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 px-0.5">{t('dashboard.viewLabel')}</p>
                <PillToggle
                  ariaLabel={t('dashboard.viewLabel')}
                  value={dashboardView}
                  onChange={(v) => setDashboardView(v as DashboardView)}
                  options={(['capability', ...(flowAnalyticsAvailable ? ['analytics'] : []), ...(synthesisAvailable ? ['synthesis'] : [])] as DashboardView[]).map((view) => ({
                    value: view,
                    label: view === 'synthesis' ? t('dashboard.synthesisTab') : view === 'analytics' ? t('dashboard.analyticsTab') : t('dashboard.capabilityTab'),
                  }))}
                />
              </div>
            )}
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 px-0.5">{t('dashboard.periodLabel')}</p>
              <PillToggle
                ariaLabel={t('dashboard.periodLabel')}
                value={dateRange}
                onChange={(v) => setDateRange(v as DateRange)}
                options={(['all', 'today', '7d', '30d', 'custom'] as DateRange[]).map((range) => ({ value: range, label: dateRangeLabels[range] }))}
              />
              {dateRange === 'custom' && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-700"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-700"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isFlow ? (
              /* R11: flow exports — branded PowerPoint of the charts + a full-study
                 spreadsheet, consolidated into one sky "Export" dropdown (2026-07-05).
                 (Per-chart PNG lives on each chart card.) */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={exportMenuOpen}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100"
                >
                  {t('dashboard.exportMenu')}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: exportMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {exportMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} aria-hidden="true" />
                    <div role="menu" className="absolute right-0 mt-1 z-50 min-w-[168px] rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setExportMenuOpen(false); handleDownloadAllData(); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {t('dashboard.downloadAllData')}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={capPptxExporting}
                        onClick={() => { setExportMenuOpen(false); handleExportCapabilityPptx(); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {capPptxExporting ? '...' : t('dashboard.exportPptx')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button onClick={handleDownloadTemplate} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
                  {t('dashboard.downloadTemplate')}
                </button>
                <label className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploading ? t('dashboard.uploading') : t('dashboard.uploadXlsx')}
                  <input type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" disabled={uploading} />
                </label>
                <button onClick={handleExport} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
                  {t('dashboard.export')}
                </button>
                <button onClick={handleExportPptx} disabled={exportingPptx || !data || data.totalEntries === 0} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-brand text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
                  {exportingPptx ? '...' : t('dashboard.exportPptx')}
                </button>
              </>
            )}
          </div>
        </div>
        {/* Contextual help for Analytics / Synthesise only — the Capability view
            is self-explanatory, so no explainer there (2026-07-02). */}
        {isFlow && (dashboardView === 'analytics' || dashboardView === 'synthesis') && (
          <p className="text-xs text-gray-400 mt-1.5">{dashboardView === 'synthesis' ? t('dashboard.synthesisTabHelp') : t('dashboard.analyticsTabHelp')}</p>
        )}
        </div>

        {uploadMessage && (
          <div className={`p-3 rounded-lg text-sm ${uploadMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {uploadMessage.text}
          </div>
        )}

        {/* Dashboard view tabs — demand always; work/overview when there's work
            data; capability when the study tracks cases with decisions/milestones. */}
        {!isFlow && (() => {
          const hasWork = workTrackingEnabled && data.workCount > 0;
          const tabs: DashboardView[] = [
            'demand',
            ...((hasWork ? ['work', 'overview'] : []) as DashboardView[]),
            ...((capabilityAvailable ? ['capability'] : []) as DashboardView[]),
            ...((synthesisAvailable ? ['synthesis'] : []) as DashboardView[]),
          ];
          if (tabs.length <= 1) return null;
          const tabLabel = (v: DashboardView) => v === 'demand' ? t('dashboard.demandTab') : v === 'work' ? t('dashboard.workTab') : v === 'overview' ? t('dashboard.overview') : v === 'synthesis' ? t('dashboard.synthesisTab') : t('dashboard.capabilityTab');
          const help = dashboardView === 'demand' ? t('dashboard.demandTabHelp') : dashboardView === 'work' ? t('dashboard.workTabHelp') : dashboardView === 'overview' ? t('dashboard.overviewTabHelp') : dashboardView === 'synthesis' ? t('dashboard.synthesisTabHelp') : t('dashboard.capabilityTabHelp');
          return (
            <div>
              <PillToggle
                ariaLabel={tabLabel(tabs[0])}
                value={dashboardView}
                onChange={(v) => setDashboardView(v as DashboardView)}
                options={tabs.map((view) => ({ value: view, label: tabLabel(view) }))}
              />
              <p className="text-xs text-gray-400 mt-1.5">{help}</p>
            </div>
          );
        })()}

        {/* Flow scope selectors, side by side (2026-07-02): Problems-to-be-solved
            (life problem) on the left, What matters (timed factor) to its right;
            they wrap under each other on narrow screens. */}
        {isFlow && (valueDemandTypes.length > 0 || whatMattersTypes.some((w) => w.timing)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 items-start">
        {isFlow && valueDemandTypes.length > 0 && (
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 px-0.5">{t('dashboard.valueDemand')}</p>
            <PillMultiSelect
              ariaLabel={t('dashboard.valueDemand')}
              value={valueDemandFilter}
              onChange={setValueDemandFilter}
              allLabel={t('dashboard.scopeAll')}
              options={valueDemandTypes.map((d) => ({ value: d.id, label: tl(d.label) }))}
            />
          </div>
        )}

        {/* What-matters scope (flow): restrict every capability chart to cases
            that selected a timed factor. "As soon as possible" + case-open →
            completion lead time = the ASAP measure. */}
        {isFlow && whatMattersTypes.some((w) => w.timing) && (
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 px-0.5">{t('dashboard.scopeWhatMatters')}</p>
            <PillToggle
              ariaLabel={t('dashboard.scopeWhatMatters')}
              value={whatMattersScope ?? ''}
              onChange={(v) => setWhatMattersScope(v || null)}
              options={[{ value: '', label: t('dashboard.scopeAll') }, ...whatMattersTypes.filter((w) => w.timing).map((w) => ({ value: w.id, label: `${w.timing === 'by_date' ? '📅 ' : '⏱ '}${tl(w.label)}` }))]}
            />
          </div>
        )}
        </div>
        )}

        {/* Summary cards */}
        {!isFlow && dashboardView === 'demand' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card label={t('dashboard.totalEntries')} value={data.totalEntries} />
          {activeLayer >= 2 && <Card label={t('dashboard.valueDemand')} value={`${valuePercent}%`} sub={`${data.valueCount} ${t('dashboard.entries')}`} color={COLORS.value} />}
          {activeLayer >= 2 && <Card label={t('dashboard.failureDemand')} value={`${failurePercent}%`} sub={`${data.failureCount} ${t('dashboard.entries')}`} color={COLORS.failure} />}
          {activeLayer >= 3 && <Card label={t('dashboard.perfect')} value={`${data.perfectPercentage}%`} sub={t('dashboard.perfectSub')} color="#22c55e" />}
          {activeLayer >= 2 && data.unknownCount > 0 && (
            <Card label={t('dashboard.unknownEntries')} value={data.unknownCount} color="#f59e0b" />
          )}
        </div>
        )}

        {/* ── DEMAND VIEW ── */}
        {!isFlow && dashboardView === 'demand' && data.totalEntries === 0 && (
          <div className="rounded-xl p-8 text-center bg-white border border-gray-200">
            <p className="text-lg font-semibold text-gray-700 mb-2">{t('dashboard.noEntries')}</p>
            <p className="text-sm text-gray-500">{t('dashboard.noEntriesHint')}</p>
          </div>
        )}
        {!isFlow && dashboardView === 'demand' && data.totalEntries > 0 && (
          <>
            {/* Value/Failure pie (Layer 2+) */}
            {activeLayer >= 2 && <ChartCard title={t('dashboard.valueVsFailure')}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="value"
                    label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>}

            {/* Top 10 Demand Types (when demand types enabled) */}
            {demandTypesEnabled && <ChartCard title={t('dashboard.top10')}>
              <ResponsiveContainer width="100%" height={Math.max(300, translatedDemandTypeCounts.length * 40 + 40)}>
                <BarChart data={translatedDemandTypeCounts} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                  <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                  <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 18) + '…' : v} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill={COLORS.value} radius={[0, 4, 4, 0]}>
                    {translatedDemandTypeCounts.map((d, i) => (
                      <Cell key={i} fill={d.category === 'failure' ? COLORS.failure : COLORS.value} />
                    ))}
                    <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>}

            {/* Demand over time */}
            {data.demandOverTime.length > 1 && (
              <ChartCard title={t('dashboard.overTime')}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.demandOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis dataKey="date" tick={tickStyle} />
                    <YAxis allowDecimals={false} tick={tickStyle} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ color: THEME.textSecondary }} />
                    <Line type="monotone" dataKey="valueCount" name={t('capture.value')} stroke={COLORS.value} strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="failureCount" name={t('capture.failure')} stroke={COLORS.failure} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Handling pie + Handling by classification (Layer 3+) */}
            {activeLayer >= 3 && <div className="grid md:grid-cols-2 gap-4">
              <ChartCard title={t('dashboard.handlingTitle')}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={translatedHandlingTypeCounts} cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="count" nameKey="label"
                      label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {translatedHandlingTypeCounts.map((_, i) => (<Cell key={i} fill={COLORS.neutral[i % COLORS.neutral.length]} />))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t('dashboard.handlingByClass')}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={translatedHandlingByClassification} margin={{ left: 10, right: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: THEME.textSecondary }} angle={-20} textAnchor="end" interval={0} height={50} />
                    <YAxis allowDecimals={false} tick={tickStyle} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ color: THEME.textSecondary, fontSize: 12 }} />
                    <Bar dataKey="valueCount" name={t('capture.value')} fill={COLORS.value} stackId="a" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="valuePct" position="center" style={{ fill: '#fff', fontSize: 9, fontWeight: 600 }} />
                    </Bar>
                    <Bar dataKey="failureCount" name={t('capture.failure')} fill={COLORS.failure} stackId="a">
                      <LabelList dataKey="failurePct" position="center" style={{ fill: '#fff', fontSize: 9, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>}

            {/* Failures by original value demand type */}
            {activeLayer >= 2 && data.failuresByOriginalValueDemand && data.failuresByOriginalValueDemand.length > 0 && (
              <ChartCard title={t('dashboard.failureByValueTitle')}>
                <ResponsiveContainer width="100%" height={Math.max(200, data.failuresByOriginalValueDemand.length * 45)}>
                  <BarChart data={data.failuresByOriginalValueDemand} layout="vertical" margin={{ left: 10, right: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: THEME.textSecondary, fontSize: 12 }} />
                    <YAxis type="category" dataKey="label" width={140} tick={{ fill: THEME.text, fontSize: 12 }} tickFormatter={(v: string) => tl(v)} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill={COLORS.failure} radius={[0, 4, 4, 0]}
                      label={(props) => {
                        const total = data.failuresByOriginalValueDemand.reduce((s, d) => s + d.count, 0);
                        const pct = total > 0 ? Math.round(((props.value as number) / total) * 100) : 0;
                        return `${props.value} (${pct}%)`;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Failure Flow Sankey */}
            {activeLayer >= 2 && (() => {
              const flowLinks = data.failureFlowLinks || [];
              if (flowLinks.length === 0) return null;
              const sankeyData = buildSankeyData(flowLinks, tl);
              const totalNodes = sankeyData.nodes.length;
              const sc = sankeyData.sourceCount;
              const meta = sankeyData.linkMeta;
              return (
                <ChartCard title={t('dashboard.failureFlow')}>
                  <p className="text-xs text-gray-500 mb-2 -mt-1">{t('dashboard.flowClickHint')}</p>
                  <ResponsiveContainer width="100%" height={Math.max(300, totalNodes * 35)}>
                    <Sankey
                      data={sankeyData}
                      nodePadding={24}
                      nodeWidth={10}
                      linkCurvature={0.5}
                      margin={{ top: 10, right: 160, bottom: 10, left: 160 }}
                      node={(props: NodeProps) => <SankeyNode {...props} sourceCount={sc} />}
                      link={(props: LinkProps) => {
                        const m = meta.get(props.index);
                        return <SankeyLink {...props} onClick={m ? () => setSelectedFlow(m) : undefined} />;
                      }}
                    >
                      <Tooltip />
                    </Sankey>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}

            {/* Lifecycle Sankey + failure-by-stage */}
            {data.lifecycleEnabled && (data.lifecycleByStageAndDemandType?.length ?? 0) > 0 && (() => {
              const rows = data.lifecycleByStageAndDemandType;
              const stageOrder: string[] = [];
              const stageSeen = new Set<string>();
              for (const r of rows) {
                if (!stageSeen.has(r.stageLabel)) { stageSeen.add(r.stageLabel); stageOrder.push(r.stageLabel); }
              }
              // Type nodes grouped by stage (in stage order), then value-before-failure
              // within each stage. Shared types — those that appear under more than one
              // stage — are placed with their first-seen stage. This keeps each stage's
              // outflows as a contiguous block on the right side of the Sankey so the
              // value/failure grouping for that stage is visually coherent.
              // (Feedback 2026-04-16: previous ordering separated all value from all
              // failure globally, which made links cross unnecessarily.)
              const typeOrder: Array<{ label: string; category: 'value' | 'failure' }> = [];
              const typeSeen = new Set<string>();
              for (const stage of stageOrder) {
                for (const cat of ['value', 'failure'] as const) {
                  for (const r of rows) {
                    if (r.stageLabel === stage && r.demandTypeCategory === cat && !typeSeen.has(r.demandTypeLabel)) {
                      typeSeen.add(r.demandTypeLabel);
                      typeOrder.push({ label: r.demandTypeLabel, category: cat });
                    }
                  }
                }
              }
              const nodes = [
                ...stageOrder.map(s => ({ name: s })),
                ...typeOrder.map(tObj => ({ name: tl(tObj.label) })),
              ];
              const stageIdx = new Map(stageOrder.map((s, i) => [s, i]));
              const typeIdx = new Map(typeOrder.map((tObj, i) => [tObj.label, i + stageOrder.length]));
              const links = rows.map(r => ({
                source: stageIdx.get(r.stageLabel)!,
                target: typeIdx.get(r.demandTypeLabel)!,
                value: r.count,
              }));
              const linkCategory = rows.map(r => r.demandTypeCategory);
              // Node category map: stages default to 'stage' (green), types use their category
              const nodeCategory: Array<'stage' | 'value' | 'failure'> = [
                ...stageOrder.map(() => 'stage' as const),
                ...typeOrder.map(tObj => tObj.category),
              ];
              return (
                <ChartCard title={t('dashboard.lifecycleSankey')}>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-2 -mt-1">
                    <span className="inline-flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.value }} />{tl('Value demand')}</span>
                    <span className="inline-flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.failure }} />{tl('Failure demand')}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(280, nodes.length * 32)}>
                    <Sankey
                      data={{ nodes, links }}
                      nodePadding={24}
                      nodeWidth={10}
                      linkCurvature={0.5}
                      margin={{ top: 10, right: 180, bottom: 10, left: 160 }}
                      node={(props: NodeProps) => {
                        const cat = nodeCategory[props.index];
                        const fill = cat === 'stage' ? '#6366f1' : cat === 'value' ? COLORS.value : COLORS.failure;
                        return <SankeyNode {...props} sourceCount={stageOrder.length} fillOverride={fill} />;
                      }}
                      link={(props: LinkProps) => {
                        const { onClick: _omit, ...rest } = props;
                        void _omit;
                        const stroke = linkCategory[props.index] === 'value' ? COLORS.value : COLORS.failure;
                        return <SankeyLink {...rest} stroke={stroke} />;
                      }}
                    >
                      <Tooltip />
                    </Sankey>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}

            {data.lifecycleEnabled && (data.lifecycleFailureByStage?.length ?? 0) > 0 && (
              <ChartCard title={t('dashboard.lifecycleByStage')}>
                <ResponsiveContainer width="100%" height={Math.max(220, data.lifecycleFailureByStage.length * 38 + 40)}>
                  <BarChart data={data.lifecycleFailureByStage} layout="vertical" margin={{ left: 10, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                    <YAxis type="category" dataKey="stageLabel" width={120} tick={{ fontSize: 11, fill: THEME.textSecondary }} interval={0} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill={COLORS.failure} radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="count" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Contact methods + What Matters */}
            <div className="grid md:grid-cols-2 gap-4">
              {data.contactMethodCounts.length > 0 && (
                <ChartCard title={t('dashboard.contactMethods')}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={translatedContactMethodCounts} cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="count" nameKey="label"
                        label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {translatedContactMethodCounts.map((_, i) => (<Cell key={i} fill={COLORS.neutral[i % COLORS.neutral.length]} />))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {data.whatMattersCounts.length > 0 && (
                <ChartCard title={t('dashboard.whatMatters')}>
                  <ResponsiveContainer width="100%" height={Math.max(250, translatedWhatMattersCounts.length * 32 + 40)}>
                    <BarChart data={translatedWhatMattersCounts} layout="vertical" margin={{ left: 10, right: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" fill={COLORS.value} radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 10 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>

            {/* Life Problems Being Solved (Phase 3) — demand-only, layer 2+ */}
            {activeLayer >= 2 && data.lifeProblemCounts.length > 0 && (() => {
              const translated = data.lifeProblemCounts.map(d => ({ ...d, label: tl(d.label) }));
              const total = translated.reduce((s, r) => s + r.count, 0);
              const withPct = translated.map(r => ({
                ...r,
                pct: total > 0 ? `${Math.round((r.count / total) * 100)}%` : '0%',
              }));
              return (
                <ChartCard title={t('dashboard.lifeProblems')}>
                  <ResponsiveContainer width="100%" height={Math.max(250, withPct.length * 40 + 40)}>
                    <BarChart data={withPct} layout="vertical" margin={{ left: 10, right: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 26) + '…' : v} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" fill={COLORS.value} radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}

            {/* What matters by classification (Layer 5+) */}
            {activeLayer >= 5 && translatedWmByClassification.length > 0 && (
              <ChartCard title={t('dashboard.whatMattersByClass')}>
                <ResponsiveContainer width="100%" height={Math.max(250, translatedWmByClassification.length * 50 + 40)}>
                  <BarChart data={translatedWmByClassification} margin={{ left: 10, right: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: THEME.textSecondary }} angle={-20} textAnchor="end" interval={0} height={50} />
                    <YAxis allowDecimals={false} tick={tickStyle} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ color: THEME.textSecondary, fontSize: 12 }} />
                    <Bar dataKey="valueCount" name={t('capture.value')} fill={COLORS.value} stackId="a" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="valuePct" position="center" style={{ fill: '#fff', fontSize: 9, fontWeight: 600 }} />
                    </Bar>
                    <Bar dataKey="failureCount" name={t('capture.failure')} fill={COLORS.failure} stackId="a">
                      <LabelList dataKey="failurePct" position="center" style={{ fill: '#fff', fontSize: 9, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Point of transaction by classification */}
            {translatedPotByClassification.length > 0 && (
              <ChartCard title={t('dashboard.pointOfTransaction')}>
                <ResponsiveContainer width="100%" height={Math.max(200, translatedPotByClassification.length * 50 + 40)}>
                  <BarChart data={translatedPotByClassification} layout="vertical" margin={{ left: 10, right: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                    <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11, fill: THEME.text }} interval={0} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ color: THEME.textSecondary, fontSize: 12 }} />
                    <Bar dataKey="valueCount" name={t('capture.value')} fill={COLORS.value} stackId="a" radius={[0, 0, 0, 0]}>
                      <LabelList dataKey="valuePct" position="center" style={{ fill: '#fff', fontSize: 10, fontWeight: 600 }} />
                    </Bar>
                    <Bar dataKey="failureCount" name={t('capture.failure')} fill={COLORS.failure} stackId="a" radius={[0, 4, 4, 0]}
                      label={(props) => {
                        const item = translatedPotByClassification[props.index as number];
                        if (!item) return '';
                        return `${item.total} (${item.totalPct})`;
                      }}
                    >
                      <LabelList dataKey="failurePct" position="center" style={{ fill: '#fff', fontSize: 10, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Failure causes bar chart (Layer 2+) */}
            {activeLayer >= 2 && data.failureCauses.length > 0 && (() => {
              const top10Causes = data.failureCauses.slice(0, 10);
              const totalCauses = top10Causes.reduce((s, fc) => s + fc.count, 0);
              const causesWithPct = top10Causes.map(fc => ({
                ...fc,
                pct: totalCauses > 0 ? `${Math.round((fc.count / totalCauses) * 100)}%` : '0%',
              }));
              return (
                <ChartCard title={t('dashboard.failureCauses')}>
                  <ResponsiveContainer width="100%" height={Math.max(250, causesWithPct.length * 40 + 40)}>
                    <BarChart data={causesWithPct} layout="vertical" margin={{ left: 10, right: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="cause" width={180} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 26) + '…' : v} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" fill={COLORS.failure} radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}

            {/* Helping conditions bar chart (Layer 2+) — mirror of Failure Causes filtered to dimension = 'helps' */}
            {activeLayer >= 2 && data.helpingConditions.length > 0 && (() => {
              const top10 = data.helpingConditions.slice(0, 10);
              const total = top10.reduce((s, fc) => s + fc.count, 0);
              const withPct = top10.map(fc => ({
                ...fc,
                pct: total > 0 ? `${Math.round((fc.count / total) * 100)}%` : '0%',
              }));
              return (
                <ChartCard title={t('dashboard.helpingConditions')}>
                  <ResponsiveContainer width="100%" height={Math.max(250, withPct.length * 40 + 40)}>
                    <BarChart data={withPct} layout="vertical" margin={{ left: 10, right: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="cause" width={180} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 26) + '…' : v} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" fill={COLORS.value} radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}

            {/* What matters - word cloud */}
            {notesByDate.size > 0 && (() => {
              const themes = whatMattersThemes;
              if (themes.length === 0) return null;
              const maxCount = themes[0].count;
              const minCount = themes[themes.length - 1].count;
              const range = Math.max(maxCount - minCount, 1);
              // Shuffle for visual variety (deterministic based on term)
              const shuffled = [...themes].sort((a, b) => {
                const ha = Array.from(a.term).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
                const hb = Array.from(b.term).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
                return ha - hb;
              });
              return (
                <ChartCard title={t('dashboard.whatMattersThemes')}>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 py-3">
                    {shuffled.map(({ term, count }) => {
                      const t01 = (count - minCount) / range; // 0–1 normalized
                      const fontSize = 12 + t01 * 14; // 12px–26px
                      const opacity = 0.45 + t01 * 0.55; // 0.45–1.0
                      const weight = t01 > 0.5 ? 700 : t01 > 0.2 ? 600 : 400;
                      return (
                        <span
                          key={term}
                          title={`${count}×`}
                          style={{ fontSize: `${fontSize}px`, fontWeight: weight, opacity, color: '#16a34a', lineHeight: 1.3 }}
                        >
                          {term}
                        </span>
                      );
                    })}
                  </div>
                </ChartCard>
              );
            })()}

            {/* What matters - free text notes */}
            {notesByDate.size > 0 && (
              <ChartCard title={`${t('dashboard.whatMattersNotes')} (${data.whatMattersNotes.length})`}>
                {/* Grouping toggle */}
                {demandTypesEnabled && notesByDemandType.size > 1 && (
                  <div className="mb-3">
                    <PillToggle
                      ariaLabel={t('dashboard.groupByDate')}
                      value={notesGroupBy}
                      onChange={(v) => setNotesGroupBy(v as 'date' | 'type')}
                      options={[
                        { value: 'date', label: t('dashboard.groupByDate') },
                        { value: 'type', label: t('dashboard.groupByType') },
                      ]}
                    />
                  </div>
                )}
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {notesGroupBy === 'date' ? (
                    [...notesByDate.entries()].map(([date, notes]) => (
                      <details key={date} open>
                        <summary className="cursor-pointer text-xs font-medium text-gray-500 py-1.5 flex items-center gap-1 select-none">
                          {date} <span className="text-gray-400">({notes.length})</span>
                        </summary>
                        <div className="space-y-1.5 pl-2 pb-2">
                          {notes.map((text, i) => (
                            <div key={i} className="py-1.5 px-3 rounded bg-gray-50 border border-gray-100">
                              <p className="text-sm text-gray-700">{text}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    ))
                  ) : (
                    [...notesByDemandType.entries()]
                      .sort((a, b) => b[1].length - a[1].length)
                      .map(([label, notes]) => {
                        const dt = data.demandTypeCounts.find(d => d.label === label);
                        const colorCls = dt?.category === 'value' ? 'text-green-600' : dt?.category === 'failure' ? 'text-red-600' : 'text-gray-500';
                        const displayLabel = label === '_unclassified' ? t('dashboard.unclassified') : tl(label);
                        return (
                          <details key={label} open>
                            <summary className={`cursor-pointer text-xs font-medium py-1.5 flex items-center gap-1 select-none ${colorCls}`}>
                              {displayLabel} <span className="text-gray-400">({notes.length})</span>
                            </summary>
                            <div className="space-y-1.5 pl-2 pb-2">
                              {notes.map((n, i) => (
                                <div key={i} className="py-1.5 px-3 rounded bg-gray-50 border border-gray-100">
                                  <p className="text-sm text-gray-700">{n.text}</p>
                                  <span className="text-xs text-gray-400">{n.date}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        );
                      })
                  )}
                </div>
              </ChartCard>
            )}

          </>
        )}

        {/* ── WORK VIEW ── */}
        {!isFlow && dashboardView === 'work' && (
          <>
            {/* Work summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card label={t('dashboard.workEntries')} value={data.workCount} />
              <Card label={t('dashboard.valueWorkPct')} value={data.workCount > 0 ? `${Math.round((data.workValueCount / data.workCount) * 100)}%` : '0%'} sub={`${data.workValueCount} ${t('dashboard.entries')}`} color={COLORS.value} />
              <Card label={t('dashboard.failureWorkPct')} value={data.workCount > 0 ? `${Math.round((data.workFailureCount / data.workCount) * 100)}%` : '0%'} sub={`${data.workFailureCount} ${t('dashboard.entries')}`} color={COLORS.failure} />
              {data.workSequenceCount > 0 && (
                <Card label={t('capture.classificationWorkSequence')} value={data.workSequenceCount} color={COLORS.sequence} />
              )}
              {data.workUnknownCount > 0 && (
                <Card label={t('dashboard.unknownEntries')} value={data.workUnknownCount} color="#f59e0b" />
              )}
            </div>

            {data.workCount === 0 ? (
              <div className="rounded-xl p-8 text-center bg-white border border-gray-200 text-gray-600">
                {t('dashboard.noEntries')}
              </div>
            ) : (
              <>
                {/* Work value/failure/sequence pie */}
                <ChartCard title={t('dashboard.workAnalysis')}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const slices: Array<{ name: string; value: number; fill: string }> = [
                            { name: t('capture.value'), value: data.workValueCount, fill: COLORS.value },
                            { name: t('capture.failure'), value: data.workFailureCount, fill: COLORS.failure },
                          ];
                          if (data.workSequenceCount > 0) slices.push({ name: t('capture.classificationWorkSequence'), value: data.workSequenceCount, fill: COLORS.sequence });
                          if (data.workUnknownCount > 0) slices.push({ name: '?', value: data.workUnknownCount, fill: '#f59e0b' });
                          return slices;
                        })()}
                        cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="value"
                        label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Work types by classification — stacked bar */}
                {data.workTypesByClassification && data.workTypesByClassification.length > 0 && (() => {
                  const hasSequence = data.workTypesByClassification.some(d => d.sequenceCount > 0);
                  const translated = data.workTypesByClassification.map(d => ({
                    label: tl(d.label),
                    [t('capture.value')]: d.valueCount,
                    [t('capture.classificationWorkSequence')]: d.sequenceCount,
                    [t('capture.failure')]: d.failureCount,
                    total: d.valueCount + d.failureCount + d.sequenceCount,
                  }));
                  return (
                    <ChartCard title={t('dashboard.workTypesByClass')}>
                      <ResponsiveContainer width="100%" height={Math.max(220, translated.length * 45 + 40)}>
                        <BarChart data={translated} layout="vertical" margin={{ left: 10, right: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                          <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                          <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 23) + '…' : v} />
                          <Tooltip {...tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                          <Bar dataKey={t('capture.value')} stackId="a" fill={COLORS.value} radius={[0, 0, 0, 0]} />
                          {hasSequence && <Bar dataKey={t('capture.classificationWorkSequence')} stackId="a" fill={COLORS.sequence} radius={[0, 0, 0, 0]} />}
                          <Bar dataKey={t('capture.failure')} stackId="a" fill={COLORS.failure} radius={[0, 4, 4, 0]}>
                            <LabelList dataKey="total" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  );
                })()}

                {/* Work types total bar chart */}
                {data.workTypeCounts.length > 0 && (
                  <ChartCard title={t('dashboard.workTypes')}>
                    <ResponsiveContainer width="100%" height={Math.max(200, data.workTypeCounts.length * 40 + 40)}>
                      <BarChart data={(() => {
                        const totalWork = data.workTypeCounts.reduce((s, d) => s + d.count, 0);
                        return data.workTypeCounts.map(d => ({
                          ...d,
                          label: tl(d.label),
                          pct: totalWork > 0 ? `${Math.round((d.count / totalWork) * 100)}%` : '0%',
                        }));
                      })()} layout="vertical" margin={{ left: 10, right: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                        <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                        <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 23) + '…' : v} />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Work over time */}
                {data.workOverTime.length > 1 && (
                  <ChartCard title={t('dashboard.workOverTime')}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.workOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                        <XAxis dataKey="date" tick={tickStyle} />
                        <YAxis allowDecimals={false} tick={tickStyle} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ color: THEME.textSecondary }} />
                        <Line type="monotone" dataKey="valueCount" name={t('capture.value')} stroke={COLORS.value} strokeWidth={2} dot={{ r: 4 }} />
                        {data.workOverTime.some(d => d.sequenceCount > 0) && (
                          <Line type="monotone" dataKey="sequenceCount" name={t('capture.classificationWorkSequence')} stroke={COLORS.sequence} strokeWidth={2} dot={{ r: 4 }} />
                        )}
                        <Line type="monotone" dataKey="failureCount" name={t('capture.failure')} stroke={COLORS.failure} strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Phase 4C (2026-04-16) — Work Step analysis. Only visible when
                    workStepTypesEnabled AND real step-tagged data exists. */}
                {data.workStepTypesEnabled && data.workStepFrequency.length > 0 && (
                  <>
                    <h3 className="text-base font-semibold text-gray-900 mt-4">{t('dashboard.workStepAnalysis')}</h3>

                    {/* 1. Top Work Steps — horizontal bar, colored per tag */}
                    {(() => {
                      const top = data.workStepFrequency.slice(0, 15).map(s => ({
                        label: s.label,
                        count: s.count,
                        fill: s.tag === 'value' ? COLORS.value : COLORS.failure,
                      }));
                      return (
                        <ChartCard title={t('dashboard.topWorkSteps')}>
                          <ResponsiveContainer width="100%" height={Math.max(220, top.length * 32 + 40)}>
                            <BarChart data={top} layout="vertical" margin={{ left: 10, right: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                              <XAxis type="number" allowDecimals={false} tick={tickStyle} domain={[0, 'dataMax']} />
                              <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 20) + '…' : v} />
                              <Tooltip {...tooltipStyle} />
                              <Bar dataKey="count" fill={COLORS.value} radius={[0, 4, 4, 0]}>
                                {top.map((d, i) => (<Cell key={i} fill={d.fill} />))}
                                <LabelList dataKey="count" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartCard>
                      );
                    })()}

                    {/* 2. Work Step × Work Type — stacked bar. demandTypeLabel
                        field carries the work type label in v1 (see
                        aggregations comment on the demand-type linkage gap). */}
                    {data.workStepByDemandType.length > 0 && (() => {
                      // Pivot: rows = work-type labels, columns = work-step labels.
                      // Stack counts as separate Bar components per step.
                      const workTypes = [...new Set(data.workStepByDemandType.map(r => r.demandTypeLabel))];
                      const steps = [...new Map(data.workStepByDemandType.map(r => [r.workStepLabel, r.workStepTag])).entries()];
                      const pivotData = workTypes.map(wt => {
                        const row: Record<string, string | number> = { workType: wt };
                        for (const [step] of steps) {
                          const match = data.workStepByDemandType.find(r => r.demandTypeLabel === wt && r.workStepLabel === step);
                          row[step] = match?.count ?? 0;
                        }
                        return row;
                      });
                      return (
                        <ChartCard title={t('dashboard.workStepByWorkType')}>
                          <ResponsiveContainer width="100%" height={Math.max(260, pivotData.length * 60 + 80)}>
                            <BarChart data={pivotData} margin={{ left: 10, right: 10, bottom: 30 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                              <XAxis dataKey="workType" tick={{ fontSize: 10, fill: THEME.textSecondary }} angle={-15} textAnchor="end" interval={0} height={50} />
                              <YAxis allowDecimals={false} tick={tickStyle} />
                              <Tooltip {...tooltipStyle} />
                              {steps.map(([step, tag]) => (
                                <Bar key={step} dataKey={step} stackId="a" fill={tag === 'value' ? COLORS.value : COLORS.failure} />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartCard>
                      );
                    })()}

                    {/* 3. Capability by Work Type — horizontal bar with value/failure split + pctValue label */}
                    {data.capabilityByDemandType.length > 0 && (
                      <ChartCard title={t('dashboard.capabilityByWorkType')}>
                        <ResponsiveContainer width="100%" height={Math.max(200, data.capabilityByDemandType.length * 48 + 40)}>
                          <BarChart data={data.capabilityByDemandType} layout="vertical" margin={{ left: 10, right: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                            <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                            <YAxis type="category" dataKey="demandTypeLabel" width={140} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 20) + '…' : v} />
                            <Tooltip {...tooltipStyle} />
                            <Legend wrapperStyle={{ color: THEME.textSecondary, fontSize: 12 }} />
                            <Bar dataKey="valueBlocks" name={t('capture.value')} stackId="cap" fill={COLORS.value} />
                            <Bar dataKey="failureBlocks" name={t('capture.failure')} stackId="cap" fill={COLORS.failure}
                              label={(props) => {
                                const item = data.capabilityByDemandType[props.index as number];
                                if (!item) return '';
                                return `${item.pctValue}% value`;
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── OVERVIEW VIEW ── */}
        {!isFlow && dashboardView === 'overview' && (() => {
          const totalCapacity = data.totalEntries + data.workCount;
          const failDemandPct = data.totalEntries > 0 ? Math.round((data.failureCount / data.totalEntries) * 100) : 0;
          const failWorkPct = data.workCount > 0 ? Math.round((data.workFailureCount / data.workCount) * 100) : 0;
          const demandRatio = totalCapacity > 0 ? Math.round((data.totalEntries / totalCapacity) * 100) : 0;
          const workRatio = totalCapacity > 0 ? Math.round((data.workCount / totalCapacity) * 100) : 0;

          return (
            <>
              {/* Key metrics cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Card label={t('dashboard.totalCapacity')} value={totalCapacity} sub={`${data.totalEntries} ${t('dashboard.demandTab').toLowerCase()} + ${data.workCount} ${t('dashboard.workTab').toLowerCase()}`} />
                <Card label={t('dashboard.failureDemandPct')} value={`${failDemandPct}%`} sub={`${data.failureCount} / ${data.totalEntries}`} color={COLORS.failure} />
                {data.perfectPercentage > 0 && (
                  <Card label={t('dashboard.perfect')} value={`${data.perfectPercentage}%`} sub={t('dashboard.perfectSub')} color={COLORS.value} />
                )}
                <Card label={t('dashboard.failureWorkPct')} value={`${failWorkPct}%`} sub={`${data.workFailureCount} / ${data.workCount}`} color={COLORS.failure} />
                <Card label={t('dashboard.demandWorkRatio')} value={`${demandRatio}% : ${workRatio}%`} />
              </div>

              {/* Side-by-side demand vs work split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Demand split mini pie */}
                <ChartCard title={t('dashboard.demandSplit')}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('capture.value'), value: data.valueCount },
                          { name: t('capture.failure'), value: data.failureCount },
                          ...(data.unknownCount > 0 ? [{ name: '?', value: data.unknownCount }] : []),
                        ]}
                        cx="50%" cy="50%" outerRadius={60} innerRadius={25} dataKey="value"
                        label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        <Cell fill={COLORS.value} />
                        <Cell fill={COLORS.failure} />
                        {data.unknownCount > 0 && <Cell fill={COLORS.unknown} />}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: THEME.textSecondary }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Work split mini pie */}
                <ChartCard title={t('dashboard.workSplit')}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const slices: Array<{ name: string; value: number; fill: string }> = [
                            { name: t('capture.value'), value: data.workValueCount, fill: COLORS.value },
                            { name: t('capture.failure'), value: data.workFailureCount, fill: COLORS.failure },
                          ];
                          if (data.workSequenceCount > 0) slices.push({ name: t('capture.classificationWorkSequence'), value: data.workSequenceCount, fill: COLORS.sequence });
                          if (data.workUnknownCount > 0) slices.push({ name: '?', value: data.workUnknownCount, fill: COLORS.unknown });
                          return slices;
                        })()}
                        cx="50%" cy="50%" outerRadius={60} innerRadius={25} dataKey="value"
                        label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: THEME.textSecondary }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Top 3 system conditions */}
              {data.failureCauses.length > 0 && (
                <ChartCard title={t('dashboard.topFailureCauses')}>
                  <div className="space-y-2">
                    {data.failureCauses.slice(0, 3).map((fc, i) => (
                      <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-red-300">#{i + 1}</span>
                          <span className="text-sm text-gray-800">{fc.cause}</span>
                        </div>
                        <span className="text-sm font-semibold text-red-600 ml-3 shrink-0">{fc.count}×</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}
            </>
          );
        })()}

        {/* Data collection coverage (shown on all views) — collapsed by default
            with a + to expand; it was taking up too much space open. */}
        {data.collectorCounts && data.collectorCounts.length > 0 && (
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowCoverage(!showCoverage)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-700">{t('dashboard.collectionCoverage')} ({data.collectorCounts.length})</h3>
              <span className="text-gray-400 text-lg leading-none">{showCoverage ? '−' : '+'}</span>
            </button>
            {showCoverage && (
              <div className="border-t border-gray-200 px-5 py-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 rounded-lg bg-blue-50">
                    <p className="text-lg font-bold text-blue-700">{data.collectorCounts.length}</p>
                    <p className="text-xs text-gray-500">{t('dashboard.collectors')}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-50">
                    <p className="text-lg font-bold text-blue-700">{data.collectorCounts.reduce((s, c) => s + c.count, 0)}</p>
                    <p className="text-xs text-gray-500">{t('dashboard.totalCaptures')}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-50">
                    <p className="text-lg font-bold text-blue-700">
                      {data.collectorCounts.length > 0 ? [...data.collectorCounts].sort((a, b) => b.lastActive.localeCompare(a.lastActive))[0].lastActive : '—'}
                    </p>
                    <p className="text-xs text-gray-500">{t('dashboard.lastCapture')}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {data.collectorCounts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded bg-gray-50 text-sm">
                      <span className="text-gray-700">{c.name}</span>
                      <span className="text-xs text-gray-400">{t('dashboard.lastActive')}: {c.lastActive}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* ── CAPABILITY / LEAD-TIME VIEW (R11: stacked, independent charts) ── */}
        {dashboardView === 'capability' && (() => {
          return (
          <CollapsibleCardsContext.Provider value={true}>
          <div className="space-y-4">
            {/* Touches per case (XmR) — one point per case = its total touch count. */}
            <TouchesPerCaseChart
              code={code}
              dateFrom={capRange.from}
              dateTo={capRange.to}
              valueDemands={valueDemandFilter}
              valueSteps={valueSteps}
            />
            {/* Steps per case (XmR) — one point per case = its step count for the
                chosen tag (Total / Value / Sequence / Failure / Failure demand), as
                count or %. The work-composition companion to touches. */}
            <StepsPerCaseChart
              code={code}
              dateFrom={capRange.from}
              dateTo={capRange.to}
              valueDemands={valueDemandFilter}
              valueSteps={valueSteps}
            />
            {chartIds.map((id) => (
              <CapabilityChart
                key={id}
                code={code}
                eventOptions={eventOptions}
                studyName={studyName}
                dateFrom={capRange.from}
                dateTo={capRange.to}
                valueDemands={valueDemandFilter}
                whatMattersScopeTypeId={whatMattersScope}
                onRemove={chartIds.length > 1 ? () => removeChart(id) : undefined}
              />
            ))}
            <button onClick={addChart} className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
              + {t('dashboard.addChart')}
            </button>
          </div>
          </CollapsibleCardsContext.Provider>
          );
        })()}

        {/* Synthesise (0028/0030): one surface, switchable across the taxonomies
            the study manages (system conditions, work types, work steps). */}
        {dashboardView === 'synthesis' && synthesisAvailable && (() => {
          const taxes: { key: 'sc' | 'wt' | 'wst'; label: string }[] = [
            ...((systemConditionsEnabled ? [{ key: 'sc', label: t('synthesis.taxSc') }] : []) as { key: 'sc' | 'wt' | 'wst'; label: string }[]),
            ...((workTypesEnabled ? [{ key: 'wt', label: t('synthesis.taxWt') }] : []) as { key: 'sc' | 'wt' | 'wst'; label: string }[]),
            ...((workStepTypesEnabled ? [{ key: 'wst', label: t('synthesis.taxWst') }] : []) as { key: 'sc' | 'wt' | 'wst'; label: string }[]),
          ];
          const active = taxes.find((x) => x.key === synthTax)?.key ?? taxes[0].key;
          const labelsFor = (kind: 'sc' | 'wt' | 'wst'): SynthesisLabels => ({
            heading: t(kind === 'sc' ? 'synthesis.heading' : kind === 'wt' ? 'synthesis.wtHeading' : 'synthesis.wstHeading'),
            intro: t(kind === 'sc' ? 'synthesis.intro' : kind === 'wt' ? 'synthesis.wtIntro' : 'synthesis.wstIntro'),
            empty: t(kind === 'sc' ? 'synthesis.empty' : kind === 'wt' ? 'synthesis.wtEmpty' : 'synthesis.wstEmpty'),
            selectHint: t('synthesis.selectHint'),
            distributionTitle: t('synthesis.distributionTitle'),
            pieTitle: t('synthesis.pieTitle'),
            overTimeTitle: t('synthesis.overTimeTitle'),
            overTimeTopN: t('synthesis.overTimeTopN'),
            mergeInto: t('synthesis.mergeInto'),
            renameOptional: t('synthesis.renameOptional'),
            mergeButton: t('synthesis.mergeButton'),
            cancel: t('synthesis.cancel'),
            rename: t('synthesis.rename'),
            recentMerges: t('synthesis.recentMerges'),
            undo: t('synthesis.undo'),
            loading: t('capture.loading'),
            mergeFailed: t('synthesis.mergeFailed'),
            renameFailed: t('synthesis.renameFailed'),
            undoFailed: t('synthesis.undoFailed'),
          });
          const apiBase = active === 'sc'
            ? `/api/studies/${encodeURIComponent(code)}/system-conditions`
            : `/api/studies/${encodeURIComponent(code)}/synthesis/${active === 'wt' ? 'work-types' : 'work-step-types'}`;
          return (
            <div className="space-y-4">
              {taxes.length > 1 && (
                <PillToggle
                  ariaLabel={taxes[0].label}
                  value={active}
                  onChange={(v) => setSynthTax(v as 'sc' | 'wt' | 'wst')}
                  options={taxes.map((x) => ({ value: x.key, label: x.label }))}
                />
              )}
              <TaxonomySynthesis key={active} apiBase={apiBase} labels={labelsFor(active)} valueDemands={valueDemandFilter} />
            </div>
          );
        })()}

        {/* Flow analytics (0029): the WORK picture for a flow study. Flow capture
            is work-only, so this surfaces the work measures already computed by
            getDashboardData (the same widgets as the non-flow Work view). Each
            card self-gates on its data. */}
        {isFlow && dashboardView === 'analytics' && flowAnalyticsAvailable && (
          data.workCount === 0 ? (
            <div className="rounded-xl p-8 text-center bg-white border border-gray-200">
              <p className="text-lg font-semibold text-gray-700 mb-2">{t('dashboard.noEntries')}</p>
              <p className="text-sm text-gray-500">{t('dashboard.noEntriesHint')}</p>
            </div>
          ) : (
            <CollapsibleCardsContext.Provider value={true}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card compact label={t('dashboard.workEntries')} value={data.workCount} />
                <Card compact label={t('dashboard.valueWorkPct')} value={data.workCount > 0 ? `${Math.round((data.workValueCount / data.workCount) * 100)}%` : '0%'} sub={`${data.workValueCount} ${t('dashboard.entries')}`} color={COLORS.value} />
                <Card compact label={t('dashboard.failureWorkPct')} value={data.workCount > 0 ? `${Math.round((data.workFailureCount / data.workCount) * 100)}%` : '0%'} sub={`${data.workFailureCount} ${t('dashboard.entries')}`} color={COLORS.failure} />
                {data.workSequenceCount > 0 && (
                  <Card compact label={t('capture.classificationWorkSequence')} value={data.workCount > 0 ? `${Math.round((data.workSequenceCount / data.workCount) * 100)}%` : '0%'} sub={`${data.workSequenceCount} ${t('dashboard.entries')}`} color={COLORS.sequence} />
                )}
                {data.workUnknownCount > 0 && (
                  <Card compact label={t('dashboard.unknownEntries')} value={data.workUnknownCount} color="#f59e0b" />
                )}
              </div>

              {/* P2BS → value demand (2026-07-09): what problem is the customer
                  really trying to solve by placing this value demand on us?
                  Band width = cases where the pair co-occurs; grey "Not set"
                  collects cases missing a side. Clicking a band opens the
                  cases behind it with their what-matters words. */}
              {p2bsVd && p2bsVd.links.length > 0 && (() => {
                const links = p2bsVd.links;
                // Every case unclassified on both sides → data-quality nudge
                // instead of a one-band grey-to-grey Sankey.
                if (links.length === 1 && !links[0].lifeProblemId && !links[0].demandTypeId) {
                  return (
                    <ChartCard title={t('dashboard.p2bsVdTitle')}>
                      <p className="text-sm text-gray-500 text-center py-8">{t('dashboard.p2bsVdEmpty')}</p>
                    </ChartCard>
                  );
                }
                const notSet = t('dashboard.p2bsVdNotSet');
                // Node order = first appearance in the (sortOrder-sorted) links.
                const leftNodes: Array<{ id: string | null; label: string | null }> = [];
                const rightNodes: Array<{ id: string | null; label: string | null }> = [];
                const seenL = new Set<string>();
                const seenR = new Set<string>();
                for (const l of links) {
                  const lk = l.lifeProblemId ?? '';
                  if (!seenL.has(lk)) { seenL.add(lk); leftNodes.push({ id: l.lifeProblemId, label: l.lifeProblemLabel }); }
                  const rk = l.demandTypeId ?? '';
                  if (!seenR.has(rk)) { seenR.add(rk); rightNodes.push({ id: l.demandTypeId, label: l.demandTypeLabel }); }
                }
                const lIdx = new Map(leftNodes.map((n, i) => [n.id ?? '', i]));
                const rIdx = new Map(rightNodes.map((n, i) => [n.id ?? '', i + leftNodes.length]));
                const nodes = [
                  ...leftNodes.map(n => ({ name: n.id ? tl(n.label!) : notSet })),
                  ...rightNodes.map(n => ({ name: n.id ? tl(n.label!) : notSet })),
                ];
                const nodeFill = [
                  ...leftNodes.map(n => (n.id ? '#6366f1' : '#9ca3af')),
                  ...rightNodes.map(n => (n.id ? COLORS.value : '#9ca3af')),
                ];
                // 1:1 with `links` so the link renderer's index maps back.
                const sankeyLinks = links.map(l => ({
                  source: lIdx.get(l.lifeProblemId ?? '')!,
                  target: rIdx.get(l.demandTypeId ?? '')!,
                  value: l.caseCount,
                }));
                return (
                  <ChartCard title={t('dashboard.p2bsVdTitle')} info={<InfoPopover label={t('dashboard.p2bsVdTitle')}>{t('dashboard.calcP2bsVd')}</InfoPopover>}>
                    <p className="text-xs text-gray-600 italic mb-1 -mt-1">{t('dashboard.p2bsVdQuestion')}</p>
                    <p className="text-xs text-gray-500 mb-2">{t('dashboard.p2bsVdClickHint')}</p>
                    <ResponsiveContainer width="100%" height={Math.max(300, nodes.length * 35)}>
                      <Sankey
                        data={{ nodes, links: sankeyLinks }}
                        nodePadding={24}
                        nodeWidth={10}
                        linkCurvature={0.5}
                        margin={{ top: 10, right: 160, bottom: 10, left: 160 }}
                        node={(props: NodeProps) => <SankeyNode {...props} sourceCount={leftNodes.length} fillOverride={nodeFill[props.index]} />}
                        link={(props: LinkProps) => <SankeyLink {...props} stroke="#94a3b8" onClick={() => setSelectedP2bsVd(links[props.index])} />}
                      >
                        <Tooltip />
                      </Sankey>
                    </ResponsiveContainer>
                  </ChartCard>
                );
              })()}

              <div className="grid md:grid-cols-2 gap-4">
                <ChartCard title={t('dashboard.workAnalysis')}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const slices: Array<{ name: string; value: number; fill: string }> = [
                            { name: t('capture.value'), value: data.workValueCount, fill: COLORS.value },
                            { name: t('capture.failure'), value: data.workFailureCount, fill: COLORS.failure },
                          ];
                          if (data.workSequenceCount > 0) slices.push({ name: t('capture.classificationWorkSequence'), value: data.workSequenceCount, fill: COLORS.sequence });
                          if (data.workUnknownCount > 0) slices.push({ name: '?', value: data.workUnknownCount, fill: '#f59e0b' });
                          return slices;
                        })()}
                        cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="value"
                        label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {data.workTypesByClassification && data.workTypesByClassification.length > 0 && (() => {
                  const hasSequence = data.workTypesByClassification.some(d => d.sequenceCount > 0);
                  const translated = data.workTypesByClassification.map(d => ({
                    label: tl(d.label),
                    [t('capture.value')]: d.valueCount,
                    [t('capture.classificationWorkSequence')]: d.sequenceCount,
                    [t('capture.failure')]: d.failureCount,
                    total: d.valueCount + d.failureCount + d.sequenceCount,
                  }));
                  return (
                    <ChartCard title={t('dashboard.workTypesByClass')}>
                      <ResponsiveContainer width="100%" height={Math.max(220, translated.length * 45 + 40)}>
                        <BarChart data={translated} layout="vertical" margin={{ left: 10, right: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                          <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                          <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 23) + '…' : v} />
                          <Tooltip {...tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                          <Bar dataKey={t('capture.value')} stackId="a" fill={COLORS.value} radius={[0, 0, 0, 0]} />
                          {hasSequence && <Bar dataKey={t('capture.classificationWorkSequence')} stackId="a" fill={COLORS.sequence} radius={[0, 0, 0, 0]} />}
                          <Bar dataKey={t('capture.failure')} stackId="a" fill={COLORS.failure} radius={[0, 4, 4, 0]}>
                            <LabelList dataKey="total" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  );
                })()}
              </div>

              {/* Capability of Response distribution across flow touches
                  (work entries with a CoR). Self-gates on having any; P2BS +
                  date scoped like the rest of the tab. Mirrors the Demand-tab
                  CoR pie for visual parity. */}
              {data.corTypeCounts.length > 0 && (
                <CorDistributionChart code={code} dateFrom={capRange.from} dateTo={capRange.to} valueDemands={valueDemandFilter} />
              )}

              {data.workTypeCounts.length > 0 && (
                <ChartCard title={t('dashboard.workTypes')}>
                  <ResponsiveContainer width="100%" height={Math.max(200, data.workTypeCounts.length * 40 + 40)}>
                    <BarChart data={(() => {
                      const totalWork = data.workTypeCounts.reduce((s, d) => s + d.count, 0);
                      return data.workTypeCounts.map(d => ({
                        ...d,
                        label: tl(d.label),
                        pct: totalWork > 0 ? `${Math.round((d.count / totalWork) * 100)}%` : '0%',
                      }));
                    })()} layout="vertical" margin={{ left: 10, right: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 23) + '…' : v} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Failure demand captured in flow (migration 0033, slice 2):
                  type + frequency of failure demand hitting during the flow,
                  P2BS-scoped via the life-problem filter above. */}
              {data.flowFailureDemandTypeCounts.length > 0 && (
                <ChartCard title={t('dashboard.flowFailureDemand')} info={<InfoPopover label={t('dashboard.flowFailureDemand')}>{t('dashboard.calcFlowFailureDemand')}</InfoPopover>}>
                  <ResponsiveContainer width="100%" height={Math.max(200, data.flowFailureDemandTypeCounts.length * 40 + 40)}>
                    <BarChart data={(() => {
                      const total = data.flowFailureDemandTypeCounts.reduce((s, d) => s + d.count, 0);
                      return data.flowFailureDemandTypeCounts.map(d => ({
                        ...d,
                        label: tl(d.label),
                        pct: total > 0 ? `${Math.round((d.count / total) * 100)}%` : '0%',
                      }));
                    })()} layout="vertical" margin={{ left: 10, right: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 23) + '…' : v} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" name={t('dashboard.flowFailureDemand')} fill="#e11d48" radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Work by value step (migration 0047): where value / sequence /
                  failure work lands across the customer value journey. Stacked
                  bars per value step, ordered by the value step's own order.
                  P2BS-scoped. Self-gates on the feature + having data. */}
              {data.valueStepsEnabled && data.workByValueStep.length > 0 && (
                <ChartCard title={t('dashboard.workByValueStepTitle')} info={<InfoPopover label={t('dashboard.workByValueStepTitle')}>{t('dashboard.calcWorkByValueStep')}</InfoPopover>}>
                  <p className="text-xs text-gray-500 mb-3">{t('dashboard.workByValueStepHint')}</p>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">{t('dashboard.vsSortBy')}</span>
                    <PillToggle
                      ariaLabel={t('dashboard.vsSortBy')}
                      value={vsSort}
                      onChange={(v) => setVsSort(v as typeof vsSort)}
                      options={[
                        { value: 'journey', label: t('dashboard.vsSortJourney') },
                        { value: 'failureDemand', label: t('capture.workBlockTagFailureDemand') },
                        { value: 'failure', label: t('capture.failure') },
                        { value: 'sequence', label: t('capture.classificationWorkSequence') },
                        { value: 'waste', label: t('dashboard.vsSortWaste') },
                      ]}
                    />
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(220, data.workByValueStep.length * 44 + 48)}>
                    <BarChart data={[...data.workByValueStep].sort((a, b) =>
                      vsSort === 'failureDemand' ? b.failureDemand - a.failureDemand
                      : vsSort === 'failure' ? b.failure - a.failure
                      : vsSort === 'sequence' ? b.sequence - a.sequence
                      : vsSort === 'waste' ? (b.sequence + b.failure + b.failureDemand) - (a.sequence + a.failure + a.failureDemand)
                      : a.sortOrder - b.sortOrder
                    ).map(d => ({ ...d, label: tl(d.label) }))} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 23) + '…' : v} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ color: THEME.textSecondary }} />
                      <Bar dataKey="value" stackId="a" name={t('capture.value')} fill={COLORS.value} />
                      <Bar dataKey="sequence" stackId="a" name={t('capture.classificationWorkSequence')} fill={COLORS.sequence} />
                      <Bar dataKey="failure" stackId="a" name={t('capture.failure')} fill={COLORS.failure} />
                      <Bar dataKey="failureDemand" stackId="a" name={t('capture.workBlockTagFailureDemand')} fill="#e11d48" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Per-value-step overview (2026-07-04): for each step, the work
                  mix (consequences) + top system conditions on its blocks
                  (causes). Complements the stacked bar above — that one
                  compares steps, this one explains each step. Self-gates like
                  the chart; plain CSS bars, no recharts. */}
              {data.valueStepsEnabled && data.workByValueStep.length > 0 && (
                <ChartCard title={t('dashboard.valueStepOverviewTitle')} info={<InfoPopover label={t('dashboard.valueStepOverviewTitle')}>{t('dashboard.calcValueStepOverview')}</InfoPopover>}>
                  <p className="text-xs text-gray-500 mb-3">{t('dashboard.valueStepOverviewHint')}</p>
                  <div className="space-y-3">
                    {data.workByValueStep.map((step) => {
                      const total = step.value + step.sequence + step.failure + step.failureDemand;
                      const waste = step.sequence + step.failure + step.failureDemand;
                      const wastePct = total > 0 ? Math.round((waste / total) * 100) : 0;
                      const scs = data.valueStepSystemConditions
                        .filter((r) => r.stepLabel === step.label && r.stepSortOrder === step.sortOrder)
                        .slice(0, 5); // already count-desc from the query
                      const scMax = scs[0]?.count ?? 0;
                      const mix = [
                        { key: 'value', n: step.value, color: COLORS.value, name: t('capture.value') },
                        { key: 'sequence', n: step.sequence, color: COLORS.sequence, name: t('capture.classificationWorkSequence') },
                        { key: 'failure', n: step.failure, color: COLORS.failure, name: t('capture.failure') },
                        { key: 'failureDemand', n: step.failureDemand, color: '#e11d48', name: t('capture.workBlockTagFailureDemand') },
                      ].filter((m) => m.n > 0);
                      return (
                        <div key={`${step.sortOrder}::${step.label}`} className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <p className="text-sm font-medium text-gray-800 break-words">{tl(step.label)}</p>
                            <p className="text-[11px] text-gray-500 shrink-0">
                              {total} {t('dashboard.vsWorkSteps')} ·{' '}
                              <span className={`font-medium ${wastePct > 0 ? 'text-red-600' : 'text-green-700'}`}>{wastePct}% {t('dashboard.vsNonValueShare')}</span>
                            </p>
                          </div>
                          {/* Work-mix strip: 100%-stacked, same palette as the chart above. */}
                          <div className="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                            {mix.map((m) => (<div key={m.key} style={{ width: `${(m.n / total) * 100}%`, backgroundColor: m.color }} />))}
                          </div>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {mix.map((m, i) => (
                              <span key={m.key}>{i > 0 && ' · '}<span style={{ color: m.color }}>●</span> {m.name} {m.n}</span>
                            ))}
                          </p>
                          {scs.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              <p className="text-[11px] font-medium text-gray-600">{t('dashboard.vsTopSystemConditions')}</p>
                              {scs.map((sc) => (
                                <div key={sc.scLabel} className="flex items-center gap-2">
                                  <span className="w-40 shrink-0 truncate text-[11px] text-gray-700" title={tl(sc.scLabel)}>{tl(sc.scLabel)}</span>
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${scMax > 0 ? (sc.count / scMax) * 100 : 0}%` }} />
                                  </div>
                                  <span className="w-6 shrink-0 text-right text-[11px] text-gray-500">{sc.count}</span>
                                </div>
                              ))}
                            </div>
                          ) : waste > 0 ? (
                            // Only nudge when the step actually carries waste — a
                            // pure-value step legitimately has no SCs (the SC picker
                            // only renders on sequence/failure/failure-demand steps).
                            <p className="mt-2 text-[11px] italic text-gray-400">{t('dashboard.vsNoSystemConditions')}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </ChartCard>
              )}

              {data.workOverTime.length > 1 && (
                <ChartCard title={t('dashboard.workOverTime')}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.workOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis dataKey="date" tick={tickStyle} />
                      <YAxis allowDecimals={false} tick={tickStyle} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ color: THEME.textSecondary }} />
                      <Line type="monotone" dataKey="valueCount" name={t('capture.value')} stroke={COLORS.value} strokeWidth={2} dot={{ r: 4 }} />
                      {data.workOverTime.some(d => d.sequenceCount > 0) && (
                        <Line type="monotone" dataKey="sequenceCount" name={t('capture.classificationWorkSequence')} stroke={COLORS.sequence} strokeWidth={2} dot={{ r: 4 }} />
                      )}
                      <Line type="monotone" dataKey="failureCount" name={t('capture.failure')} stroke={COLORS.failure} strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* The four work-step types as separate per-case XmR charts (value /
                  sequence / failure work + failure demand). Step-level (block tag),
                  count or % per case, in case-open order. */}
              {data.workCount > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {(['value', 'sequence', 'failure', 'failure_demand'] as const).map((tg) => (
                    <StepsPerCaseChart key={tg} code={code} dateFrom={capRange.from} dateTo={capRange.to} valueDemands={valueDemandFilter} fixedTag={tg} />
                  ))}
                </div>
              )}

              {/* Ask delivery (2026-07-02, slice 4): per linked capture field,
                  how often the decision delivered what mattered. Self-gates on
                  having evaluated cases; scoped by the P2BS filter + date range
                  (decidedAt) like everything else on this tab. */}
              {askDelivery && askDelivery.length > 0 && (
                <ChartCard title={t('dashboard.askDeliveryTitle')} info={<InfoPopover label={t('dashboard.askDeliveryTitle')}>{t('dashboard.calcAskDelivery')}</InfoPopover>}>
                  <p className="text-xs text-gray-500 mb-3">{t('dashboard.askDeliveryHint')}</p>
                  <div className="space-y-2">
                    {askDelivery.map((r) => {
                      // pct over EVALUATED cases only; a row can exist purely on
                      // notCaptured (ask + decision recorded, value box empty).
                      const pct = r.n > 0 ? Math.round((r.metCount / r.n) * 100) : null;
                      const notMet = r.n - r.metCount;
                      return (
                        <div key={r.fieldId} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 break-words">{tl(r.whatMattersLabel)}</p>
                            <p className="text-[11px] text-gray-500 break-words">{tl(r.fieldLabel)} · {tl(r.decisionLabel)}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 text-sm">
                            <span className={`font-semibold ${pct !== null && notMet === 0 ? 'text-green-700' : 'text-gray-800'}`}>
                              {r.metCount}/{r.n} <span className="font-normal text-gray-500">({pct !== null ? `${pct}%` : '—'})</span>
                            </span>
                            <span className="text-[11px] text-green-700">✓ {t('capture.evalMet')} {r.metCount}</span>
                            {notMet > 0 && <span className="text-[11px] text-red-600">✗ {t('capture.evalNotMet')} {notMet}</span>}
                            {r.notCaptured > 0 && (
                              <span className="text-[11px] text-gray-500">{t('dashboard.askNotCaptured')}: {r.notCaptured}</span>
                            )}
                            {r.kind === 'date' && r.avgDaysLate !== null && (
                              <span className="text-[11px] text-red-600">{t('dashboard.wmAvgDaysLate')}: {r.avgDaysLate}</span>
                            )}
                            {r.kind === 'duration' && r.avgDiffMonths !== null && (
                              <span className="text-[11px] text-red-600">{t('dashboard.askAvgDeviation')}: {r.avgDiffMonths} {t('capture.unitMonthsShort')}</span>
                            )}
                            {r.kind === 'amount' && r.avgAmountOver !== null && (
                              <span className="text-[11px] text-red-600">{t('dashboard.askAvgOverBudget')}: {new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(r.avgAmountOver)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ChartCard>
              )}

              {/* Budget capability (2026-07-05): XmR-style chart of signed
                  budget variance per case in answeredAt order. Zero line = the
                  customer's budget; within budget green, over red. Y defaults
                  to % of budget (comparable across budget sizes), toggle to
                  amount. Self-gates on ≥1 amount-kind field with ≥1 comparable
                  case; XmR stats derived inline for the active unit. */}
              {hasAmountAsk && budgetCapability && budgetCapability.length > 0 && (() => {
                // Default field = most comparable cases; selector only for >1.
                const sortedFields = [...budgetCapability].sort((a, b) => b.summary.n - a.summary.n);
                const field = budgetCapability.find((f) => f.fieldId === budgetFieldId) ?? sortedFields[0];
                const currency = currencyForSubquestion(field.currencyCode, locale);
                const isCurrency = field.kind === 'currency';
                // % mode drops points whose cap can't scale (cap ≤ 0 → diffPct null).
                const pts = budgetUnit === 'pct' ? field.points.filter((p) => p.diffPct !== null) : field.points;
                const pctExcluded = budgetUnit === 'pct' ? field.points.length - pts.length : 0;
                const values = pts.map((p) => (budgetUnit === 'pct' ? p.diffPct! : p.diffAmount));
                // XmR (same 2.66×mR math as getCapabilityData); signed metric —
                // LNPL may legitimately go negative (under budget).
                const mean = values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
                let unpl: number | null = null, lnpl: number | null = null;
                if (values.length >= 2 && mean !== null) {
                  let mrSum = 0;
                  for (let i = 1; i < values.length; i++) mrSum += Math.abs(values[i] - values[i - 1]);
                  const mrBar = mrSum / (values.length - 1);
                  unpl = mean + 2.66 * mrBar;
                  lnpl = mean - 2.66 * mrBar;
                }
                const chartData = pts.map((p) => ({ ...p, y: budgetUnit === 'pct' ? p.diffPct! : p.diffAmount }));
                const fmtAmount = (v: number) => isCurrency
                  ? formatCurrency(v, currency, locale)
                  : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v);
                const fmtY = (v: number) => budgetUnit === 'pct' ? `${Math.round(v * 10) / 10}%` : fmtAmount(v);
                const { n, underCount, metExactCount, overCount, withinCount } = field.summary;
                const under = field.points.filter((p) => p.diffAmount < 0);
                const over = field.points.filter((p) => p.diffAmount > 0);
                const avgUnder = under.length ? Math.round(under.reduce((s, p) => s + Math.abs(p.diffAmount), 0) / under.length) : null;
                const avgOver = over.length ? Math.round(over.reduce((s, p) => s + p.diffAmount, 0) / over.length) : null;
                return (
                  <ChartCard title={t('dashboard.budgetCapabilityTitle')} info={<InfoPopover label={t('dashboard.budgetCapabilityTitle')}>{t('dashboard.calcBudget')}</InfoPopover>}>
                    <p className="text-xs text-gray-500 mb-3">{t('dashboard.budgetCapabilityHint')}</p>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      {budgetCapability.length > 1 && (
                        <PillToggle
                          options={sortedFields.map((f) => ({ value: f.fieldId, label: tl(f.whatMattersLabel) }))}
                          value={field.fieldId}
                          onChange={setBudgetFieldId}
                          ariaLabel={t('dashboard.budgetCapabilityTitle')}
                        />
                      )}
                      <PillToggle
                        options={[
                          { value: 'pct', label: t('dashboard.budgetUnitPct') },
                          { value: 'amount', label: t('dashboard.budgetUnitAmount') },
                        ]}
                        value={budgetUnit}
                        onChange={(v) => setBudgetUnit(v as 'pct' | 'amount')}
                        ariaLabel={t('dashboard.budgetUnitPct')}
                      />
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
                      <span className={`text-2xl font-bold ${withinCount === n ? 'text-green-700' : 'text-gray-900'}`}>
                        {t('dashboard.budgetWithinHeadline', { x: String(withinCount), y: String(n) })}
                      </span>
                      <span className="text-[11px] text-green-700">{t('capture.evalUnderBudget')}: {underCount}</span>
                      <span className="text-[11px] text-gray-600">{t('capture.evalMet')}: {metExactCount}</span>
                      <span className="text-[11px] text-red-600">{t('capture.evalOverBudget')}: {overCount}</span>
                      {avgUnder !== null && <span className="text-[11px] text-green-700">{t('dashboard.askAvgUnderBudget')}: {fmtAmount(avgUnder)}</span>}
                      {avgOver !== null && <span className="text-[11px] text-red-600">{t('dashboard.askAvgOverBudget')}: {fmtAmount(avgOver)}</span>}
                    </div>
                    <p className="text-[11px] text-gray-500 mb-1">{tl(field.whatMattersLabel)} · {tl(field.fieldLabel)} · {tl(field.decisionLabel)}</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData} margin={{ top: 10, right: 60, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                        <XAxis dataKey="caseRef" tick={{ fontSize: 10, fill: THEME.textSecondary }} />
                        <YAxis tick={tickStyle} tickFormatter={(v: number) => fmtY(v)} width={budgetUnit === 'pct' ? 50 : 80} />
                        <Tooltip {...tooltipStyle} content={(p: { active?: boolean; payload?: readonly { payload?: typeof chartData[number] }[] }) => {
                          const pt = p.active && p.payload && p.payload.length ? p.payload[0].payload : null;
                          if (!pt) return null;
                          return (
                            <div className="rounded-lg shadow-md bg-white border border-gray-200 px-3 py-2 text-xs text-gray-700">
                              <div className="font-medium text-gray-900">#{pt.caseRef} · {new Date(pt.answeredAt).toLocaleDateString()}</div>
                              <div>{t('dashboard.budgetZeroLine')}: {fmtAmount(pt.cap)}</div>
                              <div>{tl(field.fieldLabel)}: {fmtAmount(pt.delivered)}</div>
                              <div className={pt.diffAmount > 0 ? 'text-red-600' : 'text-green-700'}>
                                {pt.diffAmount > 0 ? '+' : ''}{fmtAmount(pt.diffAmount)}{pt.diffPct !== null ? ` (${pt.diffAmount > 0 ? '+' : ''}${pt.diffPct}%)` : ''}
                              </div>
                            </div>
                          );
                        }} />
                        {/* Zero line = the budget: thick, dark, always shown.
                            extendDomain keeps the reference lines on-axis —
                            XmR limits usually sit OUTSIDE the data range and
                            recharts clips them off otherwise. */}
                        <ReferenceLine y={0} stroke="#1f2937" strokeWidth={2} ifOverflow="extendDomain" label={{ value: t('dashboard.budgetZeroLine'), position: 'right', fill: '#1f2937', fontSize: 10 }} />
                        {mean !== null && <ReferenceLine y={mean} stroke={THEME.textSecondary} strokeDasharray="5 4" ifOverflow="extendDomain" label={{ value: t('dashboard.processAvg'), position: 'right', fill: THEME.textSecondary, fontSize: 10 }} />}
                        {unpl !== null && <ReferenceLine y={unpl} stroke={COLORS.failure} strokeDasharray="5 4" ifOverflow="extendDomain" label={{ value: t('dashboard.upperLimit'), position: 'right', fill: COLORS.failure, fontSize: 10 }} />}
                        {lnpl !== null && <ReferenceLine y={lnpl} stroke={COLORS.failure} strokeDasharray="5 4" ifOverflow="extendDomain" label={{ value: t('dashboard.lowerLimit'), position: 'right', fill: COLORS.failure, fontSize: 10 }} />}
                        <Line
                          type="monotone"
                          dataKey="y"
                          stroke={COLORS.neutral[0]}
                          strokeWidth={2}
                          isAnimationActive={false}
                          activeDot={{ r: 5 }}
                          dot={(props: { cx?: number; cy?: number; payload?: typeof chartData[number] }) => {
                            const { cx, cy, payload } = props;
                            if (cx === undefined || cy === undefined || !payload) return <g key={`b-${cx}`} />;
                            const overBudget = payload.diffAmount > 0;
                            return (
                              <g key={`b-${payload.caseId}`}>
                                <circle cx={cx} cy={cy} r={4} fill={overBudget ? COLORS.failure : COLORS.value} stroke="#fff" strokeWidth={1} />
                              </g>
                            );
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    {pctExcluded > 0 && (
                      <p className="mt-1 text-center text-xs text-gray-400">{pctExcluded} {t('dashboard.budgetPctExcluded')}</p>
                    )}
                  </ChartCard>
                );
              })()}
            </div>
            </CollapsibleCardsContext.Provider>
          )
        )}

        {/* Raw entries list */}
        {!isFlow && dashboardView === 'demand' && data.totalEntries > 0 && (
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowEntries(!showEntries)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-900">{t('dashboard.entries')} ({data.totalEntries})</h3>
              <span className="text-gray-400 text-xs">{showEntries ? '▲' : '▼'}</span>
            </button>
            {showEntries && (
              <div className="border-t border-gray-200 px-5 py-3">
                {entriesLoading ? (
                  <p className="text-sm text-gray-500">{t('dashboard.loading')}</p>
                ) : (
                  <>
                    {/* Filter by demand type */}
                    {demandTypesEnabled && data.demandTypeCounts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        <button
                          onClick={() => setEntryFilter('')}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${!entryFilter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {t('dashboard.allTypes')}
                        </button>
                        {data.demandTypeCounts.map(dt => (
                          <button
                            key={dt.label}
                            onClick={() => setEntryFilter(dt.label)}
                            className={`text-xs px-2 py-1 rounded-full transition-colors ${entryFilter === dt.label ? (dt.category === 'failure' ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {tl(dt.label)} ({dt.count})
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="space-y-1.5 max-h-96 overflow-y-auto">
                      {entries
                        .filter(e => {
                          if (!entryFilter) return true;
                          return e.demandTypeId && demandTypeMap.get(e.demandTypeId) === entryFilter;
                        })
                        .map(e => (
                        <div key={e.id} className="flex items-start gap-3 py-2 px-3 rounded bg-gray-50 border border-gray-100">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-800">{e.verbatim}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">{new Date(e.createdAt).toLocaleDateString()}</span>
                              {e.demandTypeId && demandTypeMap.get(e.demandTypeId) && (
                                <span className="text-xs text-gray-500">{tl(demandTypeMap.get(e.demandTypeId)!)}</span>
                              )}
                              {e.collectorName && <span className="text-xs text-gray-400">{e.collectorName}</span>}
                            </div>
                          </div>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                            e.classification === 'value' ? 'bg-green-100 text-green-700' :
                            e.classification === 'failure' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {e.classification === 'value' ? t('capture.value') : e.classification === 'failure' ? t('capture.failure') : '?'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingEntryId(e.id)}
                            className="shrink-0 text-xs px-2 py-0.5 rounded font-medium text-gray-500 bg-white border border-gray-200 hover:border-gray-400 hover:text-gray-700 transition-colors"
                          >
                            {t('dashboard.editEntry')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entry edit modal */}
      {editingEntryId && fullStudy && (
        <EntryEditModal
          code={code}
          entryId={editingEntryId}
          study={fullStudy}
          onClose={() => setEditingEntryId(null)}
          onSaved={async () => {
            await loadDashboard();
            const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries`);
            if (res.ok) {
              const d = await res.json();
              setEntries(d.entries || []);
            }
          }}
        />
      )}

      {/* Flow causes modal */}
      {selectedFlow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedFlow(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{t('dashboard.flowCauses')}</h3>
                <button onClick={() => setSelectedFlow(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                <span className="text-green-600 font-medium">{selectedFlow.sourceName}</span>
                {' → '}
                <span className="text-red-600 font-medium">{selectedFlow.targetName}</span>
                <span className="text-gray-400 ml-2">({selectedFlow.count})</span>
              </p>
            </div>
            <div className="p-5">
              {flowCausesLoading ? (
                <p className="text-gray-500 text-sm">{t('dashboard.loading')}</p>
              ) : flowCauses && flowCauses.length > 0 ? (
                <div className="space-y-2">
                  {flowCauses.map((fc, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-800">{fc.cause}</span>
                      <span className="text-sm font-semibold text-red-600 ml-3 shrink-0">{fc.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">{t('dashboard.flowCausesEmpty')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* P2BS ↔ value demand band detail: the cases behind a clicked band and
          their what-matters words. Data ships with the Sankey payload — no fetch. */}
      {selectedP2bsVd && p2bsVd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedP2bsVd(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{t('dashboard.p2bsVdDetailTitle')}</h3>
                <button onClick={() => setSelectedP2bsVd(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                <span className="text-indigo-600 font-medium">{selectedP2bsVd.lifeProblemLabel ? tl(selectedP2bsVd.lifeProblemLabel) : t('dashboard.p2bsVdNotSet')}</span>
                {' → '}
                <span className="text-green-600 font-medium">{selectedP2bsVd.demandTypeLabel ? tl(selectedP2bsVd.demandTypeLabel) : t('dashboard.p2bsVdNotSet')}</span>
                <span className="text-gray-400 ml-2">({selectedP2bsVd.caseCount})</span>
              </p>
            </div>
            <div className="p-5">
              {(() => {
                const rows = selectedP2bsVd.caseIds
                  .map(id => ({ id, info: p2bsVd.cases[id] }))
                  .filter((r): r is { id: string; info: { caseRef: string; whatMatters: string | null } } => !!r.info);
                const anyNote = rows.some(r => r.info.whatMatters?.trim());
                return (
                  <div className="space-y-2">
                    {!anyNote && <p className="text-gray-500 text-sm">{t('dashboard.p2bsVdDetailEmpty')}</p>}
                    {rows.map(r => (
                      <div key={r.id} className="flex items-start gap-3 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm font-semibold text-gray-700 shrink-0">#{r.info.caseRef}</span>
                        {r.info.whatMatters?.trim()
                          ? <span className="text-sm text-gray-800">{r.info.whatMatters}</span>
                          : <span className="text-sm text-gray-400 italic">—</span>}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, sub, color, compact }: { label: string; value: string | number; sub?: string; color?: string; compact?: boolean }) {
  // `compact` (2026-07-02): a denser, ~half-height card — smaller padding + value.
  // Used by the flow Analytics work stat cards; default keeps every other card as-is.
  return (
    <div className={`rounded-xl shadow-sm bg-white border border-gray-200 ${compact ? 'p-2.5' : 'p-4'}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`font-bold ${compact ? 'text-lg mt-0.5' : 'text-2xl mt-1'}`} style={{ color: color || '#1f2937' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5 text-gray-400">{sub}</p>}
    </div>
  );
}

function buildSankeyData(
  links: Array<{ sourceLabel: string; targetLabel: string; count: number }>,
  tl: (label: string) => string,
) {
  const sourceLabels = [...new Set(links.map(l => l.sourceLabel))];
  const targetLabels = [...new Set(links.map(l => l.targetLabel))];
  const nodes = [
    ...sourceLabels.map(label => ({ name: tl(label) })),
    ...targetLabels.map(label => ({ name: tl(label) })),
  ];
  const sourceIndex = new Map(sourceLabels.map((l, i) => [l, i]));
  const targetIndex = new Map(targetLabels.map((l, i) => [l, i + sourceLabels.length]));
  const sankeyLinks = links.map(l => ({
    source: sourceIndex.get(l.sourceLabel)!,
    target: targetIndex.get(l.targetLabel)!,
    value: l.count,
  }));
  // Map from link index to original (untranslated) labels for drill-down
  const linkMeta = new Map(links.map((l, i) => [i, {
    sourceLabel: l.sourceLabel,
    targetLabel: l.targetLabel,
    sourceName: tl(l.sourceLabel),
    targetName: tl(l.targetLabel),
    count: l.count,
  }]));
  return { nodes, links: sankeyLinks, sourceCount: sourceLabels.length, linkMeta };
}

function SankeyNode({ x, y, width, height, index, payload, sourceCount, fillOverride }: NodeProps & { sourceCount: number; fillOverride?: string }) {
  const isSource = index < sourceCount;
  const fill = fillOverride ?? (isSource ? '#22c55e' : '#ef4444');
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />
      <text
        x={isSource ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isSource ? 'end' : 'start'}
        dominantBaseline="central"
        fontSize={11}
        fill="#1f2937"
      >
        <title>{payload.name}</title>
        {payload.name.length > 25 ? payload.name.slice(0, 23) + '…' : payload.name}
      </text>
    </g>
  );
}

function SankeyLink({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, onClick, stroke }: LinkProps & { onClick?: () => void; stroke?: string }) {
  const color = stroke ?? '#ef4444';
  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={color}
      strokeWidth={linkWidth}
      strokeOpacity={onClick ? 0.3 : 0.2}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'stroke-opacity 0.15s' }}
      onClick={onClick}
      onMouseEnter={(e) => { if (onClick) { const el = e.target as SVGPathElement; el.style.strokeOpacity = '0.6'; el.style.strokeWidth = String(Math.max(linkWidth + 2, linkWidth * 1.3)); } }}
      onMouseLeave={(e) => { const el = e.target as SVGPathElement; el.style.strokeOpacity = onClick ? '0.3' : '0.2'; el.style.strokeWidth = String(linkWidth); }}
    />
  );
}

const STOPWORDS = new Set([
  // English
  'the','is','at','which','on','a','an','and','or','but','in','to','for','of','with','it','this','that','was','are','be',
  'has','had','not','we','they','he','she','my','your','from','by','as','do','if','so','no','up','out','can','will',
  'just','one','all','been','have','their','what','when','how','who','than','its','also','very','much','more','about',
  // Danish
  'og','at','er','det','en','den','til','på','for','med','af','har','de','som','ikke','var','han','sig','der','jeg',
  'et','vi','kan','fra','men','om','over','efter','blev','ud','vil','skal','her','have','ham','hun','sin','også','da',
  'kun','mod','nu','eller','meget','min','mit','mere','dem','des','dig','din','dit',
  // Swedish
  'och','att','en','den','det','som','för','med','av','till','har','de','inte','är','var','han','sig','jag','ett',
  'vi','kan','från','men','om','efter','ut','vill','ska','här','ha','honom','hon','sin','också','bara','mot','nu',
  'eller','mycket','denna','detta','dessa','min','mitt','mer','dem','dig','din','ditt',
  // German
  'und','zu','den','das','ist','ein','es','auf','für','mit','dem','die','der','sich','des','sie','von','an','nicht',
  'als','auch','war','so','dass','kann','hat','noch','nach','wie','am','aus','bei','nur','aber','wenn','oder','sehr',
  'ich','wir','ihr','mein','mehr','einem','eine','einer',
]);

function extractThemes(notes: string[]): Array<{ term: string; count: number }> {
  const wordCounts = new Map<string, number>();
  const bigramCounts = new Map<string, number>();

  for (const text of notes) {
    const words = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
    for (const w of words) {
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
    }
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
    }
  }

  const results: Array<{ term: string; count: number }> = [];
  for (const [term, count] of wordCounts) {
    if (count >= 2) results.push({ term, count });
  }
  for (const [term, count] of bigramCounts) {
    if (count >= 2) results.push({ term, count });
  }
  results.sort((a, b) => b.count - a.count);
  return results.slice(0, 20);
}

// ChartCard — the standard dashboard panel. On flow dashboards it's `collapsible`
// (a chevron toggles the body); collapse uses a `max-h-0 overflow-hidden` CLIP on
// an ancestor so the chart stays mounted at full size and remains captureable by
// the PPTX export even while visually collapsed. The inner `data-chart-export`
// node is what the export handler screenshots (title from `data-chart-title`).
function ChartCard({ title, info, children, collapsible = false, defaultOpen = true }: { title: string; info?: React.ReactNode; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const ctxCollapsible = useCollapsibleCards();
  const isCollapsible = collapsible || ctxCollapsible;
  return (
    <div className="rounded-xl shadow-sm bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {info}
        <span className="flex-1" />
        {isCollapsible && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="shrink-0 text-gray-400 hover:text-gray-600 text-xs leading-none px-1 py-0.5 transition-colors"
          >
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>
      <div className={isCollapsible && !open ? 'max-h-0 overflow-hidden' : ''}>
        {/* pt-1 so captured PNGs (export region = this node, title lives in the
            header above and is added to the slide separately) never crop content
            flush against the top edge. */}
        <div data-chart-export data-chart-title={title} className="px-5 pt-1 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
