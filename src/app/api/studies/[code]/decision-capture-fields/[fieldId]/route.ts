import { NextResponse } from 'next/server';
import { getStudyByCode, getDecisionCaptureFields, getWhatMattersTypes, updateDecisionCaptureField, deleteDecisionCaptureField } from '@/lib/queries';

// Confirm the field belongs to a decision point of this study before mutating.
async function findOwnedField(code: string, fieldId: string) {
  const study = await getStudyByCode(code);
  if (!study) return { error: NextResponse.json({ error: 'Study not found' }, { status: 404 }) };
  const fields = await getDecisionCaptureFields(study.id);
  const field = fields.find((f) => f.id === fieldId);
  if (!field) return { error: NextResponse.json({ error: 'Capture field not found' }, { status: 404 }) };
  return { field, study };
}

// PATCH — label / choiceOptions / linkedWhatMattersTypeId. Kind is immutable
// (a field's shape is fundamental; changing it would strand typed case values).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; fieldId: string }> }
) {
  const { code, fieldId } = await params;
  const owned = await findOwnedField(code, fieldId);
  if (owned.error) return owned.error;

  const body = await request.json();
  const data: Parameters<typeof updateDecisionCaptureField>[1] = {};
  if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
  if (body.choiceOptions !== undefined) {
    data.choiceOptions = typeof body.choiceOptions === 'string' && body.choiceOptions.trim() ? body.choiceOptions.trim() : null;
  }
  if (body.linkedWhatMattersTypeId !== undefined) {
    if (body.linkedWhatMattersTypeId === null || body.linkedWhatMattersTypeId === '') {
      data.linkedWhatMattersTypeId = null;
    } else if (typeof body.linkedWhatMattersTypeId === 'string') {
      const wmTypes = await getWhatMattersTypes(owned.study.id);
      if (!wmTypes.some((w) => w.id === body.linkedWhatMattersTypeId)) {
        return NextResponse.json({ error: 'linkedWhatMattersTypeId must be a what-matters type of this study' }, { status: 400 });
      }
      data.linkedWhatMattersTypeId = body.linkedWhatMattersTypeId;
    }
  }
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;

  await updateDecisionCaptureField(fieldId, data);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; fieldId: string }> }
) {
  const { code, fieldId } = await params;
  const owned = await findOwnedField(code, fieldId);
  if (owned.error) return owned.error;

  // case_decision_values cascade at the DB level (taxonomy-fix philosophy).
  await deleteDecisionCaptureField(fieldId);
  return NextResponse.json({ success: true });
}
