import Anthropic from '@anthropic-ai/sdk';

// Brief stage descriptions sourced from the Vanguard Method (tVM) Customer Lifecycle.
// Used in the system prompt so the model can reason about which stage a type label belongs to.
export const STANDARD_LIFECYCLE_STAGES: ReadonlyArray<{ code: string; label: string; description: string }> = [
  { code: 'attract', label: 'Attract', description: 'The customer becomes aware that a product or service exists. Marketing, awareness, intermediary relationships.' },
  { code: 'acquire', label: 'Acquire', description: 'The customer tries to become a customer. Application, onboarding, underwriting, signup, setup.' },
  { code: 'live_with', label: 'Live With', description: 'The customer has the product and is living with it day to day. Premium collection, ongoing use, billing, account maintenance, ad-hoc payment issues.' },
  { code: 'look_after', label: 'Look After', description: 'Something changes in the customer\'s life and the system needs to respond. Change of address, change of circumstances, questions about cover, updating personal details.' },
  { code: 'grow_keep', label: 'Grow / Keep', description: 'The relationship deepens. Cross-sell, upgrades, renewals, loyalty, recommendations.' },
  { code: 'help_me_leave', label: 'Help Me Leave', description: 'The customer wants to end the relationship, or life forces it. Cancellation, transfer, closure, claims, bereavement.' },
];

const SYSTEM_PROMPT = `You are an expert in the Vanguard Method, classifying demand and work types into stages of the Customer Lifecycle (tVM).

The six standard stages are:

${STANDARD_LIFECYCLE_STAGES.map((s, i) => `${i + 1}. ${s.label} (code: \`${s.code}\`) — ${s.description}`).join('\n')}

You will be given the LABEL of a single demand type or work type from a Vanguard study (no customer verbatim, no extra context). Decide which stage it most naturally belongs to.

Rules:
- Reply ONLY with a single JSON object, no prose, no markdown fences.
- Schema: { "stageCode": string | null, "confidence": number, "rationale": string }
- "stageCode" must be one of the codes provided to you (the study may have a custom subset). If unsure, return null.
- "confidence" is 0.0–1.0.
- "rationale" is one short sentence (max 20 words).`;

export interface ClassifyOptions {
  apiKey?: string;
  model?: string;
}

export interface ClassifyResult {
  stageCode: string | null;
  confidence: number;
  rationale: string;
}

/**
 * Classify a demand/work type label into a lifecycle stage.
 * IMPORTANT: only the type label is sent to the model — never customer verbatims.
 */
export async function classifyTypeStage(
  typeLabel: string,
  availableStageCodes: string[],
  opts: ClassifyOptions = {}
): Promise<ClassifyResult> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  const client = new Anthropic({ apiKey });
  const model = opts.model ?? 'claude-haiku-4-5-20251001';

  const userPrompt = `Available stage codes for this study: ${JSON.stringify(availableStageCodes)}

Type label to classify: ${JSON.stringify(typeLabel)}

Respond with the JSON object only.`;

  const response = await client.messages.create({
    model,
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  // Strip optional markdown fences just in case.
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed: ClassifyResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { stageCode: null, confidence: 0, rationale: 'AI response was not valid JSON' };
  }

  // Validate
  if (parsed.stageCode !== null && !availableStageCodes.includes(parsed.stageCode)) {
    return { stageCode: null, confidence: 0, rationale: `AI returned unknown stage: ${parsed.stageCode}` };
  }
  return {
    stageCode: parsed.stageCode ?? null,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    rationale: typeof parsed.rationale === 'string' ? parsed.rationale : '',
  };
}
