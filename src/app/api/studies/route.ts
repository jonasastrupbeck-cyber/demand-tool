import { NextResponse } from 'next/server';
import { createStudy } from '@/lib/queries';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description, locale, primaryContactMethod, pointOfTransaction, consultantPin } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Study name is required' }, { status: 400 });
  }

  const validLocale = ['en', 'da', 'sv', 'de'].includes(locale) ? locale : 'en';
  const pin = consultantPin?.trim() || undefined;
  const result = await createStudy(name.trim(), description?.trim() || '', validLocale, primaryContactMethod?.trim() || undefined, pointOfTransaction?.trim() || undefined, false, pin);
  return NextResponse.json(result, { status: 201 });
}
