import PptxGenJS from 'pptxgenjs';
import type { DashboardData } from '@/types';
import type { Locale, TranslationKey } from '@/lib/i18n';
import { t as translate } from '@/lib/i18n';
import { VANGUARD_LOGO_BASE64 } from '@/lib/logo-data';

const BRAND = {
  burgundy: '#ac2c2d',
  darkBg: '#1a1a2e',
  white: '#ffffff',
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
};

// Blue-to-grey shades for non-classification data
const NEUTRAL_COLORS = ['3b82f6', '60a5fa', '93c5fd', '6b7280', '9ca3af', '475569', '94a3b8', '64748b'];

function t(key: TranslationKey, locale: Locale, params?: Record<string, string>): string {
  return translate(key, locale, params);
}

export async function exportDashboardToPptx(
  data: DashboardData,
  studyName: string,
  locale: Locale,
  dateRangeLabel: string,
  tl: (label: string) => string,
  activeLayer: number = 5,
) {
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
  pptx.author = 'Vanguard Demand Tool';
  pptx.title = `${studyName} — Demand Analysis`;

  // ── Helper functions ──

  function addFooter(slide: PptxGenJS.Slide) {
    // Small Vanguard logo watermark in footer (aspect ratio 0.917)
    slide.addImage({
      data: VANGUARD_LOGO_BASE64,
      x: 0.3, y: 6.82, w: 0.3, h: 0.33,
    });
    slide.addText('Vanguard Demand Analysis', {
      x: 0.75, y: 7.0, w: 5, h: 0.3,
      fontSize: 8, color: '999999', fontFace: 'Arial',
    });
    slide.addText(new Date().toLocaleDateString(), {
      x: 8, y: 7.0, w: 4.83, h: 0.3,
      fontSize: 8, color: '999999', fontFace: 'Arial', align: 'right',
    });
  }

  function addSlideTitle(slide: PptxGenJS.Slide, title: string) {
    // Burgundy accent line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 0.4, w: 0.06, h: 0.45, fill: { color: 'ac2c2d' },
    });
    slide.addText(title, {
      x: 0.7, y: 0.35, w: 12, h: 0.55,
      fontSize: 22, fontFace: 'Arial', color: '1f2937', bold: true,
    });
  }

  // ── Slide 1: Title Slide ──
  const titleSlide = pptx.addSlide();
  titleSlide.background = { fill: 'ffffff' };

  // Burgundy accent bar at top
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: 'ac2c2d' },
  });

  // Vanguard logo on title slide (1041×1136 original — aspect ratio ~0.917)
  titleSlide.addImage({
    data: VANGUARD_LOGO_BASE64,
    x: 1, y: 0.6, w: 1.1, h: 1.2,
  });

  titleSlide.addText(studyName, {
    x: 1, y: 2.0, w: 11.33, h: 1.2,
    fontSize: 40, fontFace: 'Arial', color: '1f2937', bold: true,
  });
  titleSlide.addText(t('dashboard.title', locale), {
    x: 1, y: 3.1, w: 11.33, h: 0.8,
    fontSize: 24, fontFace: 'Arial', color: 'ac2c2d',
  });
  titleSlide.addText(`${dateRangeLabel}  •  ${data.totalEntries} ${t('dashboard.entries', locale)}`, {
    x: 1, y: 4.1, w: 11.33, h: 0.5,
    fontSize: 14, fontFace: 'Arial', color: '6b7280',
  });
  titleSlide.addText(new Date().toLocaleDateString(), {
    x: 1, y: 4.8, w: 11.33, h: 0.5,
    fontSize: 12, fontFace: 'Arial', color: '999999',
  });

  // ── Slide 2: Executive Summary ──
  const summarySlide = pptx.addSlide();
  summarySlide.background = { fill: 'ffffff' };
  addSlideTitle(summarySlide, t('dashboard.executiveSummary', locale));
  addFooter(summarySlide);

  const findings: string[] = [];

  // Total entries
  findings.push(`${data.totalEntries} ${t('dashboard.entries', locale)}`);

  // Value/Failure split
  if (activeLayer >= 2 && data.totalEntries > 0) {
    const vPct = Math.round((data.valueCount / data.totalEntries) * 100);
    const fPct = Math.round((data.failureCount / data.totalEntries) * 100);
    findings.push(`${t('dashboard.valueDemand', locale)}: ${vPct}% — ${t('dashboard.failureDemand', locale)}: ${fPct}%`);
  }

  // Top demand type
  if (activeLayer >= 2 && data.demandTypeCounts.length > 0) {
    const top = data.demandTypeCounts[0];
    const topPct = data.totalEntries > 0 ? Math.round((top.count / data.totalEntries) * 100) : 0;
    findings.push(`${t('dashboard.topDemandType', locale)}: ${tl(top.label)} (${topPct}%)`);
  }

  // Perfect handling
  if (activeLayer >= 3 && data.perfectPercentage !== undefined) {
    findings.push(`${t('dashboard.perfect', locale)}: ${data.perfectPercentage}%`);
  }

  // Failure flows
  if (activeLayer >= 2 && data.failureFlowLinks && data.failureFlowLinks.length > 0) {
    const topFlow = data.failureFlowLinks.reduce((a, b) => a.count > b.count ? a : b);
    findings.push(`${t('dashboard.topFailureFlow', locale)}: ${tl(topFlow.sourceLabel)} → ${tl(topFlow.targetLabel)} (${topFlow.count})`);
  }

  // Top failure cause
  if (activeLayer >= 2 && data.failureCauses.length > 0) {
    findings.push(`${t('dashboard.topFailureCause', locale)}: ${data.failureCauses[0].cause} (${data.failureCauses[0].count})`);
  }

  // Demand vs Work
  if (data.workCount > 0) {
    const totalCapacity = data.totalEntries + data.workCount;
    const demandPct = Math.round((data.totalEntries / totalCapacity) * 100);
    findings.push(`${t('dashboard.demandTab', locale)}: ${demandPct}% — ${t('dashboard.workTab', locale)}: ${100 - demandPct}%`);
  }

  findings.forEach((f, i) => {
    const y = 1.4 + i * 0.65;
    // Bullet point
    summarySlide.addShape(pptx.ShapeType.ellipse, {
      x: 0.9, y: y + 0.12, w: 0.12, h: 0.12, fill: { color: 'ac2c2d' },
    });
    summarySlide.addText(f, {
      x: 1.2, y, w: 11, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: '1f2937',
    });
  });

  // ── Slide 3: Key Metrics ──
  const metricsSlide = pptx.addSlide();
  metricsSlide.background = { fill: 'ffffff' };
  addSlideTitle(metricsSlide, t('dashboard.title', locale));
  addFooter(metricsSlide);

  const valuePercent = data.totalEntries > 0 ? Math.round((data.valueCount / data.totalEntries) * 100) : 0;
  const failurePercent = data.totalEntries > 0 ? Math.round((data.failureCount / data.totalEntries) * 100) : 0;

  const metrics: Array<{ label: string; value: string; sub: string; color: string; bgColor: string }> = [
    { label: t('dashboard.totalEntries', locale), value: `${data.totalEntries}`, sub: t('dashboard.entries', locale), color: '1f2937', bgColor: 'f8f9fa' },
  ];
  if (activeLayer >= 2) {
    metrics.push(
      { label: t('dashboard.valueDemand', locale), value: `${valuePercent}%`, sub: `${data.valueCount} ${t('dashboard.entries', locale)}`, color: '22c55e', bgColor: 'f0fdf4' },
      { label: t('dashboard.failureDemand', locale), value: `${failurePercent}%`, sub: `${data.failureCount} ${t('dashboard.entries', locale)}`, color: 'ef4444', bgColor: 'fef2f2' },
    );
  }
  if (activeLayer >= 3) {
    metrics.push(
      { label: t('dashboard.perfect', locale), value: `${data.perfectPercentage}%`, sub: t('dashboard.perfectSub', locale), color: '22c55e', bgColor: 'f0fdf4' },
    );
  }

  metrics.forEach((m, i) => {
    const x = 0.5 + i * 3.1;
    metricsSlide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.5, w: 2.8, h: 2.0,
      fill: { color: m.bgColor },
      rectRadius: 0.1,
      line: { color: 'e5e7eb', width: 1 },
    });
    metricsSlide.addText(m.label, {
      x, y: 1.6, w: 2.8, h: 0.4,
      fontSize: 10, fontFace: 'Arial', color: '6b7280', align: 'center',
      bold: true,
    });
    metricsSlide.addText(m.value, {
      x, y: 2.0, w: 2.8, h: 0.9,
      fontSize: 36, fontFace: 'Arial', color: m.color, align: 'center',
      bold: true,
    });
    metricsSlide.addText(m.sub, {
      x, y: 2.8, w: 2.8, h: 0.4,
      fontSize: 9, fontFace: 'Arial', color: '999999', align: 'center',
    });
  });

  // Value vs Failure pie chart below metrics (layer 2+)
  if (activeLayer >= 2 && data.totalEntries > 0) {
    metricsSlide.addText(t('dashboard.valueVsFailure', locale), {
      x: 0.5, y: 3.8, w: 12, h: 0.4,
      fontSize: 13, fontFace: 'Arial', color: '1f2937', bold: true,
    });

    const pieData = [
      {
        name: t('capture.value', locale),
        labels: [t('capture.value', locale), t('capture.failure', locale)],
        values: [data.valueCount, data.failureCount],
      },
    ];

    metricsSlide.addChart('pie', pieData, {
      x: 3.5, y: 4.0, w: 6, h: 3.2,
      showLegend: true,
      legendPos: 'b',
      legendFontSize: 10,
      legendColor: '1f2937',
      showPercent: true,
      showValue: false,
      showTitle: false,
      dataLabelPosition: 'outEnd',
      dataLabelFontSize: 11,
      dataLabelColor: '1f2937',
      dataLabelFontBold: true,
      chartColors: ['22c55e', 'ef4444'],
    });
  }

  // ── Slide 3: Top Demand Types (Layer 2+) ──
  if (activeLayer >= 2 && data.demandTypeCounts.length > 0) {
    const dtSlide = pptx.addSlide();
    dtSlide.background = { fill: 'ffffff' };
    addSlideTitle(dtSlide, t('dashboard.top10', locale));
    addFooter(dtSlide);

    const totalDT = data.demandTypeCounts.reduce((s, d) => s + d.count, 0);
    const maxCount = Math.max(...data.demandTypeCounts.map(d => d.count));
    const barMaxW = 7.5;

    data.demandTypeCounts.slice(0, 10).forEach((dt, i) => {
      const y = 1.3 + i * 0.5;
      const pct = totalDT > 0 ? Math.round((dt.count / totalDT) * 100) : 0;
      const barColor = dt.category === 'failure' ? 'ef4444' : '22c55e';
      const bw = maxCount > 0 ? (dt.count / maxCount) * barMaxW : 0;

      dtSlide.addText(tl(dt.label), {
        x: 0.5, y, w: 3.5, h: 0.4,
        fontSize: 10, fontFace: 'Arial', color: '1f2937', align: 'right',
      });
      if (bw > 0.05) {
        dtSlide.addShape(pptx.ShapeType.roundRect, {
          x: 4.2, y: y + 0.05, w: bw, h: 0.3,
          fill: { color: barColor }, rectRadius: 0.04,
        });
      }
      dtSlide.addText(`${dt.count} (${pct}%)`, {
        x: 4.2 + bw + 0.1, y, w: 2, h: 0.4,
        fontSize: 9, fontFace: 'Arial', color: '6b7280',
      });
    });
  }

  // ── Slide 4: Failures by Original Value Demand (Layer 2+) ──
  if (activeLayer >= 2 && data.failuresByOriginalValueDemand && data.failuresByOriginalValueDemand.length > 0) {
    const fovSlide = pptx.addSlide();
    fovSlide.background = { fill: 'ffffff' };
    addSlideTitle(fovSlide, t('dashboard.failureByValueTitle', locale));
    addFooter(fovSlide);

    const totalFOV = data.failuresByOriginalValueDemand.reduce((s, d) => s + d.count, 0);
    const maxFOV = Math.max(...data.failuresByOriginalValueDemand.map(d => d.count));
    const barMaxW = 7.0;

    data.failuresByOriginalValueDemand.forEach((item, i) => {
      const y = 1.3 + i * 0.5;
      const pct = totalFOV > 0 ? Math.round((item.count / totalFOV) * 100) : 0;
      const bw = maxFOV > 0 ? (item.count / maxFOV) * barMaxW : 0;

      fovSlide.addText(tl(item.label), {
        x: 0.5, y, w: 3.5, h: 0.4,
        fontSize: 10, fontFace: 'Arial', color: '1f2937', align: 'right',
      });
      if (bw > 0.05) {
        fovSlide.addShape(pptx.ShapeType.roundRect, {
          x: 4.2, y: y + 0.05, w: bw, h: 0.3,
          fill: { color: 'ef4444' }, rectRadius: 0.04,
        });
      }
      fovSlide.addText(`${item.count} (${pct}%)`, {
        x: 4.2 + bw + 0.1, y, w: 2, h: 0.4,
        fontSize: 9, fontFace: 'Arial', color: '6b7280',
      });
    });
  }

  // ── Slide: Failure Flow Cross-tabulation (Layer 2+) ──
  if (activeLayer >= 2 && data.failureFlowLinks && data.failureFlowLinks.length > 0) {
    const ffSlide = pptx.addSlide();
    ffSlide.background = { fill: 'ffffff' };
    addSlideTitle(ffSlide, t('dashboard.failureFlow', locale));
    addFooter(ffSlide);

    // Build cross-tab: rows = source (value demand types), cols = target (failure demand types)
    const sourceLabels = [...new Set(data.failureFlowLinks.map(l => l.sourceLabel))];
    const targetLabels = [...new Set(data.failureFlowLinks.map(l => l.targetLabel))];
    const countMap = new Map<string, number>();
    for (const link of data.failureFlowLinks) {
      countMap.set(`${link.sourceLabel}||${link.targetLabel}`, link.count);
    }

    // Header row: empty cell + failure demand type columns + total
    const headerRow: PptxGenJS.TableRow = [
      { text: '', options: { bold: true, fontSize: 8, fill: { color: 'f3f4f6' }, color: '1f2937' } },
      ...targetLabels.map(label => ({
        text: tl(label), options: { bold: true, fontSize: 8, fill: { color: 'fef2f2' }, color: 'ef4444', align: 'center' as const },
      })),
      { text: 'Total', options: { bold: true, fontSize: 8, fill: { color: 'f3f4f6' }, color: '1f2937', align: 'center' as const } },
    ];

    const tableRows: PptxGenJS.TableRow[] = [headerRow];

    sourceLabels.forEach(source => {
      let rowTotal = 0;
      const cells: PptxGenJS.TableRow = [
        { text: tl(source), options: { fontSize: 8, color: '22c55e', bold: true } },
      ];
      targetLabels.forEach(target => {
        const count = countMap.get(`${source}||${target}`) || 0;
        rowTotal += count;
        cells.push({
          text: count > 0 ? `${count}` : '', options: { fontSize: 8, color: '1f2937', align: 'center' as const },
        });
      });
      cells.push({
        text: `${rowTotal}`, options: { fontSize: 8, color: '1f2937', align: 'center' as const, bold: true },
      });
      tableRows.push(cells);
    });

    // Totals row
    const totalsRow: PptxGenJS.TableRow = [
      { text: 'Total', options: { bold: true, fontSize: 8, color: '1f2937', fill: { color: 'f3f4f6' } } },
    ];
    let grandTotal = 0;
    targetLabels.forEach(target => {
      const colTotal = sourceLabels.reduce((sum, source) => sum + (countMap.get(`${source}||${target}`) || 0), 0);
      grandTotal += colTotal;
      totalsRow.push({
        text: `${colTotal}`, options: { bold: true, fontSize: 8, color: '1f2937', align: 'center' as const, fill: { color: 'f3f4f6' } },
      });
    });
    totalsRow.push({
      text: `${grandTotal}`, options: { bold: true, fontSize: 8, color: '1f2937', align: 'center' as const, fill: { color: 'f3f4f6' } },
    });
    tableRows.push(totalsRow);

    // Column widths: first col wider, rest evenly distributed
    const totalCols = targetLabels.length + 2; // source label + targets + total
    const firstColW = 3;
    const remainingW = 9.5;
    const otherColW = remainingW / (totalCols - 1);
    const colW = [firstColW, ...Array(totalCols - 1).fill(otherColW)];

    ffSlide.addTable(tableRows, {
      x: 0.3, y: 1.3, w: 12.5,
      border: { type: 'solid', pt: 0.5, color: 'e5e7eb' },
      colW,
      fontFace: 'Arial',
      autoPage: true,
    });
  }

  // ── Slide 5: Handling Breakdown (Layer 3+) ──
  if (activeLayer >= 3 && data.handlingTypeCounts.length > 0) {
    const hSlide = pptx.addSlide();
    hSlide.background = { fill: 'ffffff' };
    addSlideTitle(hSlide, t('dashboard.handlingTitle', locale));
    addFooter(hSlide);

    const totalH = data.handlingTypeCounts.reduce((s, d) => s + d.count, 0);
    const maxH = Math.max(...data.handlingTypeCounts.map(d => d.count));
    const barMaxW = 7.0;

    data.handlingTypeCounts.forEach((ht, i) => {
      const y = 1.3 + i * 0.6;
      const pct = totalH > 0 ? Math.round((ht.count / totalH) * 100) : 0;
      const bw = maxH > 0 ? (ht.count / maxH) * barMaxW : 0;
      const barColor = NEUTRAL_COLORS[i % NEUTRAL_COLORS.length];

      hSlide.addText(tl(ht.label), {
        x: 0.5, y, w: 3.5, h: 0.45,
        fontSize: 11, fontFace: 'Arial', color: '1f2937', align: 'right',
      });
      if (bw > 0.05) {
        hSlide.addShape(pptx.ShapeType.roundRect, {
          x: 4.2, y: y + 0.05, w: bw, h: 0.35,
          fill: { color: barColor }, rectRadius: 0.04,
        });
      }
      hSlide.addText(`${ht.count} (${pct}%)`, {
        x: 4.2 + bw + 0.1, y, w: 2, h: 0.45,
        fontSize: 10, fontFace: 'Arial', color: '6b7280',
      });
    });

    // Handling by classification table below
    if (data.handlingByClassification.length > 0) {
      const tableY = 1.3 + data.handlingTypeCounts.length * 0.6 + 0.5;
      hSlide.addText(t('dashboard.handlingByClass', locale), {
        x: 0.5, y: tableY, w: 12, h: 0.4,
        fontSize: 13, fontFace: 'Arial', color: '1f2937', bold: true,
      });

      const tableRows: PptxGenJS.TableRow[] = [
        [
          { text: '', options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '1f2937' } },
          { text: t('capture.value', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '22c55e', align: 'center' } },
          { text: t('capture.failure', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: 'ef4444', align: 'center' } },
          { text: 'Total', options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '1f2937', align: 'center' } },
        ],
      ];

      data.handlingByClassification.forEach((hbc) => {
        const total = hbc.valueCount + hbc.failureCount;
        tableRows.push([
          { text: tl(hbc.label), options: { fontSize: 9, color: '1f2937' } },
          { text: `${hbc.valueCount}`, options: { fontSize: 9, color: '22c55e', align: 'center' } },
          { text: `${hbc.failureCount}`, options: { fontSize: 9, color: 'ef4444', align: 'center' } },
          { text: `${total}`, options: { fontSize: 9, color: '1f2937', align: 'center', bold: true } },
        ]);
      });

      hSlide.addTable(tableRows, {
        x: 0.5, y: tableY + 0.4, w: 8,
        border: { type: 'solid', pt: 0.5, color: 'e5e7eb' },
        colW: [3, 1.5, 1.5, 1.5],
        fontFace: 'Arial',
      });
    }
  }

  // ── Slide 5: Contact Methods ──
  if (data.contactMethodCounts.length > 0) {
    const cmSlide = pptx.addSlide();
    cmSlide.background = { fill: 'ffffff' };
    addSlideTitle(cmSlide, t('dashboard.contactMethods', locale));
    addFooter(cmSlide);

    const totalCM = data.contactMethodCounts.reduce((s, d) => s + d.count, 0);
    const maxCM = Math.max(...data.contactMethodCounts.map(d => d.count));
    const barMaxW = 7.0;

    data.contactMethodCounts.forEach((cm, i) => {
      const y = 1.3 + i * 0.6;
      const pct = totalCM > 0 ? Math.round((cm.count / totalCM) * 100) : 0;
      const bw = maxCM > 0 ? (cm.count / maxCM) * barMaxW : 0;
      const barColor = NEUTRAL_COLORS[i % NEUTRAL_COLORS.length];

      cmSlide.addText(tl(cm.label), {
        x: 0.5, y, w: 3.5, h: 0.45,
        fontSize: 11, fontFace: 'Arial', color: '1f2937', align: 'right',
      });
      if (bw > 0.05) {
        cmSlide.addShape(pptx.ShapeType.roundRect, {
          x: 4.2, y: y + 0.05, w: bw, h: 0.35,
          fill: { color: barColor }, rectRadius: 0.04,
        });
      }
      cmSlide.addText(`${cm.count} (${pct}%)`, {
        x: 4.2 + bw + 0.1, y, w: 2, h: 0.45,
        fontSize: 10, fontFace: 'Arial', color: '6b7280',
      });
    });
  }

  // ── Slide 6: What Matters (Layer 5+) ──
  if (activeLayer >= 5 && data.whatMattersCounts.length > 0) {
    const wmSlide = pptx.addSlide();
    wmSlide.background = { fill: 'ffffff' };
    addSlideTitle(wmSlide, t('dashboard.whatMatters', locale));
    addFooter(wmSlide);

    const totalWM = data.whatMattersCounts.reduce((s, d) => s + d.count, 0);
    const maxWM = Math.max(...data.whatMattersCounts.map(d => d.count));
    const barMaxW = 7.0;

    data.whatMattersCounts.slice(0, 10).forEach((wm, i) => {
      const y = 1.3 + i * 0.5;
      const pct = totalWM > 0 ? Math.round((wm.count / totalWM) * 100) : 0;
      const bw = maxWM > 0 ? (wm.count / maxWM) * barMaxW : 0;

      wmSlide.addText(tl(wm.label), {
        x: 0.5, y, w: 3.5, h: 0.4,
        fontSize: 10, fontFace: 'Arial', color: '1f2937', align: 'right',
      });
      if (bw > 0.05) {
        wmSlide.addShape(pptx.ShapeType.roundRect, {
          x: 4.2, y: y + 0.05, w: bw, h: 0.3,
          fill: { color: '60a5fa' }, rectRadius: 0.04,
        });
      }
      wmSlide.addText(`${wm.count} (${pct}%)`, {
        x: 4.2 + bw + 0.1, y, w: 2, h: 0.4,
        fontSize: 9, fontFace: 'Arial', color: '6b7280',
      });
    });
  }

  // ── Slide: What Matters by Classification (Layer 5+) ──
  if (activeLayer >= 5 && data.whatMattersByClassification && data.whatMattersByClassification.length > 0) {
    const wmcSlide = pptx.addSlide();
    wmcSlide.background = { fill: 'ffffff' };
    addSlideTitle(wmcSlide, t('dashboard.whatMattersByClass', locale));
    addFooter(wmcSlide);

    const tableRows: PptxGenJS.TableRow[] = [
      [
        { text: t('dashboard.whatMatters', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '1f2937' } },
        { text: t('capture.value', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '22c55e', align: 'center' } },
        { text: t('capture.failure', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: 'ef4444', align: 'center' } },
        { text: 'Total', options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '1f2937', align: 'center' } },
      ],
    ];

    data.whatMattersByClassification.forEach((wmc) => {
      const total = wmc.valueCount + wmc.failureCount;
      tableRows.push([
        { text: tl(wmc.label), options: { fontSize: 9, color: '1f2937' } },
        { text: `${wmc.valueCount}`, options: { fontSize: 9, color: '22c55e', align: 'center' } },
        { text: `${wmc.failureCount}`, options: { fontSize: 9, color: 'ef4444', align: 'center' } },
        { text: `${total}`, options: { fontSize: 9, color: '1f2937', align: 'center', bold: true } },
      ]);
    });

    wmcSlide.addTable(tableRows, {
      x: 0.5, y: 1.3, w: 8,
      border: { type: 'solid', pt: 0.5, color: 'e5e7eb' },
      colW: [3, 1.5, 1.5, 1.5],
      fontFace: 'Arial',
    });
  }

  // ── Slide: Point of Transaction ──
  if (data.pointOfTransactionByClassification && data.pointOfTransactionByClassification.length > 0) {
    const potSlide = pptx.addSlide();
    potSlide.background = { fill: 'ffffff' };
    addSlideTitle(potSlide, t('dashboard.pointOfTransaction', locale));
    addFooter(potSlide);

    const tableRows: PptxGenJS.TableRow[] = [
      [
        { text: t('capture.pointOfTransactionLabel', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '1f2937' } },
        { text: t('capture.value', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '22c55e', align: 'center' } },
        { text: t('capture.failure', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: 'ef4444', align: 'center' } },
        { text: 'Total', options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '1f2937', align: 'center' } },
        { text: '%', options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '1f2937', align: 'center' } },
      ],
    ];

    data.pointOfTransactionByClassification.forEach((pot) => {
      const total = pot.valueCount + pot.failureCount;
      const pct = data.totalEntries > 0 ? Math.round((total / data.totalEntries) * 100) : 0;
      tableRows.push([
        { text: tl(pot.label), options: { fontSize: 9, color: '1f2937' } },
        { text: `${pot.valueCount}`, options: { fontSize: 9, color: '22c55e', align: 'center' } },
        { text: `${pot.failureCount}`, options: { fontSize: 9, color: 'ef4444', align: 'center' } },
        { text: `${total}`, options: { fontSize: 9, color: '1f2937', align: 'center', bold: true } },
        { text: `${pct}%`, options: { fontSize: 9, color: '6b7280', align: 'center' } },
      ]);
    });

    potSlide.addTable(tableRows, {
      x: 0.5, y: 1.3, w: 10,
      border: { type: 'solid', pt: 0.5, color: 'e5e7eb' },
      colW: [4, 1.5, 1.5, 1.5, 1.5],
      fontFace: 'Arial',
    });
  }

  // ── Slide 7: Failure Causes (Layer 2+) ──
  if (activeLayer >= 2 && data.failureCauses.length > 0) {
    const fcSlide = pptx.addSlide();
    fcSlide.background = { fill: 'ffffff' };
    addSlideTitle(fcSlide, t('dashboard.failureCauses', locale));
    addFooter(fcSlide);

    const tableRows: PptxGenJS.TableRow[] = [
      [
        { text: t('dashboard.failureCauses', locale), options: { bold: true, fontSize: 10, fill: { color: 'fef2f2' }, color: 'ef4444' } },
        { text: '#', options: { bold: true, fontSize: 10, fill: { color: 'fef2f2' }, color: 'ef4444', align: 'center' } },
      ],
    ];

    data.failureCauses.slice(0, 15).forEach((fc) => {
      tableRows.push([
        { text: fc.cause, options: { fontSize: 9, color: '1f2937' } },
        { text: `${fc.count}`, options: { fontSize: 9, color: 'ef4444', align: 'center', bold: true } },
      ]);
    });

    fcSlide.addTable(tableRows, {
      x: 0.5, y: 1.3, w: 10,
      border: { type: 'solid', pt: 0.5, color: 'e5e7eb' },
      colW: [8, 1.5],
      fontFace: 'Arial',
    });
  }

  // ── Slide 9: Demand Over Time ──
  if (data.demandOverTime.length > 1) {
    const dotSlide = pptx.addSlide();
    dotSlide.background = { fill: 'ffffff' };
    addSlideTitle(dotSlide, t('dashboard.overTime', locale));
    addFooter(dotSlide);

    // Build a simple table representation of the trend
    const timeRows: PptxGenJS.TableRow[] = [
      [
        { text: t('dashboard.overTime', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '1f2937' } },
        { text: t('capture.value', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '22c55e', align: 'center' } },
        { text: t('capture.failure', locale), options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: 'ef4444', align: 'center' } },
        { text: 'Total', options: { bold: true, fontSize: 9, fill: { color: 'f3f4f6' }, color: '1f2937', align: 'center' } },
      ],
    ];

    data.demandOverTime.forEach((dot) => {
      timeRows.push([
        { text: dot.date, options: { fontSize: 9, color: '1f2937' } },
        { text: `${dot.valueCount}`, options: { fontSize: 9, color: '22c55e', align: 'center' } },
        { text: `${dot.failureCount}`, options: { fontSize: 9, color: 'ef4444', align: 'center' } },
        { text: `${dot.valueCount + dot.failureCount}`, options: { fontSize: 9, color: '1f2937', align: 'center', bold: true } },
      ]);
    });

    dotSlide.addTable(timeRows, {
      x: 0.5, y: 1.3, w: 12,
      border: { type: 'solid', pt: 0.5, color: 'e5e7eb' },
      colW: [4, 2.5, 2.5, 2.5],
      fontFace: 'Arial',
      autoPage: true,
    });
  }

  // ── Slide: Demand vs Work ──
  if (data.workCount > 0) {
    const dvwSlide = pptx.addSlide();
    dvwSlide.background = { fill: 'ffffff' };
    addSlideTitle(dvwSlide, t('dashboard.demandVsWork', locale));
    addFooter(dvwSlide);

    const totalCapacity = data.totalEntries + data.workCount;
    const demandPct = totalCapacity > 0 ? Math.round((data.totalEntries / totalCapacity) * 100) : 0;
    const workPct = totalCapacity > 0 ? Math.round((data.workCount / totalCapacity) * 100) : 0;

    const dvwData = [
      {
        name: 'split',
        labels: [t('dashboard.demandTab', locale), t('dashboard.workTab', locale)],
        values: [data.totalEntries, data.workCount],
      },
    ];

    dvwSlide.addChart('pie', dvwData, {
      x: 3.5, y: 1.3, w: 6, h: 4,
      showLegend: true,
      legendPos: 'b',
      legendFontSize: 11,
      legendColor: '1f2937',
      showPercent: true,
      showValue: false,
      showTitle: false,
      dataLabelPosition: 'outEnd',
      dataLabelFontSize: 12,
      dataLabelColor: '1f2937',
      dataLabelFontBold: true,
      chartColors: ['3b82f6', 'f59e0b'],
    });

    // Summary text
    dvwSlide.addText(`${t('dashboard.demandTab', locale)}: ${data.totalEntries} (${demandPct}%)  |  ${t('dashboard.workTab', locale)}: ${data.workCount} (${workPct}%)  |  ${t('dashboard.totalCapacity', locale)}: ${totalCapacity}`, {
      x: 0.5, y: 5.5, w: 12, h: 0.5,
      fontSize: 11, fontFace: 'Arial', color: '6b7280', align: 'center',
    });
  }

  // ── Slide: Work Analysis ──
  if (data.workCount > 0 && data.workTypeCounts.length > 0) {
    const waSlide = pptx.addSlide();
    waSlide.background = { fill: 'ffffff' };
    addSlideTitle(waSlide, t('dashboard.workAnalysis', locale));
    addFooter(waSlide);

    // Work value/failure/? summary
    const workValPct = data.workCount > 0 ? Math.round((data.workValueCount / data.workCount) * 100) : 0;
    const workFailPct = data.workCount > 0 ? Math.round((data.workFailureCount / data.workCount) * 100) : 0;

    waSlide.addText(`${t('capture.value', locale)}: ${data.workValueCount} (${workValPct}%)  |  ${t('capture.failure', locale)}: ${data.workFailureCount} (${workFailPct}%)${data.workUnknownCount > 0 ? `  |  ?: ${data.workUnknownCount}` : ''}`, {
      x: 0.5, y: 1.2, w: 12, h: 0.4,
      fontSize: 11, fontFace: 'Arial', color: '6b7280', align: 'center',
    });

    // Work type bars
    const maxWT = Math.max(...data.workTypeCounts.map(d => d.count));
    const barMaxW = 7.0;

    data.workTypeCounts.forEach((item, i) => {
      const y = 2.0 + i * 0.5;
      const pct = data.workCount > 0 ? Math.round((item.count / data.workCount) * 100) : 0;
      const bw = maxWT > 0 ? (item.count / maxWT) * barMaxW : 0;

      waSlide.addText(tl(item.label), {
        x: 0.5, y, w: 3.5, h: 0.4,
        fontSize: 10, fontFace: 'Arial', color: '1f2937', align: 'right',
      });
      if (bw > 0.05) {
        waSlide.addShape(pptx.ShapeType.roundRect, {
          x: 4.2, y: y + 0.05, w: bw, h: 0.3,
          fill: { color: 'f59e0b' }, rectRadius: 0.04,
        });
      }
      waSlide.addText(`${item.count} (${pct}%)`, {
        x: 4.2 + bw + 0.1, y, w: 2, h: 0.4,
        fontSize: 9, fontFace: 'Arial', color: '6b7280',
      });
    });
  }

  // ── Generate and download ──
  const fileName = `${studyName.replace(/[^a-zA-Z0-9]/g, '_')}_Demand_Analysis.pptx`;
  await pptx.writeFile({ fileName });
}
