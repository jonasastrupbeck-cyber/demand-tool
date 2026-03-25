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

const HANDLING_COLORS = ['3b82f6', '8b5cf6', 'ec4899', 'f59e0b', '10b981', '6366f1', 'ef4444', '14b8a6'];

function t(key: TranslationKey, locale: Locale, params?: Record<string, string>): string {
  return translate(key, locale, params);
}

export async function exportDashboardToPptx(
  data: DashboardData,
  studyName: string,
  locale: Locale,
  dateRangeLabel: string,
  tl: (label: string) => string,
) {
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
  pptx.author = 'Vanguard Demand Tool';
  pptx.title = `${studyName} — Demand Analysis`;

  // ── Helper functions ──

  function addFooter(slide: PptxGenJS.Slide) {
    // Small Vanguard logo watermark in footer
    slide.addImage({
      data: VANGUARD_LOGO_BASE64,
      x: 0.3, y: 6.85, w: 0.4, h: 0.32,
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
  titleSlide.background = { fill: '1a1a2e' };

  // Burgundy accent bar at top
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: 'ac2c2d' },
  });

  // Vanguard logo on title slide
  titleSlide.addImage({
    data: VANGUARD_LOGO_BASE64,
    x: 1, y: 0.8, w: 1.5, h: 1.2,
  });

  titleSlide.addText(studyName, {
    x: 1, y: 2.2, w: 11.33, h: 1.2,
    fontSize: 40, fontFace: 'Arial', color: 'ffffff', bold: true,
  });
  titleSlide.addText(t('dashboard.title', locale), {
    x: 1, y: 3.3, w: 11.33, h: 0.8,
    fontSize: 24, fontFace: 'Arial', color: 'ac2c2d',
  });
  titleSlide.addText(`${dateRangeLabel}  •  ${data.totalEntries} ${t('dashboard.entries', locale)}`, {
    x: 1, y: 4.3, w: 11.33, h: 0.5,
    fontSize: 14, fontFace: 'Arial', color: '999999',
  });
  titleSlide.addText(new Date().toLocaleDateString(), {
    x: 1, y: 5.0, w: 11.33, h: 0.5,
    fontSize: 12, fontFace: 'Arial', color: '666666',
  });

  // ── Slide 2: Key Metrics ──
  const metricsSlide = pptx.addSlide();
  metricsSlide.background = { fill: 'ffffff' };
  addSlideTitle(metricsSlide, t('dashboard.title', locale));
  addFooter(metricsSlide);

  const valuePercent = data.totalEntries > 0 ? Math.round((data.valueCount / data.totalEntries) * 100) : 0;
  const failurePercent = data.totalEntries > 0 ? Math.round((data.failureCount / data.totalEntries) * 100) : 0;

  const metrics = [
    { label: t('dashboard.totalEntries', locale), value: `${data.totalEntries}`, sub: t('dashboard.entries', locale), color: '1f2937', bgColor: 'f8f9fa' },
    { label: t('dashboard.valueDemand', locale), value: `${valuePercent}%`, sub: `${data.valueCount} ${t('dashboard.entries', locale)}`, color: '22c55e', bgColor: 'f0fdf4' },
    { label: t('dashboard.failureDemand', locale), value: `${failurePercent}%`, sub: `${data.failureCount} ${t('dashboard.entries', locale)}`, color: 'ef4444', bgColor: 'fef2f2' },
    { label: t('dashboard.perfect', locale), value: `${data.perfectPercentage}%`, sub: t('dashboard.perfectSub', locale), color: '22c55e', bgColor: 'f0fdf4' },
  ];

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

  // Value vs Failure pie chart below metrics
  if (data.totalEntries > 0) {
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

  // ── Slide 3: Top Demand Types ──
  if (data.demandTypeCounts.length > 0) {
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
      const barColor = dt.category === 'failure' ? 'ef4444' : '3b82f6';
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

  // ── Slide 4: Handling Breakdown ──
  if (data.handlingTypeCounts.length > 0) {
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
      const barColor = HANDLING_COLORS[i % HANDLING_COLORS.length];

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
      const barColor = HANDLING_COLORS[i % HANDLING_COLORS.length];

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

  // ── Slide 6: What Matters ──
  if (data.whatMattersCounts.length > 0) {
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
          fill: { color: '8b5cf6' }, rectRadius: 0.04,
        });
      }
      wmSlide.addText(`${wm.count} (${pct}%)`, {
        x: 4.2 + bw + 0.1, y, w: 2, h: 0.4,
        fontSize: 9, fontFace: 'Arial', color: '6b7280',
      });
    });
  }

  // ── Slide 7: Failure Causes ──
  if (data.failureCauses.length > 0) {
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

  // ── Slide 8: Demand Over Time ──
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

  // ── Generate and download ──
  const fileName = `${studyName.replace(/[^a-zA-Z0-9]/g, '_')}_Demand_Analysis.pptx`;
  await pptx.writeFile({ fileName });
}
