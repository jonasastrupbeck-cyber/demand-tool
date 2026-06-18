import { NextResponse } from 'next/server';
import { getStudyByCode, getDecisionPointTypes, updateDecisionPointType, deleteDecisionPointType, getMilestones } from '@/lib/queries';

async function findOwnedType(code: string, id: string) {
  const study = await getStudyByCode(code);
  if (!study) return { error: NextResponse.json({ error: 'Study not found' }, { status: 404 }) };
  const types = await getDecisionPointTypes(study.id);
  const type = types.find((t) => t.id === id);
  if (!type) return { error: NextResponse.json({ error: 'Decision point type not found' }, { status: 404 }) };
  return { type, study };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const owned = await findOwnedType(code, id);
  if (owned.error) return owned.error;

  const body = await request.json();
  const data: Parameters<typeof updateDecisionPointType>[1] = {};
  if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
  if (typeof body.positiveLabel === 'string' && body.positiveLabel.trim()) data.positiveLabel = body.positiveLabel.trim();
  if (typeof body.negativeLabel === 'string' && body.negativeLabel.trim()) data.negativeLabel = body.negativeLabel.trim();
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;
  // milestoneId: a string assigns the decision point to a milestone (validated
  // to belong to this study); null unassigns it.
  if (body.milestoneId === null) {
    data.milestoneId = null;
  } else if (typeof body.milestoneId === 'string' && body.milestoneId) {
    const ms = await getMilestones(owned.study!.id);
    if (!ms.some((m) => m.id === body.milestoneId)) {
      return NextResponse.json({ error: 'milestoneId not found in study' }, { status: 400 });
    }
    data.milestoneId = body.milestoneId;
  }

  await updateDecisionPointType(id, data);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const owned = await findOwnedType(code, id);
  if (owned.error) return owned.error;

  // Per-case decision records cascade (deliberate; see schema comment).
  await deleteDecisionPointType(id);
  return NextResponse.json({ success: true });
}
