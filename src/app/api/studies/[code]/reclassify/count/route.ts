import { NextResponse } from 'next/server';
import { getStudyByCode, getReclassificationCount } from '@/lib/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const activeLayer = study.activeLayer;
  // Cap at 4 — reclassification only applies to layers 2, 3, 4
  const reclassifyLayer = activeLayer >= 4 ? 4 : activeLayer >= 3 ? 3 : activeLayer >= 2 ? 2 : 0;
  if (reclassifyLayer < 2) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getReclassificationCount(study.id, reclassifyLayer);
  return NextResponse.json({ count });
}
