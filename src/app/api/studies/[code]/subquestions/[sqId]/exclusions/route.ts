import { NextResponse } from 'next/server';
import { getStudyByCode, getSubquestions, getDemandTypes, setSubquestionDemandTypeExclusions } from '@/lib/queries';

// Per-subquestion demand-type exclusions (0054): PUT the full desired set of
// demand-type ids this subquestion is EXCLUDED for (diff-set server-side). An
// empty array means the subquestion applies to every case.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string; sqId: string }> }
) {
  const { code, sqId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const subqs = await getSubquestions(study.id);
  if (!subqs.some((s) => s.id === sqId)) {
    return NextResponse.json({ error: 'Subquestion not found' }, { status: 404 });
  }

  const body = await request.json();
  if (!Array.isArray(body.demandTypeIds) || !body.demandTypeIds.every((x: unknown) => typeof x === 'string')) {
    return NextResponse.json({ error: 'demandTypeIds must be an array of ids' }, { status: 400 });
  }
  const validIds = new Set((await getDemandTypes(study.id)).map((d) => d.id));
  if (!body.demandTypeIds.every((dtId: string) => validIds.has(dtId))) {
    return NextResponse.json({ error: 'every demandTypeId must be a demand type of this study' }, { status: 400 });
  }

  await setSubquestionDemandTypeExclusions(sqId, body.demandTypeIds);
  return NextResponse.json({ ok: true });
}
