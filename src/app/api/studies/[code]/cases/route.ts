import { NextResponse } from 'next/server';
import { getStudyByCode, getCases, findOrCreateCase, validateStudyRefs } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  // ?includeArchived=1 → include consultant-archived cases (the Settings "Manage
  // cases" list). Default hides them (switcher, dashboard, export).
  const includeArchived = new URL(request.url).searchParams.get('includeArchived') === '1';
  const result = await getCases(study.id, { includeArchived });
  return NextResponse.json(result);
}

// Find-or-create by caseRef. Two collectors can post the same new ref at the
// same moment; the upsert in findOrCreateCase guarantees one row, and both
// callers get the same case back (Skipton slice 1).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  if (!study.caseTrackingEnabled) {
    return NextResponse.json({ error: 'Case tracking is not enabled for this study' }, { status: 400 });
  }

  const body = await request.json();
  const caseRef = typeof body.caseRef === 'string' ? body.caseRef.trim() : '';
  if (!caseRef) {
    return NextResponse.json({ error: 'caseRef is required' }, { status: 400 });
  }
  if (caseRef.length > 64) {
    return NextResponse.json({ error: 'caseRef is too long' }, { status: 400 });
  }

  let openedAt: Date | undefined;
  if (body.openedAt !== undefined) {
    // Reject null/empty explicitly — new Date(null) is the 1970 epoch and would
    // pass the isNaN check, silently corrupting the case's open date.
    if (body.openedAt === null || body.openedAt === '') {
      return NextResponse.json({ error: 'openedAt is not a valid date' }, { status: 400 });
    }
    const parsed = new Date(body.openedAt);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'openedAt is not a valid date' }, { status: 400 });
    }
    openedAt = parsed;
  }

  const demandTypeId = typeof body.demandTypeId === 'string' ? body.demandTypeId : null;
  if (demandTypeId) {
    const refError = await validateStudyRefs(study.id, { demandTypes: [demandTypeId] });
    if (refError) return NextResponse.json({ error: refError }, { status: 400 });
  }

  const caseRow = await findOrCreateCase(study.id, caseRef, {
    demandTypeId,
    openedAt,
    collectorName: typeof body.collectorName === 'string' ? body.collectorName.trim() || null : null,
  });
  return NextResponse.json(caseRow, { status: 201 });
}
