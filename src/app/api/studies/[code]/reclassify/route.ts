import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode, getEntriesForReclassification, getReclassificationCount } from '@/lib/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const layer = parseInt(searchParams.get('layer') || '0', 10);

  if (layer < 2 || layer > 4) {
    return NextResponse.json({ error: 'Invalid layer for reclassification' }, { status: 400 });
  }

  const entries = await getEntriesForReclassification(study.id, layer);
  const count = entries.length;

  return NextResponse.json({ entries, count });
}
