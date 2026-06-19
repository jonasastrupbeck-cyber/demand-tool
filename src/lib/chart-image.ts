'use client';

import { toPng } from 'html-to-image';

// Render a DOM node to a PNG data URL (white background, 2× for crispness).
// Used both by the PNG download below and by the PowerPoint export (R11), which
// embeds the data URL directly into pptx slides.
export async function nodeToPngDataUrl(node: HTMLElement): Promise<string> {
  return toPng(node, { backgroundColor: '#ffffff', pixelRatio: 2, cacheBust: true });
}

// Export a DOM node (the capability chart card + its title/tiles) as a PNG
// download. Used by the flow dashboard's "Export image" button (2026-06-18).
export async function exportNodeToPng(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await nodeToPngDataUrl(node);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
