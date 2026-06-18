'use client';

import { toPng } from 'html-to-image';

// Export a DOM node (the capability chart card + its title/tiles) as a PNG
// download. Used by the flow dashboard's "Export image" button (2026-06-18).
// White background + 2× pixel ratio so the saved picture is crisp.
export async function exportNodeToPng(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(node, { backgroundColor: '#ffffff', pixelRatio: 2, cacheBust: true });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
