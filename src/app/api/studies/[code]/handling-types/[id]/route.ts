import { NextResponse } from 'next/server';
import { getStudyByCode, deleteHandlingType } from '@/lib/queries';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  await deleteHandlingType(id);
  return new Response(null, { status: 204 });
}
