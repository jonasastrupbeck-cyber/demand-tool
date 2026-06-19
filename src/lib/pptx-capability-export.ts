import PptxGenJS from 'pptxgenjs';
import { SKIPTON_VANGUARD_LOGO_BASE64 } from '@/lib/logo-data';

// R11 (2026-06-18): export the flow capability charts as a PowerPoint, branded
// with the Skipton·Vanguard lockup. Each chart is captured to a PNG data URL by
// the caller (html-to-image) and dropped onto its own slide. Title slide carries
// the lockup; every slide gets a small logo footer.

const SKIPTON_BLUE = '0072C5';
const GREY = '6b7280';

export async function exportCapabilityChartsToPptx(
  slides: { title: string; dataUrl: string }[],
  studyName: string,
  dateRangeLabel: string,
  fileName: string,
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
  pptx.author = 'Vanguard Method · Skipton';
  pptx.title = `${studyName} — Capability Analysis`;

  const addLogoFooter = (slide: PptxGenJS.Slide) => {
    // Lockup is ~1.75:1 (538×308); 0.9" wide keeps it crisp in the corner.
    slide.addImage({ data: SKIPTON_VANGUARD_LOGO_BASE64, x: 0.3, y: 6.75, w: 0.9, h: 0.51 });
  };

  // ── Title slide ──
  const title = pptx.addSlide();
  title.background = { color: 'FFFFFF' };
  title.addImage({ data: SKIPTON_VANGUARD_LOGO_BASE64, x: 5.42, y: 1.6, w: 2.5, h: 1.43 });
  title.addText(studyName, { x: 0.5, y: 3.4, w: 12.33, h: 0.8, align: 'center', fontSize: 30, bold: true, color: '1f2937' });
  title.addText('Capability Analysis', { x: 0.5, y: 4.2, w: 12.33, h: 0.5, align: 'center', fontSize: 18, color: SKIPTON_BLUE });
  if (dateRangeLabel) {
    title.addText(dateRangeLabel, { x: 0.5, y: 4.8, w: 12.33, h: 0.4, align: 'center', fontSize: 12, color: GREY });
  }

  // ── One slide per chart ──
  for (const s of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addText(s.title, { x: 0.4, y: 0.3, w: 12.5, h: 0.6, fontSize: 14, bold: true, color: '1f2937' });
    // Contain the chart image within the body area, preserving aspect ratio.
    slide.addImage({ data: s.dataUrl, x: 0.4, y: 1.0, w: 12.5, h: 5.5, sizing: { type: 'contain', w: 12.5, h: 5.5 } });
    addLogoFooter(slide);
  }

  await pptx.writeFile({ fileName });
}
