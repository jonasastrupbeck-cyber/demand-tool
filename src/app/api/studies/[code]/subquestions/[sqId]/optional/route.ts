import { NextResponse } from 'next/server';
import { getStudyByCode, getSubquestions, getDemandTypes, setSubquestionDemandTypeOptional } from '@/lib/queries';

// Per-subquestion NOT-MANDATORY set (0055): PUT the full desired set of demand-type
// ids this subquestion is not required for (diff-set server-side). The question is
// still shown for those cases; it just doesn't gate milestone completion. Empty
// array = normal gating.
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

  await setSubquestionDemandTypeOptional(sqId, body.demandTypeIds);
  return NextResponse.json({ ok: true });
}
