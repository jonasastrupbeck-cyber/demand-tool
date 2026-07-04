import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { studyTemplates } from '@/lib/schema';
import { and, desc, eq } from 'drizzle-orm';
import { getStudyByCode } from '@/lib/queries';
import { snapshotStudySettings } from '@/lib/study-templates';
import { generateId } from '@/lib/utils';

// The template library. GET lists metadata only (the settings blob never
// leaves the server — it's applied by POST /api/studies with a templateId).
export async function GET() {
  const rows = await db
    .select({
      id: studyTemplates.id,
      name: studyTemplates.name,
      systemType: studyTemplates.systemType,
      createdAt: studyTemplates.createdAt,
    })
    .from(studyTemplates)
    .orderBy(desc(studyTemplates.createdAt));
  return NextResponse.json({ templates: rows });
}

// Save a study's settings as a named template. Name is unique per system type;
// without `replace: true` a clash returns 409 so the UI can ask first.
export async function POST(request: Request) {
  const body = await request.json();
  const { studyCode, name, replace } = body;

  if (!studyCode || typeof studyCode !== 'string') {
    return NextResponse.json({ error: 'studyCode is required' }, { status: 400 });
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
  }

  const study = await getStudyByCode(studyCode);
  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const trimmed = name.trim();
  const [existing] = await db
    .select({ id: studyTemplates.id })
    .from(studyTemplates)
    .where(and(eq(studyTemplates.name, trimmed), eq(studyTemplates.systemType, study.systemType)));

  if (existing && !replace) {
    return NextResponse.json(
      { error: 'A template with this name already exists', existingId: existing.id },
      { status: 409 }
    );
  }

  const snapshot = await snapshotStudySettings(study.id);
  const settings = JSON.stringify(snapshot);

  if (existing) {
    await db.update(studyTemplates).set({
      settings,
      snapshotVersion: snapshot.version,
      sourceStudyId: study.id,
      createdAt: new Date(),
    }).where(eq(studyTemplates.id, existing.id));
    return NextResponse.json({ id: existing.id, name: trimmed, systemType: study.systemType });
  }

  const id = generateId();
  await db.insert(studyTemplates).values({
    id,
    name: trimmed,
    systemType: study.systemType,
    snapshotVersion: snapshot.version,
    settings,
    sourceStudyId: study.id,
    createdAt: new Date(),
  });
  return NextResponse.json({ id, name: trimmed, systemType: study.systemType }, { status: 201 });
}
