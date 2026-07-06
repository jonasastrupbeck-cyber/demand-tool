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
  slides: { title: string; dataUrl: string; wPx: number; hPx: number }[],
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
  // Preserve each chart's on-screen aspect ratio EXACTLY (pptxgenjs `sizing:
  // contain` can't read intrinsic dimensions from a dataURL, so it stretches).
  // We fit the captured pixel ratio into the body band ourselves and centre it —
  // matching the dashboard proportions matters more than filling the slide.
  const BODY_Y = 1.0, BODY_W = 12.5, BODY_H = 5.5, SLIDE_W = 13.33;
  for (const s of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addText(s.title, { x: 0.4, y: 0.3, w: 12.5, h: 0.6, fontSize: 14, bold: true, color: '1f2937' });
    const ar = s.hPx > 0 ? s.wPx / s.hPx : BODY_W / BODY_H;
    let w = BODY_W, h = BODY_W / ar;
    if (h > BODY_H) { h = BODY_H; w = BODY_H * ar; }
    const x = (SLIDE_W - w) / 2;            // centre horizontally in the slide
    const y = BODY_Y + (BODY_H - h) / 2;    // centre vertically in the body band
    slide.addImage({ data: s.dataUrl, x, y, w, h });
    addLogoFooter(slide);
  }

  await pptx.writeFile({ fileName });
}
