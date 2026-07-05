import { NextResponse } from 'next/server';
import { getStudyByCode, rowBelongsToStudy, deleteWhatMattersType, updateWhatMattersType, getWhatMattersTypes } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  if (!(await rowBelongsToStudy('whatMattersTypes', id, study.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates: { label?: string; operationalDefinition?: string | null; anchorMilestoneId?: string | null; anchorEvent?: string | null; enabled?: boolean; valueKind?: 'amount' | 'date_or_duration' | null } = {};
  if (typeof body.label === 'string' && body.label.trim()) updates.label = body.label.trim();
  if (body.operationalDefinition !== undefined) updates.operationalDefinition = body.operationalDefinition || null;
  // ASAP anchor (case open → this event) as a token 'milestone:<id>' | 'decision:<id>'.
  // Empty → clear. anchorMilestoneId kept for the legacy milestone-only field.
  if (body.anchorEvent !== undefined) updates.anchorEvent = body.anchorEvent || null;
  if (body.anchorMilestoneId !== undefined) updates.anchorMilestoneId = body.anchorMilestoneId || null;
  // 2026-07-02: capture toggle + structured ask kind.
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
    }
    updates.enabled = body.enabled;
  }
  if (body.valueKind !== undefined) {
    if (body.valueKind !== null && body.valueKind !== 'amount' && body.valueKind !== 'date_or_duration') {
      return NextResponse.json({ error: 'valueKind must be null, "amount" or "date_or_duration"' }, { status: 400 });
    }
    // Timed standard types keep their timing semantics — no structured ask.
    const types = await getWhatMattersTypes(study.id);
    const row = types.find((t) => t.id === id);
    if (row?.timing) {
      return NextResponse.json({ error: 'valueKind cannot be set on a timed standard type' }, { status: 409 });
    }
    updates.valueKind = body.valueKind;
  }

  await updateWhatMattersType(id, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  if (!(await rowBelongsToStudy('whatMattersTypes', id, study.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    await deleteWhatMattersType(id);
  } catch (err) {
    // The two standard timed types are protected (see deleteWhatMattersType).
    if (err instanceof Error && err.message === 'PROTECTED_STANDARD_TYPE') {
      return NextResponse.json({ error: 'This is a standard type and cannot be deleted.' }, { status: 409 });
    }
    throw err;
  }
  return new Response(null, { status: 204 });
}
