import { NextResponse } from 'next/server';
import { createStudy } from '@/lib/queries';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description, locale, primaryContactMethod } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Study name is required' }, { status: 400 });
  }

  const validLocale = ['en', 'da', 'sv', 'de'].includes(locale) ? locale : 'en';
  const result = await createStudy(name.trim(), description?.trim() || '', validLocale, primaryContactMethod?.trim() || undefined);
  return NextResponse.json(result, { status: 201 });
}
