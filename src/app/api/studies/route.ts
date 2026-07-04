import { NextResponse } from 'next/server';
import { createStudy } from '@/lib/queries';
import { db } from '@/lib/db';
import { studyTemplates } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createStudyFromTemplate, parseSnapshot } from '@/lib/study-templates';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description, locale, primaryContactMethod, pointOfTransaction, consultantPin, templateId } = body;

  // C2 (2026-06-17): study creation is a consultant action. When
  // CONSULTANT_ADMIN_SECRET is configured, the request must carry the matching
  // adminSecret. If the env var is unset, creation stays open (backward
  // compatible) — the gate is opt-in by setting the secret in the environment.
  const requiredSecret = process.env.CONSULTANT_ADMIN_SECRET;
  if (requiredSecret && body.adminSecret !== requiredSecret) {
    return NextResponse.json({ error: 'Study creation is restricted to consultants' }, { status: 403 });
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Study name is required' }, { status: 400 });
  }

  const validLocale = ['en', 'da', 'sv', 'de'].includes(locale) ? locale : 'en';
  const pin = consultantPin?.trim() || undefined;

  // Templates (0052): a chosen template is authoritative for everything except
  // name/description/PIN — systemType, taxonomies, milestones and toggles all
  // come from the snapshot, and none of the locale-based default seeding runs.
  if (templateId) {
    if (typeof templateId !== 'string') {
      return NextResponse.json({ error: 'Invalid templateId' }, { status: 400 });
    }
    const [template] = await db.select().from(studyTemplates).where(eq(studyTemplates.id, templateId));
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    const snapshot = parseSnapshot(template.settings);
    const result = await createStudyFromTemplate({
      name: name.trim(),
      description: description?.trim() || undefined,
      consultantPin: pin,
      snapshot,
    });
    return NextResponse.json(result, { status: 201 });
  }

  // System type (2026-06-11): 'flow' = case-first layout + additive preset.
  const systemType = body.systemType === 'flow' ? 'flow' : 'transactional';
  const result = await createStudy(name.trim(), description?.trim() || '', validLocale, primaryContactMethod?.trim() || undefined, pointOfTransaction?.trim() || undefined, false, pin, systemType);
  return NextResponse.json(result, { status: 201 });
}
