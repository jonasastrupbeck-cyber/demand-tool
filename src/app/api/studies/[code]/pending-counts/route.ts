import { NextResponse } from 'next/server';
import { getStudyByCode, getPendingCounts } from '@/lib/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const counts = await getPendingCounts(study.id);
  return NextResponse.json(counts);
}
