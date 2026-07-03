import { NextResponse } from 'next/server';
import { getStudyByCode, getMilestones, getDemandTypes, setMilestoneDemandTypeConditions } from '@/lib/queries';

// Dynamic milestones (0051): scope a milestone to demand type(s). PUT the full
// desired set of demand-type ids (diff-set server-side); an empty array means the
// milestone applies to every case.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const milestones = await getMilestones(study.id);
  if (!milestones.some((m) => m.id === id)) {
    return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
  }

  const body = await request.json();
  if (!Array.isArray(body.demandTypeIds) || !body.demandTypeIds.every((x: unknown) => typeof x === 'string')) {
    return NextResponse.json({ error: 'demandTypeIds must be an array of ids' }, { status: 400 });
  }
  const validIds = new Set((await getDemandTypes(study.id)).map((d) => d.id));
  if (!body.demandTypeIds.every((dtId: string) => validIds.has(dtId))) {
    return NextResponse.json({ error: 'every demandTypeId must be a demand type of this study' }, { status: 400 });
  }

  await setMilestoneDemandTypeConditions(id, body.demandTypeIds);
  return NextResponse.json({ ok: true });
}
