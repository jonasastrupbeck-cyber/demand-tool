import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { studyTemplates } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await db.delete(studyTemplates).where(eq(studyTemplates.id, id)).returning({ id: studyTemplates.id });
  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
