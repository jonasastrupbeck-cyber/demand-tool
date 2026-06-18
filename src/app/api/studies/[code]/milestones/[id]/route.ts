import { NextResponse } from 'next/server';
import { getStudyByCode, getMilestones, updateMilestone, deleteMilestone } from '@/lib/queries';

async function findOwnedMilestone(code: string, id: string) {
  const study = await getStudyByCode(code);
  if (!study) return { error: NextResponse.json({ error: 'Study not found' }, { status: 404 }) };
  const rows = await getMilestones(study.id);
  const milestone = rows.find((m) => m.id === id);
  if (!milestone) return { error: NextResponse.json({ error: 'Milestone not found' }, { status: 404 }) };
  return { milestone };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const owned = await findOwnedMilestone(code, id);
  if (owned.error) return owned.error;

  const body = await request.json();
  const data: Parameters<typeof updateMilestone>[1] = {};
  if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;

  await updateMilestone(id, data);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const owned = await findOwnedMilestone(code, id);
  if (owned.error) return owned.error;

  // Decision points fall back to unassigned (SET NULL); per-case rows cascade.
  await deleteMilestone(id);
  return NextResponse.json({ success: true });
}
