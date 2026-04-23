import { NextResponse } from 'next/server';
import { getStudyByCode, getOrphanWorkBlocks, promoteWorkStepFromCluster } from '@/lib/queries';
import { clusterBlocks } from '@/lib/cluster-work-blocks';

// Phase 4B (2026-04-16) — Synthesis endpoint.
// GET  — returns clusters of orphan free-text Flow blocks for this study.
// POST — promotes one cluster to a new Work Step Type and bulk-updates the
//        matching blocks to reference it.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const orphans = await getOrphanWorkBlocks(study.id);

  // Safety: cap the clustering input to avoid runaway O(N²) on huge studies.
  // 5000 is well beyond any realistic Check phase.
  const capped = orphans.slice(0, 5000);
  const clusters = clusterBlocks(capped);

  return NextResponse.json({
    totalOrphans: orphans.length,
    consideredForClustering: capped.length,
    clusters,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  if (!body.label || typeof body.label !== 'string' || !body.label.trim()) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }
  if (body.tag !== 'value' && body.tag !== 'sequence' && body.tag !== 'failure') {
    return NextResponse.json({ error: "Tag must be 'value', 'sequence' or 'failure'" }, { status: 400 });
  }
  if (!Array.isArray(body.blockIds) || !body.blockIds.every((id: unknown) => typeof id === 'string')) {
    return NextResponse.json({ error: 'blockIds must be an array of strings' }, { status: 400 });
  }

  const id = await promoteWorkStepFromCluster(study.id, {
    label: body.label.trim(),
    tag: body.tag,
    operationalDefinition: typeof body.operationalDefinition === 'string' ? body.operationalDefinition.trim() : undefined,
    blockIds: body.blockIds,
  });

  return NextResponse.json({ id }, { status: 201 });
}
