import PptxGenJS from 'pptxgenjs';
import { SKIPTON_VANGUARD_LOGO_BASE64 } from '@/lib/logo-data';

// R11 (2026-06-18): export the flow dashboard charts (whichever view is shown)
// as a PowerPoint, branded with the Skipton·Vanguard lockup. Each chart is
// captured to a PNG data URL by the caller (html-to-image) and dropped onto its
// own slide. Title slide carries the lockup; every slide gets a small logo footer.

const SKIPTON_BLUE = '0072C5';
const GREY = '6b7280';

// The embedded lockup is natively 1550×658 → aspect ratio 2.356:1 (matches the
// website header's 218×93). Size every placement to that ratio so it never skews;
// `sizing: contain` is belt-and-braces against a future logo swap.
const LOGO_RATIO = 1550 / 658;

export async function exportCapabilityChartsToPptx(
  slides: { title: string; dataUrl: string }[],
  studyName: string,
  dateRangeLabel: string,
  fileName: string,
  subtitle = 'Capability Analysis',
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
  pptx.author = 'Vanguard Method · Skipton';
  pptx.title = `${studyName} — ${subtitle}`;

  const addLogoFooter = (slide: PptxGenJS.Slide) => {
    const w = 0.9, h = w / LOGO_RATIO; // ≈0.382"
    slide.addImage({ data: SKIPTON_VANGUARD_LOGO_BASE64, x: 0.3, y: 6.75, w, h, sizing: { type: 'contain', w, h } });
  };

  // ── Title slide ──
  const title = pptx.addSlide();
  title.background = { color: 'FFFFFF' };
  const titleLogoW = 2.5, titleLogoH = titleLogoW / LOGO_RATIO; // ≈1.061"
  title.addImage({ data: SKIPTON_VANGUARD_LOGO_BASE64, x: 5.42, y: 1.6, w: titleLogoW, h: titleLogoH, sizing: { type: 'contain', w: titleLogoW, h: titleLogoH } });
  title.addText(studyName, { x: 0.5, y: 3.4, w: 12.33, h: 0.8, align: 'center', fontSize: 30, bold: true, color: '1f2937' });
  title.addText(subtitle, { x: 0.5, y: 4.2, w: 12.33, h: 0.5, align: 'center', fontSize: 18, color: SKIPTON_BLUE });
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
