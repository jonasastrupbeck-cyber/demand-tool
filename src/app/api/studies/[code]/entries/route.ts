import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode, createEntry, getEntries, getEntryCountToday } from '@/lib/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

  const entries = await getEntries(study.id, from, to);
  const todayCount = await getEntryCountToday(study.id);

  return NextResponse.json({ entries, todayCount });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const body = await request.json();

  if (!study.volumeMode && (!body.verbatim || typeof body.verbatim !== 'string')) {
    return NextResponse.json({ error: 'Demand verbatim is required' }, { status: 400 });
  }

  if (!body.classification || !['value', 'failure', 'unknown'].includes(body.classification)) {
    return NextResponse.json({ error: 'Classification must be "value", "failure", or "unknown"' }, { status: 400 });
  }

  const entryType = body.entryType === 'work' ? 'work' : 'demand';

  const id = await createEntry(study.id, {
    verbatim: (body.verbatim || '').trim(),
    classification: body.classification,
    entryType,
    handlingTypeId: body.handlingTypeId || undefined,
    demandTypeId: body.demandTypeId || undefined,
    contactMethodId: body.contactMethodId || undefined,
    pointOfTransactionId: body.pointOfTransactionId || undefined,
    whatMattersTypeId: body.whatMattersTypeId || undefined,
    whatMattersTypeIds: Array.isArray(body.whatMattersTypeIds) ? body.whatMattersTypeIds : undefined,
    systemConditionIds: Array.isArray(body.systemConditionIds) ? body.systemConditionIds : undefined,
    originalValueDemandTypeId: body.originalValueDemandTypeId || undefined,
    workTypeId: body.workTypeId || undefined,
    linkedValueDemandEntryId: body.linkedValueDemandEntryId || undefined,
    failureCause: body.failureCause?.trim() || undefined,
    whatMatters: body.whatMatters?.trim() || undefined,
    collectorName: body.collectorName?.trim() || undefined,
  });

  return NextResponse.json({ id }, { status: 201 });
}
