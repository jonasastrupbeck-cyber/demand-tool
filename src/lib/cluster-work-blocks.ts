// Phase 4B (2026-04-16) — fuzzy clustering for free-text work-description blocks.
//
// Synthesis helper algorithm (per plan):
//   1. Group blocks by tag (value vs failure separately).
//   2. Compute each block's "canonical form": lowercase → strip punctuation →
//      strip common English stopwords → dedupe → sort tokens → join.
//   3. Exact-match bucket by canonical form.
//   4. Merge buckets whose token-sets have Jaccard similarity >= threshold.
//   5. Return clusters with a suggested label (most-frequent original text),
//      count, up to 5 example texts, and the list of block IDs.
//
// Text-similarity is intentionally simple. Fancier techniques (embeddings,
// TF-IDF cosine, etc.) can come later once there's real data to evaluate.

const STOPWORDS = new Set([
  'the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'and', 'or', 'but',
  'with', 'for', 'is', 'was', 'were', 'be', 'been', 'are', 'am', 'it',
]);

export function normalise(text: string): string {
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w && !STOPWORDS.has(w));
  const dedupedSorted = [...new Set(tokens)].sort();
  return dedupedSorted.join(' ');
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersect = 0;
  for (const x of a) if (b.has(x)) intersect++;
  return intersect / (a.size + b.size - intersect);
}

export interface BlockForClustering {
  id: string;
  text: string;
  tag: 'value' | 'failure';
}

export interface WorkBlockCluster {
  tag: 'value' | 'failure';
  suggestedLabel: string;
  blockCount: number;
  exampleTexts: string[];
  blockIds: string[];
}

export function clusterBlocks(
  blocks: BlockForClustering[],
  opts: { jaccardThreshold?: number } = {}
): WorkBlockCluster[] {
  const threshold = opts.jaccardThreshold ?? 0.6;

  const byTag: Record<'value' | 'failure', BlockForClustering[]> = { value: [], failure: [] };
  for (const b of blocks) byTag[b.tag].push(b);

  const result: WorkBlockCluster[] = [];

  for (const tag of ['value', 'failure'] as const) {
    // Exact-match bucket by canonical form
    const exactBuckets = new Map<string, BlockForClustering[]>();
    for (const b of byTag[tag]) {
      const key = normalise(b.text);
      const bucket = exactBuckets.get(key) ?? [];
      bucket.push(b);
      exactBuckets.set(key, bucket);
    }

    // Convert to { key, blocks, tokens } entries
    const entries = [...exactBuckets.entries()].map(([key, bs]) => ({
      key,
      blocks: bs,
      tokens: new Set(key.split(' ').filter(Boolean)),
    }));

    // Union-find merge via Jaccard similarity
    const parent = entries.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const union = (a: number, b: number): void => {
      const ra = find(a), rb = find(b);
      if (ra !== rb) parent[ra] = rb;
    };

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (find(i) === find(j)) continue;
        if (jaccard(entries[i].tokens, entries[j].tokens) >= threshold) union(i, j);
      }
    }

    // Collect final clusters by root
    const rootToBlocks = new Map<number, BlockForClustering[]>();
    for (let i = 0; i < entries.length; i++) {
      const r = find(i);
      const arr = rootToBlocks.get(r) ?? [];
      arr.push(...entries[i].blocks);
      rootToBlocks.set(r, arr);
    }

    for (const [, cluster] of rootToBlocks) {
      // Suggested label = most-frequent original text in the cluster.
      const freq = new Map<string, number>();
      for (const b of cluster) freq.set(b.text, (freq.get(b.text) ?? 0) + 1);
      const sortedByFreq = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      const suggestedLabel = sortedByFreq[0][0];
      const uniqueTexts = [...new Set(cluster.map(b => b.text))];
      result.push({
        tag,
        suggestedLabel,
        blockCount: cluster.length,
        exampleTexts: uniqueTexts.slice(0, 5),
        blockIds: cluster.map(b => b.id),
      });
    }
  }

  result.sort((a, b) => b.blockCount - a.blockCount);
  return result;
}
