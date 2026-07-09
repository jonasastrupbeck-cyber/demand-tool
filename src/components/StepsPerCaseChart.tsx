'use client';

import { useState, useEffect } from 'react';
import type { CapabilityData } from '@/types';
import { useLocale } from '@/lib/locale-context';
import XmRChart from '@/components/XmRChart';
import PillToggle from '@/components/PillToggle';
import PillSelect from '@/components/PillSelect';
import InfoPopover from '@/components/InfoPopover';

type Tag = 'total' | 'value' | 'sequence' | 'failure' | 'failure_demand';

// Steps-per-case XmR (2026-07-08): one point per case = its step count for the
// chosen tag (Total / Value / Sequence / Failure / Failure demand), as a count or
// a % of the case's total steps. The work-composition companion to touches.
// Optionally scoped to a single value step (2026-07-08 follow-up).
export default function StepsPerCaseChart({
  code, dateFrom, dateTo, valueDemands, valueSteps = [], fixedTag,
}: {
  code: string;
  dateFrom?: string;
  dateTo?: string;
  valueDemands?: string[];
  valueSteps?: { id: string; label: string }[];
  /** Lock the chart to one step type (hides the measure selector). Used to show
   *  the four types as separate charts. */
  fixedTag?: Tag;
}) {
  const { t, tl } = useLocale();
  const [tagState, setTag] = useState<Tag>('total');
  const tag = fixedTag ?? tagState;
  const [mode, setMode] = useState<'count' | 'pct'>('count');
  const [valueStepId, setValueStepId] = useState('');
  const [data, setData] = useState<CapabilityData | null>(null);
  const [loading, setLoading] = useState(false);

  // '%' is meaningless for Total (always 100%) — force count when Total is picked.
  const effMode = tag === 'total' ? 'count' : mode;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const qp = new URLSearchParams({ tag, mode: effMode });
    if (dateFrom) qp.set('from', dateFrom);
    if (dateTo) qp.set('to', dateTo);
    if (valueDemands && valueDemands.length) qp.set('valueDemands', valueDemands.join(','));
    if (valueStepId) qp.set('valueStep', valueStepId);
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/steps-per-case?${qp}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [code, dateFrom, dateTo, valueDemands, tag, effMode, valueStepId]);

  const tagLabel: Record<Tag, string> = {
    total: t('dashboard.stepTotal'),
    value: t('capture.value'),
    sequence: t('capture.classificationWorkSequence'),
    failure: t('capture.failure'),
    failure_demand: t('dashboard.failureDemand'),
  };
  // Semantic active colours; failure_demand deliberately distinct from failure work.
  const tagActive: Record<Tag, string | undefined> = {
    total: undefined,
    value: 'bg-green-100 text-green-700 border-green-300',
    sequence: 'bg-teal-100 text-teal-700 border-teal-300',
    failure: 'bg-red-100 text-red-700 border-red-300',
    failure_demand: 'bg-red-200 text-red-900 border-red-400',
  };
  const valueLabel = effMode === 'pct' ? `${tagLabel[tag]} %` : tagLabel[tag];
  const fmtValue = (v: number | null) => (v == null ? '—' : effMode === 'pct' ? `${v}%` : `${v}`);

  const controls = (
    <>
      {!fixedTag && (
        <PillToggle
          ariaLabel={t('dashboard.metricLabel')}
          value={tag}
          onChange={(v) => setTag(v as Tag)}
          options={(['total', 'value', 'sequence', 'failure', 'failure_demand'] as Tag[]).map((tg) => ({
            value: tg, label: tagLabel[tg], activeClassName: tagActive[tg],
          }))}
        />
      )}
      {tag !== 'total' && (
        <PillToggle
          ariaLabel={t('dashboard.countMode')}
          value={mode}
          onChange={(v) => setMode(v as 'count' | 'pct')}
          options={[
            { value: 'count', label: t('dashboard.countMode') },
            { value: 'pct', label: t('dashboard.pctMode') },
          ]}
        />
      )}
      {valueSteps.length > 0 && (
        <PillSelect
          ariaLabel={t('capture.selectValueStep')}
          placeholder={t('capture.selectValueStep')}
          value={valueStepId}
          onChange={setValueStepId}
          options={[{ id: '', label: t('dashboard.valueStepAll') }, ...valueSteps.map((v) => ({ id: v.id, label: tl(v.label) }))]}
        />
      )}
    </>
  );

  const stepLabel = valueSteps.find((v) => v.id === valueStepId)?.label;
  const subtitle = valueStepId && stepLabel ? `${valueLabel} · ${tl(stepLabel)}` : undefined;
  // Fixed-tag instances (the four per-type charts) title by their type, e.g.
  // "Value (work block)"; the free chart keeps "Blocks of work per case (XmR)".
  const title = fixedTag ? `${tagLabel[fixedTag]} (${t('dashboard.workBlockParen')})` : t('dashboard.stepsPerCaseTitle');

  return (
    <XmRChart
      title={title}
      subtitle={subtitle}
      valueLabel={valueLabel}
      data={data}
      loading={loading}
      controls={controls}
      fmtValue={fmtValue}
      info={<InfoPopover label={title}>{t('dashboard.calcStepsPerCase')}</InfoPopover>}
    />
  );
}
