import { NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';

// Server-side consultant-PIN check. The PIN is never sent to the browser (see
// the study GET), so unlocking settings verifies it here instead of comparing
// in the client. Returns { ok } — no PIN value is echoed back.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const pin = typeof body.pin === 'string' ? body.pin : '';
  // No PIN set → any request is "unlocked"; else exact match required.
  const ok = !study.consultantPin || pin === study.consultantPin;
  return NextResponse.json({ ok });
}
