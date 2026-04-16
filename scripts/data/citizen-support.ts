/**
 * Seed data: a public-services "Citizen Support Service" study.
 *
 * Designed to exercise Phase 2 + 3 features (Life Problem, SC Helps/Hinders
 * with dimension, Thinking + Logic) AND the lifecycle Sankey — every entry's
 * combination of fields is meant to hold together as a Vanguard Method
 * narrative, not random labels.
 *
 * Source material: "Top 20 demands in context" from Richard Davis,
 * *Responsibility and Public Services* (Triarchy Press) — the Stoke LAC data.
 * See: 03-Resources/book-notes/responsibility-and-public-services.md in the
 * vault.
 */

export const STUDY_CONFIG = {
  name: 'Citizen Support Service (test)',
  description:
    'Three-week demand study of a local citizen support service. ' +
    'Goal: understand what citizens actually need and distinguish value ' +
    'demand from failure demand caused when the system does not respond ' +
    'to context. Life problems drawn from Stoke Local Area Coordination.',
  purpose:
    'Help citizens get their lives back in balance by responding to what ' +
    'matters to them — not by pushing them through our service categories.',
  locale: 'en' as const,
};

// ── Taxonomies ──

// Value demand types (what citizens actually need from us)
export const VALUE_DEMAND_TYPES = [
  { label: 'Ask for information / advice',   stage: 'First contact' },
  { label: 'Request help with a problem',    stage: 'Getting help' },
  { label: 'Request access to a service',    stage: 'Triage / assessment' },
  { label: 'Request a review of a decision', stage: 'Triage / assessment' },
  { label: 'Update my details',              stage: 'Follow-up / ongoing' },
];

// Failure demand types (contact patterns caused by system failure)
export const FAILURE_DEMAND_TYPES = [
  { label: 'Chasing progress',           stage: 'Follow-up / ongoing' },
  { label: 'Repeating information',      stage: 'First contact' },
  { label: 'Complaint about service',    stage: 'Follow-up / ongoing' },
  { label: 'Passed between agencies',    stage: 'Triage / assessment' },
  { label: 'Query about a refusal',      stage: 'Triage / assessment' },
  { label: 'Seeking reconsideration',    stage: 'Resolution' },
];

export const HANDLING_TYPES = [
  'One Stop',
  'Passed to another agency',
  'Passed back to citizen',
  'Escalated',
];

export const EXTRA_CONTACT_METHODS = ['Letter', 'Online form'];
// Defaults already created: Phone, Mail, Face2face

export const POINTS_OF_TRANSACTION = [
  'Call centre',
  'Front desk reception',
  'Case worker visit',
  'Community hub',
  'Online portal',
];

export const WHAT_MATTERS_TYPES = [
  'Listen to my situation',
  "Don't make me repeat myself",
  'Act quickly when it matters',
  'Treat me as a person',
  'Keep me informed',
  'Help me take control',
];

// Life problems — from Stoke Top 20 (Richard Davis)
export const LIFE_PROBLEMS = [
  'Help me to get/keep employment',
  'Help me to move to a more suitable property',
  'Help me to manage my finances',
  'Help me to claim the benefits I am entitled to',
  'Help me with my debts',
  'Help me to deal with my addiction',
  'Help me with my mental health',
  'Help me to keep my home',
  'Help me to get necessary repairs to my property',
  'Help me to keep my children safe',
];

// System conditions — from the customer's point of view. Most are
// negatively-framed system dysfunctions (can only HINDER the customer's
// purpose); one is positively framed so some entries can legitimately
// tag it as HELPS. See Ali feedback 2026-04-16: "Helps" only ever means
// helps the customer's purpose, never the organisation's.
export const SYSTEM_CONDITIONS = [
  'Fragmented services require multiple handoffs',                  // 0
  'Eligibility gates at each agency',                               // 1
  'No single record of the citizen across agencies',                // 2
  'Professional labels applied out of context',                     // 3
  'SLA targets cause premature case closure',                       // 4
  'No proactive status updates are sent',                           // 5
  'Staff lack authority to resolve without approval',               // 6
  'Service categories define the response, not the person',         // 7
  'Generalist "understand me" role does not exist',                 // 8
  'Staff empowered to act on what they hear',                       // 9 — positive framing; can be tagged as HELPS
];

// Thinkings — management beliefs that produce the system conditions above
export const THINKINGS = [
  'We must control who gets what',
  'Standardise the response',
  'Transactions are manageable, context is not',
  'Experts know what the citizen needs',
  'Meet the target',
];

export const LIFECYCLE_STAGES = [
  'First contact',
  'Triage / assessment',
  'Getting help',
  'Follow-up / ongoing',
  'Resolution',
];

// ── Entry generation ──

const COLLECTORS = ['Alex', 'Priya', 'Mia', 'Tom', 'Sara', 'Ben'];

// A scenario is one coherent demand pattern. Each scenario may be instantiated
// multiple times (different customers, dates, collectors, small wording tweaks)
// so that the study shows realistic volume without losing logical coherence.
interface Scenario {
  verbatim: string;
  classification: 'value' | 'failure' | 'unknown';
  demandType: string;
  handling: string;
  contactMethod: string;
  pointOfTransaction: string;
  whatMatters: string;
  lifeProblem: string;
  originalValueDemand?: string;
  // SC labels. "Helps" is only ever about helping the CUSTOMER's purpose.
  scHinders?: string[];
  scHelps?: string[];
  // Per-pair thinking + logic (why this thinking applies to this demand)
  thinkings?: Array<{ label: string; logic: string }>;
  whatMattersNotes?: string;
  count: number;
}

const S = SYSTEM_CONDITIONS;
const T = THINKINGS;

// ── 20 scenarios → ~100 entries when multiplied by their counts ──

export const SCENARIOS: Scenario[] = [
  // ── Life Problem: Help me with my debts ──
  {
    verbatim: 'I need some advice on how to deal with my debts. Who should I talk to?',
    classification: 'value',
    demandType: 'Ask for information / advice',
    handling: 'One Stop',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Listen to my situation',
    lifeProblem: 'Help me with my debts',
    count: 6,
  },
  {
    verbatim: 'I called last week about my debts and was promised a callback. No one has rung.',
    classification: 'failure',
    demandType: 'Chasing progress',
    handling: 'Passed to another agency',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Keep me informed',
    lifeProblem: 'Help me with my debts',
    originalValueDemand: 'Ask for information / advice',
    scHinders: [S[5], S[0]], // No proactive updates; Fragmented services
    thinkings: [
      {
        label: T[4], // Meet the target
        logic: 'The advice line tracks first-contact SLA but not whether the promised callback actually happened — so the callback queue is invisible to managers.',
      },
    ],
    whatMattersNotes: 'Caller said: "I feel like I have been forgotten."',
    count: 5,
  },
  {
    verbatim: 'I was told to call the money advice team and they said to call back here. I have been passed four times.',
    classification: 'failure',
    demandType: 'Passed between agencies',
    handling: 'Passed back to citizen',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: "Don't make me repeat myself",
    lifeProblem: 'Help me with my debts',
    originalValueDemand: 'Ask for information / advice',
    scHinders: [S[0], S[2]], // Fragmented services; No single record
    thinkings: [
      {
        label: T[1], // Standardise the response
        logic: 'Each team follows its own script and eligibility check — nothing ties them together, so the caller has to repeat context at every handoff.',
      },
    ],
    count: 3,
  },

  // ── Life Problem: Help me to claim the benefits I am entitled to ──
  {
    verbatim: 'Can you tell me what benefits I might qualify for? I have just lost my job.',
    classification: 'value',
    demandType: 'Ask for information / advice',
    handling: 'One Stop',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Listen to my situation',
    lifeProblem: 'Help me to claim the benefits I am entitled to',
    count: 5,
  },
  {
    verbatim: 'My benefit claim was refused. I think the decision is wrong — I need it reviewed.',
    classification: 'failure',
    demandType: 'Query about a refusal',
    handling: 'Escalated',
    contactMethod: 'In person',
    pointOfTransaction: 'Front desk reception',
    whatMatters: 'Act quickly when it matters',
    lifeProblem: 'Help me to claim the benefits I am entitled to',
    originalValueDemand: 'Request access to a service',
    scHinders: [S[1], S[7]], // Eligibility gates; Service categories define the response
    thinkings: [
      {
        label: T[0], // We must control who gets what
        logic: 'Eligibility criteria are designed to reduce volume, not to capture real need, so legitimate claims get refused on technicalities.',
      },
    ],
    whatMattersNotes: 'Customer brought their paperwork twice — staff had to ask for documents again because previous notes were not visible.',
    count: 5,
  },
  {
    verbatim: 'It has been three weeks since I applied for the benefit. I have heard nothing.',
    classification: 'failure',
    demandType: 'Chasing progress',
    handling: 'Passed to another agency',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Keep me informed',
    lifeProblem: 'Help me to claim the benefits I am entitled to',
    originalValueDemand: 'Request access to a service',
    scHinders: [S[5]],
    count: 3,
  },

  // ── Life Problem: Help me with my mental health ──
  {
    verbatim: 'I am really struggling at the moment. I do not know where to turn. Can someone help?',
    classification: 'value',
    demandType: 'Request help with a problem',
    handling: 'One Stop',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Listen to my situation',
    lifeProblem: 'Help me with my mental health',
    count: 5,
  },
  {
    verbatim: 'I was referred to the mental health team three months ago. I have heard nothing back.',
    classification: 'failure',
    demandType: 'Chasing progress',
    handling: 'Passed to another agency',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: "Don't make me repeat myself",
    lifeProblem: 'Help me with my mental health',
    originalValueDemand: 'Request access to a service',
    scHinders: [S[0], S[1]],
    thinkings: [
      {
        label: T[3], // Experts know what the citizen needs
        logic: 'Specialist triage gates access, so the citizen waits in a queue instead of getting any response at all.',
      },
    ],
    count: 5,
  },
  {
    verbatim: 'I told the mental health nurse my whole story last week and today I had to tell it all again to a different person.',
    classification: 'failure',
    demandType: 'Repeating information',
    handling: 'Passed to another agency',
    contactMethod: 'In person',
    pointOfTransaction: 'Case worker visit',
    whatMatters: "Don't make me repeat myself",
    lifeProblem: 'Help me with my mental health',
    originalValueDemand: 'Request help with a problem',
    scHinders: [S[2], S[3]], // No single record; Professional labels out of context
    thinkings: [
      {
        label: T[2], // Transactions are manageable, context is not
        logic: 'Each professional records only the transaction they are responsible for — no one holds the whole story, so the citizen is the only one who does.',
      },
    ],
    count: 3,
  },

  // ── Life Problem: Help me to keep my home ──
  {
    verbatim: 'I have had an eviction notice. I need advice on what I can do.',
    classification: 'value',
    demandType: 'Request help with a problem',
    handling: 'One Stop',
    contactMethod: 'In person',
    pointOfTransaction: 'Front desk reception',
    whatMatters: 'Act quickly when it matters',
    lifeProblem: 'Help me to keep my home',
    count: 5,
  },
  {
    verbatim: 'I spoke to housing last week about an eviction. Nothing has happened and I have two days left.',
    classification: 'failure',
    demandType: 'Chasing progress',
    handling: 'Escalated',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Act quickly when it matters',
    lifeProblem: 'Help me to keep my home',
    originalValueDemand: 'Request help with a problem',
    scHinders: [S[6], S[0]], // Staff lack authority; Fragmented services
    thinkings: [
      {
        label: T[1], // Standardise the response
        logic: 'Any housing action requires sign-off from multiple teams and nobody will act until all boxes are ticked — so urgency has nowhere to go.',
      },
    ],
    whatMattersNotes: 'Citizen asked twice whether someone would "actually do something". Tone was exhausted, not angry.',
    count: 4,
  },

  // ── Life Problem: Help me to get necessary repairs to my property ──
  {
    verbatim: 'I need a repair booked — my heating has failed and it is freezing.',
    classification: 'value',
    demandType: 'Request help with a problem',
    handling: 'One Stop',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Act quickly when it matters',
    lifeProblem: 'Help me to get necessary repairs to my property',
    count: 6,
  },
  {
    verbatim: 'The repair was booked three weeks ago. Nobody has come. My kids are cold.',
    classification: 'failure',
    demandType: 'Chasing progress',
    handling: 'Passed to another agency',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Keep me informed',
    lifeProblem: 'Help me to get necessary repairs to my property',
    originalValueDemand: 'Request help with a problem',
    scHinders: [S[5], S[4]], // No proactive updates; SLA targets cause premature closure
    thinkings: [
      {
        label: T[4], // Meet the target
        logic: 'Jobs are "closed" when passed to the contractor — so the SLA looks green while the actual repair has not happened.',
      },
    ],
    count: 5,
  },

  // ── Life Problem: Help me to get/keep employment ──
  {
    verbatim: 'Could someone help me with my CV and look at some job applications with me?',
    classification: 'value',
    demandType: 'Request help with a problem',
    handling: 'One Stop',
    contactMethod: 'In person',
    pointOfTransaction: 'Community hub',
    whatMatters: 'Help me take control',
    lifeProblem: 'Help me to get/keep employment',
    count: 5,
  },
  {
    verbatim: 'I have been to the employment service four times. Different person every time. I have had enough.',
    classification: 'failure',
    demandType: 'Complaint about service',
    handling: 'Escalated',
    contactMethod: 'In person',
    pointOfTransaction: 'Front desk reception',
    whatMatters: 'Treat me as a person',
    lifeProblem: 'Help me to get/keep employment',
    originalValueDemand: 'Request help with a problem',
    scHinders: [S[2], S[8]], // No single record; Generalist role does not exist
    thinkings: [
      {
        label: T[2], // Transactions are manageable, context is not
        logic: 'Each appointment is treated as a transaction rather than a continuation — so nobody holds the relationship.',
      },
    ],
    count: 3,
  },

  // ── Life Problem: Help me to manage my finances ──
  {
    verbatim: 'I want to understand my council tax bill — I think I am being overcharged.',
    classification: 'value',
    demandType: 'Ask for information / advice',
    handling: 'One Stop',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Listen to my situation',
    lifeProblem: 'Help me to manage my finances',
    count: 5,
  },
  {
    verbatim: 'I called about my council tax last month. They said they would get back to me. Nothing.',
    classification: 'failure',
    demandType: 'Chasing progress',
    handling: 'Passed to another agency',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Keep me informed',
    lifeProblem: 'Help me to manage my finances',
    originalValueDemand: 'Ask for information / advice',
    scHinders: [S[5]],
    count: 3,
  },

  // ── Life Problem: Help me to move to a more suitable property ──
  {
    verbatim: 'My current place is not suitable any more — stairs are too much. Is there a way to move?',
    classification: 'value',
    demandType: 'Request access to a service',
    handling: 'Passed to another agency',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Listen to my situation',
    lifeProblem: 'Help me to move to a more suitable property',
    scHinders: [S[8]], // Generalist role does not exist — value demand passed on because no one can hold it
    scHelps:   [S[9]], // Front-line person DID hear the need and route it correctly — staff empowered to act
    thinkings: [
      {
        label: T[3], // Experts know what the citizen needs
        logic: 'The front line is not empowered to assess housing suitability — it must be passed to a specialist queue.',
      },
    ],
    count: 4,
  },

  // ── Life Problem: Help me to deal with my addiction ──
  {
    verbatim: 'I am trying to come off alcohol. I need someone to talk to.',
    classification: 'value',
    demandType: 'Request help with a problem',
    handling: 'One Stop',
    contactMethod: 'In person',
    pointOfTransaction: 'Community hub',
    whatMatters: 'Listen to my situation',
    lifeProblem: 'Help me to deal with my addiction',
    count: 4,
  },
  {
    verbatim: 'They told me I am not eligible for the addiction programme because I missed an appointment.',
    classification: 'failure',
    demandType: 'Seeking reconsideration',
    handling: 'Escalated',
    contactMethod: 'In person',
    pointOfTransaction: 'Front desk reception',
    whatMatters: 'Treat me as a person',
    lifeProblem: 'Help me to deal with my addiction',
    originalValueDemand: 'Request access to a service',
    scHinders: [S[1], S[7]], // Eligibility gates; Service categories define response
    thinkings: [
      {
        label: T[0], // We must control who gets what
        logic: 'Missing an appointment is taken as disengagement rather than a symptom of the addiction itself — the eligibility rule pushes the citizen away at the exact moment they reached out.',
      },
    ],
    count: 3,
  },

  // ── Life Problem: Help me to keep my children safe ──
  {
    verbatim: 'I am worried about my kids\u2019 safety at home. Who do I speak to?',
    classification: 'value',
    demandType: 'Ask for information / advice',
    handling: 'Escalated',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: 'Act quickly when it matters',
    lifeProblem: 'Help me to keep my children safe',
    scHelps: [S[9]], // The front-line person heard the concern and escalated immediately — "Staff empowered to act on what they hear" helps the customer's purpose
    count: 4,
  },

  // ── Update my details (simple value) ──
  {
    verbatim: 'I need to update my address on my file.',
    classification: 'value',
    demandType: 'Update my details',
    handling: 'One Stop',
    contactMethod: 'Online form',
    pointOfTransaction: 'Online portal',
    whatMatters: 'Help me take control',
    lifeProblem: 'Help me to manage my finances',
    count: 6,
  },

  // ── Unknown / unclassified ──
  {
    verbatim: 'Can you just pass a message to my case worker? She knows what I mean.',
    classification: 'unknown',
    demandType: '',
    handling: 'One Stop',
    contactMethod: 'Phone',
    pointOfTransaction: 'Call centre',
    whatMatters: '',
    lifeProblem: '',
    count: 3,
  },
];

// ── Date spread ──

function generateDates(count: number): string[] {
  const start = new Date();
  start.setDate(start.getDate() - 21);
  start.setHours(9, 0, 0, 0);

  const weekdays: Date[] = [];
  const cur = new Date(start);
  while (weekdays.length < 16) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) weekdays.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  // Distribute count entries across weekdays roughly evenly, with some jitter.
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const day = weekdays[i % weekdays.length];
    const d = new Date(day);
    d.setHours(9 + Math.floor(Math.random() * 8));
    d.setMinutes(Math.floor(Math.random() * 60));
    dates.push(d.toISOString());
  }
  return dates;
}

// Expand scenarios into concrete entries, with dates + collectors assigned.
export const ENTRIES = (() => {
  // Flatten all scenario instances
  const flat: Array<Scenario & { _idx: number }> = [];
  let idx = 0;
  for (const s of SCENARIOS) {
    for (let i = 0; i < s.count; i++) {
      flat.push({ ...s, _idx: idx++ });
    }
  }
  // Shuffle deterministically so dates + collectors interleave scenarios
  const ordered = [...flat].sort((a, b) => (a._idx * 7 + 31) % flat.length - (b._idx * 7 + 31) % flat.length);
  const dates = generateDates(ordered.length);

  return ordered.map((s, i) => ({
    date: dates[i],
    entryType: 'Demand',
    verbatim: s.verbatim,
    classification: s.classification,
    demandType: s.demandType,
    handling: s.handling,
    contactMethod: s.contactMethod,
    pointOfTransaction: s.pointOfTransaction,
    whatMattersCategory: s.whatMatters,
    originalValueDemand: s.originalValueDemand || '',
    failureCause: '',
    whatMattersNotes: s.whatMattersNotes || '',
    collector: COLLECTORS[i % COLLECTORS.length],
    lifeProblem: s.lifeProblem,
    scHinders: (s.scHinders || []).join('; '),
    scHelps:   (s.scHelps   || []).join('; '),
    thinkings: (s.thinkings || [])
      .map(t => `${t.label}: ${t.logic}`)
      .join('; '),
  }));
})();
