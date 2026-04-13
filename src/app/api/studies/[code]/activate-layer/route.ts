import { NextResponse } from 'next/server';
import { getStudyByCode, activateLayer } from '@/lib/queries';

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
  const { pin, targetLayer } = body;

  if (study.consultantPin && pin !== study.consultantPin) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
  }

  if (typeof targetLayer !== 'number' || targetLayer < 2 || targetLayer > 5) {
    return NextResponse.json({ error: 'Invalid target layer' }, { status: 400 });
  }

  if (targetLayer !== study.activeLayer + 1) {
    return NextResponse.json({ error: 'Can only activate the next layer' }, { status: 400 });
  }

  await activateLayer(study.id, targetLayer);

  return NextResponse.json({ success: true, activeLayer: targetLayer });
}
