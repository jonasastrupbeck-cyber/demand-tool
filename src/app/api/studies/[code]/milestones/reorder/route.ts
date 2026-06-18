import { NextResponse } from 'next/server';
import { getStudyByCode, getMilestones, reorderMilestones } from '@/lib/queries';

// One call reorders the whole milestone list (body: { orderedIds: string[] }).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  if (!Array.isArray(body.orderedIds) || !body.orderedIds.every((x: unknown) => typeof x === 'string')) {
    return NextResponse.json({ error: 'orderedIds must be an array of ids' }, { status: 400 });
  }

  const owned = new Set((await getMilestones(study.id)).map((m) => m.id));
  if (!body.orderedIds.every((id: string) => owned.has(id))) {
    return NextResponse.json({ error: 'orderedIds contains a milestone not in this study' }, { status: 400 });
  }

  await reorderMilestones(study.id, body.orderedIds);
  return NextResponse.json({ success: true });
}
