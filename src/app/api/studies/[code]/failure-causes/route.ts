import { NextResponse } from 'next/server';
import { getStudyByCode, getFailureCauseSuggestions } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const suggestions = await getFailureCauseSuggestions(study.id);
  return NextResponse.json(suggestions);
}
