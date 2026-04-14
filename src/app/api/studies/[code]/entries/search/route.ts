import { NextResponse } from 'next/server';
import { getStudyByCode, searchEntries } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q') || undefined;
  const typeId = url.searchParams.get('typeId') || undefined;
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  if (!q && !typeId) {
    return NextResponse.json({ error: 'At least one of q or typeId is required' }, { status: 400 });
  }

  const results = await searchEntries(study.id, { query: q, typeId, limit });

  return NextResponse.json(results);
}
