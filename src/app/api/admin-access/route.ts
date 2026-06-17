import { NextResponse } from 'next/server';

// C2 (2026-06-17): consultant unlock check for the landing-page "Create study"
// gate. Verifies a submitted secret against CONSULTANT_ADMIN_SECRET without ever
// returning the secret itself. If the env var is unset, creation is not gated
// (configured:false) so existing/dev behaviour is preserved.
export async function POST(request: Request) {
  const requiredSecret = process.env.CONSULTANT_ADMIN_SECRET;

  if (!requiredSecret) {
    return NextResponse.json({ ok: true, configured: false });
  }

  let secret: unknown;
  try {
    ({ secret } = await request.json());
  } catch {
    secret = undefined;
  }

  if (secret === requiredSecret) {
    return NextResponse.json({ ok: true, configured: true });
  }

  return NextResponse.json({ ok: false, configured: true }, { status: 403 });
}
