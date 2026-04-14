import { NextResponse } from 'next/server';
import { getStudyByCode, updateStudy, getHandlingTypes, getDemandTypes, getContactMethods, getPointsOfTransaction, getWhatMattersTypes, getWorkTypes, getSystemConditions, seedDefaultWorkTypes } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const [hTypes, dTypes, cMethods, potTypes, wmTypes, wTypes, scTypes] = await Promise.all([
    getHandlingTypes(study.id),
    getDemandTypes(study.id),
    getContactMethods(study.id),
    getPointsOfTransaction(study.id),
    getWhatMattersTypes(study.id),
    getWorkTypes(study.id),
    getSystemConditions(study.id),
  ]);

  return NextResponse.json({
    ...study,
    handlingTypes: hTypes,
    demandTypes: dTypes,
    contactMethods: cMethods,
    pointsOfTransaction: potTypes,
    whatMattersTypes: wmTypes,
    workTypes: wTypes,
    systemConditions: scTypes,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.purpose !== undefined) updates.purpose = body.purpose;
  if (body.oneStopHandlingType !== undefined) updates.oneStopHandlingType = body.oneStopHandlingType;
  if (body.workTrackingEnabled !== undefined) updates.workTrackingEnabled = body.workTrackingEnabled;
  if (body.systemConditionsEnabled !== undefined) updates.systemConditionsEnabled = body.systemConditionsEnabled;
  if (body.demandTypesEnabled !== undefined) updates.demandTypesEnabled = body.demandTypesEnabled;
  if (body.workTypesEnabled !== undefined) updates.workTypesEnabled = body.workTypesEnabled;
  if (body.consultantPin !== undefined) updates.consultantPin = body.consultantPin;

  await updateStudy(study.id, updates);

  // Seed default work types when enabling work tracking for the first time
  if (body.workTrackingEnabled === true) {
    await seedDefaultWorkTypes(study.id, body.locale || 'en');
  }

  return NextResponse.json({ success: true });
}
