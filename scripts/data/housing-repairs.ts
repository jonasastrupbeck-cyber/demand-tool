// Study B: Housing Repairs Service — 80 demand + 40 work = 120 entries
// Vanguard Method demand + work analysis for a local authority housing repairs service

export const STUDY_CONFIG = {
  name: 'Housing Repairs Service',
  description: 'Demand and work analysis of a local authority housing repairs service — 3-week study. Includes work tracking to understand how failure demand creates failure work.',
  purpose: 'Understand the nature of tenant demand hitting the repairs service, how much is failure demand caused by system design, and how failure demand creates failure work for staff.',
  locale: 'en' as const,
  workTrackingEnabled: true,
};

// ── Types to configure ──

export const VALUE_DEMAND_TYPES = [
  'Report a new repair',
  'Request emergency repair',
  'Book appointment for inspection',
  'Request adaptation / modification',
  'Annual gas safety check booking',
];

export const FAILURE_DEMAND_TYPES = [
  "Chasing repair that wasn't completed",
  'Missed appointment — reschedule',
  'Repeat repair — same problem back',
  'Chasing parts on order',
  'Complaint about quality of work',
  'Wrong contractor sent',
  'Querying when inspection will happen',
];

export const HANDLING_TYPES = [
  'One Stop',
  'Follow-up required',
  'Referred to contractor',
  'Escalated to manager',
];

export const CONTACT_METHODS = [
  'Phone',
  'Mail',
  'Face2face',
  'Online portal',
];

export const POINTS_OF_TRANSACTION = [
  'Repairs call centre',
  'Local housing office',
  'Estate caretaker',
  'Online portal',
];

export const WHAT_MATTERS_TYPES = [
  'Fix it right first time',
  'Turn up when you say you will',
  'Keep me informed',
  'Understand the urgency',
  "Don't make me chase",
  'Listen to what I am telling you',
];

export const WORK_TYPES = [
  'Scheduling / diary management',
  'Raising purchase orders',
  'Chasing contractor for update',
  'Updating case notes',
  'Rework — rebooking failed repair',
  'Management reporting',
  'Internal process query',
];

// ── System conditions ──

const SC = {
  noVisibility: 'No real-time visibility of contractor schedules',
  remoteDiagnosis: 'Diagnosis done remotely without inspection',
  partsDelay: 'Parts ordering process adds 2-week delay',
  noFirstFix: 'First-visit fix rate not measured',
  vagueSlots: 'Appointment slots too vague (AM/PM only)',
  noAutoUpdates: 'No automated status updates to tenants',
  volumeIncentive: 'Contractor incentivised on volume not quality',
  wrongCategories: "Repairs categorisation doesn't match tenant language",
};

// ── Dates and collectors ──

function generateDates(count: number): string[] {
  const start = new Date();
  start.setDate(start.getDate() - 21);
  start.setHours(8, 0, 0, 0);

  const weekdays: Date[] = [];
  const d = new Date(start);
  while (weekdays.length < 15) {
    if (d.getDay() >= 1 && d.getDay() <= 5) {
      weekdays.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }

  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const day = weekdays[i % weekdays.length];
    const hours = 8 + Math.floor(Math.random() * 9);
    const mins = Math.floor(Math.random() * 60);
    const date = new Date(day);
    date.setHours(hours, mins, Math.floor(Math.random() * 60), 0);
    dates.push(date.toISOString());
  }

  return dates.sort();
}

const collectors = ['Karen L', 'Dave S', 'Maria P'];
function collector(i: number) { return collectors[i % collectors.length]; }

// ── Entries ──

interface Entry {
  date: string;
  entryType: 'demand' | 'work';
  verbatim: string;
  classification: 'value' | 'failure' | '?';
  demandType: string;
  workType: string;
  handling: string;
  contactMethod: string;
  pointOfTransaction: string;
  whatMattersCategory: string;
  originalValueDemand: string;
  failureCause: string;
  whatMattersNotes: string;
  collector: string;
}

const dates = generateDates(120);

export const ENTRIES: Entry[] = [
  // ═══════════════════════════════════════════
  // DEMAND: VALUE (28 entries)
  // ═══════════════════════════════════════════

  // Report a new repair — 10 entries
  { date: dates[0], entryType: 'demand', verbatim: 'My kitchen tap is leaking badly, water is going everywhere', classification: 'value', demandType: 'Report a new repair', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Needs it fixed properly the first time — had a bad experience before', collector: collector(0) },
  { date: dates[1], entryType: 'demand', verbatim: 'The front door lock is broken — I cannot secure my home', classification: 'value', demandType: 'Report a new repair', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Understand the urgency', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Security issue — feels unsafe', collector: collector(1) },
  { date: dates[2], entryType: 'demand', verbatim: 'There is damp coming through the bedroom wall', classification: 'value', demandType: 'Report a new repair', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Worried about mould affecting children', collector: collector(2) },
  { date: dates[3], entryType: 'demand', verbatim: 'The toilet is not flushing properly', classification: 'value', demandType: 'Report a new repair', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },
  { date: dates[4], entryType: 'demand', verbatim: 'I have a broken window in the living room — the seal has gone', classification: 'value', demandType: 'Report a new repair', workType: '', handling: 'Referred to contractor', contactMethod: 'Online portal', pointOfTransaction: 'Online portal', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Submitted online — just wants a confirmed appointment time', collector: collector(1) },
  { date: dates[5], entryType: 'demand', verbatim: 'The light in the communal hallway has been out for a week', classification: 'value', demandType: 'Report a new repair', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Understand the urgency', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Trip hazard for elderly residents', collector: collector(2) },
  { date: dates[6], entryType: 'demand', verbatim: 'My radiator is not heating up in the bedroom', classification: 'value', demandType: 'Report a new repair', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Winter — room is very cold at night', collector: collector(0) },
  { date: dates[7], entryType: 'demand', verbatim: 'The guttering is hanging off and water is pouring down the wall', classification: 'value', demandType: 'Report a new repair', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[8], entryType: 'demand', verbatim: 'I need the extractor fan in the bathroom fixed — it is making a terrible noise', classification: 'value', demandType: 'Report a new repair', workType: '', handling: 'One Stop', contactMethod: 'Face2face', pointOfTransaction: 'Local housing office', whatMattersCategory: 'Fix it right first time', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Came in person because phone line was engaged', collector: collector(2) },
  { date: dates[9], entryType: 'demand', verbatim: 'There is a crack in the ceiling — I think it might be a leak from upstairs', classification: 'value', demandType: 'Report a new repair', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Needs inspection first — worried about structural damage', collector: collector(0) },

  // Request emergency repair — 5 entries
  { date: dates[10], entryType: 'demand', verbatim: 'My boiler has broken down and I have no heating or hot water', classification: 'value', demandType: 'Request emergency repair', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Understand the urgency', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Family with young children — very cold', collector: collector(1) },
  { date: dates[11], entryType: 'demand', verbatim: 'There is a burst pipe flooding my kitchen', classification: 'value', demandType: 'Request emergency repair', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Understand the urgency', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Needs immediate attendance — water is spreading', collector: collector(2) },
  { date: dates[12], entryType: 'demand', verbatim: 'I can smell gas in my flat', classification: 'value', demandType: 'Request emergency repair', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Understand the urgency', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Told to call gas emergency but also wants repair follow-up', collector: collector(0) },
  { date: dates[13], entryType: 'demand', verbatim: 'My front door has been kicked in — I cannot lock it', classification: 'value', demandType: 'Request emergency repair', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Understand the urgency', originalValueDemand: '', failureCause: '', whatMattersNotes: 'After a break-in — very distressed, needs immediate boarding up', collector: collector(1) },
  { date: dates[14], entryType: 'demand', verbatim: 'The electricity has gone off in the whole flat — nothing is working', classification: 'value', demandType: 'Request emergency repair', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Understand the urgency', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Elderly tenant — needs electricity for medical equipment', collector: collector(2) },

  // Book appointment for inspection — 5 entries
  { date: dates[15], entryType: 'demand', verbatim: 'I need someone to come and look at the damp in my bathroom', classification: 'value', demandType: 'Book appointment for inspection', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Just wants a confirmed date and time', collector: collector(0) },
  { date: dates[16], entryType: 'demand', verbatim: 'Can you send someone to assess the kitchen for a refit?', classification: 'value', demandType: 'Book appointment for inspection', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Has been waiting for planned works — just wants to know when', collector: collector(1) },
  { date: dates[17], entryType: 'demand', verbatim: 'I think there might be asbestos in the ceiling tiles — can someone check?', classification: 'value', demandType: 'Book appointment for inspection', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Understand the urgency', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Health concern — wants reassurance', collector: collector(2) },
  { date: dates[18], entryType: 'demand', verbatim: 'My neighbour is having problems with their drains — it might be affecting my property too', classification: 'value', demandType: 'Book appointment for inspection', workType: '', handling: 'Referred to contractor', contactMethod: 'Face2face', pointOfTransaction: 'Estate caretaker', whatMattersCategory: 'Listen to what I am telling you', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Reported to caretaker on estate — wants it taken seriously', collector: collector(0) },
  { date: dates[19], entryType: 'demand', verbatim: 'The surveyor was supposed to come last month — can I rebook?', classification: 'value', demandType: 'Book appointment for inspection', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },

  // Request adaptation / modification — 4 entries
  { date: dates[20], entryType: 'demand', verbatim: 'I need a grab rail fitted in my bathroom — my OT recommended it', classification: 'value', demandType: 'Request adaptation / modification', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Listen to what I am telling you', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Has occupational therapist recommendation — wants it progressed', collector: collector(2) },
  { date: dates[21], entryType: 'demand', verbatim: 'Can I have a walk-in shower installed? I can no longer get in the bath', classification: 'value', demandType: 'Request adaptation / modification', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Listen to what I am telling you', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Mobility issues — this is about independence', collector: collector(0) },
  { date: dates[22], entryType: 'demand', verbatim: 'I need a ramp put in at the front door for my wheelchair', classification: 'value', demandType: 'Request adaptation / modification', workType: '', handling: 'Follow-up required', contactMethod: 'Face2face', pointOfTransaction: 'Local housing office', whatMattersCategory: 'Understand the urgency', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Currently cannot leave the house safely — affects quality of life', collector: collector(1) },
  { date: dates[23], entryType: 'demand', verbatim: 'The council said I should call you about getting a stairlift', classification: 'value', demandType: 'Request adaptation / modification', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Listen to what I am telling you', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Assessment already done — just waiting for installation', collector: collector(2) },

  // Annual gas safety check booking — 4 entries
  { date: dates[24], entryType: 'demand', verbatim: 'I got a letter about my gas safety check — when are you coming?', classification: 'value', demandType: 'Annual gas safety check booking', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Needs to take time off work — wants a specific time', collector: collector(0) },
  { date: dates[25], entryType: 'demand', verbatim: 'Can I rearrange my gas check? The date you sent does not work for me', classification: 'value', demandType: 'Annual gas safety check booking', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[26], entryType: 'demand', verbatim: 'I have not had my annual gas check yet — is it due?', classification: 'value', demandType: 'Annual gas safety check booking', workType: '', handling: 'One Stop', contactMethod: 'Online portal', pointOfTransaction: 'Online portal', whatMattersCategory: 'Keep me informed', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[27], entryType: 'demand', verbatim: 'My gas check letter says AM — can you be more specific about the time?', classification: 'value', demandType: 'Annual gas safety check booking', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Works shifts — AM is too vague', collector: collector(0) },

  // ═══════════════════════════════════════════
  // DEMAND: FAILURE (50 entries)
  // ═══════════════════════════════════════════

  // Chasing repair that wasn't completed — 12 entries
  { date: dates[28], entryType: 'demand', verbatim: 'The plumber came last week but the tap is still dripping', classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.noFirstFix, whatMattersNotes: 'Says the plumber only tightened something and left', collector: collector(1) },
  { date: dates[29], entryType: 'demand', verbatim: "Someone came out to look at the damp but didn't actually do anything", classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.remoteDiagnosis, whatMattersNotes: 'Inspector left without any action — tenant feels ignored', collector: collector(2) },
  { date: dates[30], entryType: 'demand', verbatim: 'The electrician said he needed a part and would come back — that was three weeks ago', classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Report a new repair', failureCause: SC.partsDelay, whatMattersNotes: 'No one told them when the part would arrive', collector: collector(0) },
  { date: dates[31], entryType: 'demand', verbatim: 'You fixed the leak but now there is water damage on the ceiling that no one has dealt with', classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.noFirstFix, whatMattersNotes: 'One trade fixed their bit but the follow-on work was never raised', collector: collector(1) },
  { date: dates[32], entryType: 'demand', verbatim: "The contractor said the job was done but it clearly isn't — the window still doesn't close", classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.volumeIncentive, whatMattersNotes: 'Contractor signed it off as complete to get paid', collector: collector(2) },
  { date: dates[33], entryType: 'demand', verbatim: 'I was told the repair was booked but nobody has turned up', classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Report a new repair', failureCause: SC.noVisibility, whatMattersNotes: 'Took a day off work for nothing', collector: collector(0) },
  { date: dates[34], entryType: 'demand', verbatim: 'The repair was marked as complete on your system but the problem is exactly the same', classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Escalated to manager', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.volumeIncentive, whatMattersNotes: 'Angry — feels like they are being lied to', collector: collector(1) },
  { date: dates[35], entryType: 'demand', verbatim: "I've reported this repair twice now and nothing has happened", classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Report a new repair', failureCause: SC.wrongCategories, whatMattersNotes: 'First report was logged under wrong category and lost', collector: collector(2) },
  { date: dates[36], entryType: 'demand', verbatim: 'The boiler was fixed temporarily but they said someone else needs to come for the full repair', classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Request emergency repair', failureCause: SC.noFirstFix, whatMattersNotes: 'Emergency was dealt with but permanent fix never booked', collector: collector(0) },
  { date: dates[37], entryType: 'demand', verbatim: 'No one has come back to finish painting after the plastering was done', classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Referred to contractor', contactMethod: 'Face2face', pointOfTransaction: 'Local housing office', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.noFirstFix, whatMattersNotes: 'Bare plaster for two months — looks awful', collector: collector(1) },
  { date: dates[38], entryType: 'demand', verbatim: 'The roof was patched but it is leaking again after the first rain', classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Escalated to manager', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.volumeIncentive, whatMattersNotes: 'Quick patch instead of proper repair', collector: collector(2) },
  { date: dates[39], entryType: 'demand', verbatim: 'You replaced the tap but it is the wrong type — it does not match the sink', classification: 'failure', demandType: "Chasing repair that wasn't completed", workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Listen to what I am telling you', originalValueDemand: 'Report a new repair', failureCause: SC.remoteDiagnosis, whatMattersNotes: 'Wrong part ordered because nobody inspected first', collector: collector(0) },

  // Missed appointment — reschedule — 9 entries
  { date: dates[40], entryType: 'demand', verbatim: 'Nobody showed up for my repair appointment this morning', classification: 'failure', demandType: 'Missed appointment — reschedule', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: 'Report a new repair', failureCause: SC.noVisibility, whatMattersNotes: 'Took time off work — lost a day of pay', collector: collector(1) },
  { date: dates[41], entryType: 'demand', verbatim: 'The contractor came but I was told it would be afternoon — they came at 9am and I was at work', classification: 'failure', demandType: 'Missed appointment — reschedule', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: 'Report a new repair', failureCause: SC.vagueSlots, whatMattersNotes: 'AM/PM slots are useless when you work', collector: collector(2) },
  { date: dates[42], entryType: 'demand', verbatim: 'I waited in all day and got a text at 4pm saying the appointment is cancelled', classification: 'failure', demandType: 'Missed appointment — reschedule', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: 'Report a new repair', failureCause: SC.noVisibility, whatMattersNotes: 'Wasted an entire day', collector: collector(0) },
  { date: dates[43], entryType: 'demand', verbatim: 'The gas engineer never came for my safety check — I need to rebook', classification: 'failure', demandType: 'Missed appointment — reschedule', workType: '', handling: 'One Stop', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: 'Annual gas safety check booking', failureCause: SC.noVisibility, whatMattersNotes: '', collector: collector(1) },
  { date: dates[44], entryType: 'demand', verbatim: 'This is the second time the contractor has not turned up', classification: 'failure', demandType: 'Missed appointment — reschedule', workType: '', handling: 'Escalated to manager', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Report a new repair', failureCause: SC.noVisibility, whatMattersNotes: 'Demanding compensation for lost wages', collector: collector(2) },
  { date: dates[45], entryType: 'demand', verbatim: 'I got a letter saying my appointment is next Tuesday but I already told you I cannot do Tuesdays', classification: 'failure', demandType: 'Missed appointment — reschedule', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Listen to what I am telling you', originalValueDemand: 'Book appointment for inspection', failureCause: SC.noVisibility, whatMattersNotes: 'Previous preferences were not recorded', collector: collector(0) },
  { date: dates[46], entryType: 'demand', verbatim: 'The window fitter was supposed to come between 8 and 12 — nobody arrived', classification: 'failure', demandType: 'Missed appointment — reschedule', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Turn up when you say you will', originalValueDemand: 'Report a new repair', failureCause: SC.noVisibility, whatMattersNotes: '', collector: collector(1) },
  { date: dates[47], entryType: 'demand', verbatim: 'Someone came but said they did not have the right tools and left', classification: 'failure', demandType: 'Missed appointment — reschedule', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.remoteDiagnosis, whatMattersNotes: 'Wrong trade sent because diagnosis was wrong', collector: collector(2) },
  { date: dates[48], entryType: 'demand', verbatim: 'I have rearranged my work three times now for appointments that keep getting cancelled', classification: 'failure', demandType: 'Missed appointment — reschedule', workType: '', handling: 'Escalated to manager', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Report a new repair', failureCause: SC.noVisibility, whatMattersNotes: 'At breaking point — threatening to go to the press', collector: collector(0) },

  // Repeat repair — same problem back — 8 entries
  { date: dates[49], entryType: 'demand', verbatim: 'The leak is back again — this is the third time you have fixed the same pipe', classification: 'failure', demandType: 'Repeat repair — same problem back', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.noFirstFix, whatMattersNotes: 'Keeps getting patched instead of replaced', collector: collector(1) },
  { date: dates[50], entryType: 'demand', verbatim: 'You fixed the boiler two weeks ago and it has broken down again', classification: 'failure', demandType: 'Repeat repair — same problem back', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Request emergency repair', failureCause: SC.volumeIncentive, whatMattersNotes: 'Boiler needs replacing, not repairing', collector: collector(2) },
  { date: dates[51], entryType: 'demand', verbatim: 'The damp is back in exactly the same place — your last repair did nothing', classification: 'failure', demandType: 'Repeat repair — same problem back', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.remoteDiagnosis, whatMattersNotes: 'Root cause never identified — just painted over', collector: collector(0) },
  { date: dates[52], entryType: 'demand', verbatim: 'The toilet is blocked again — same problem as last month', classification: 'failure', demandType: 'Repeat repair — same problem back', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.noFirstFix, whatMattersNotes: 'Underlying drainage issue never investigated', collector: collector(1) },
  { date: dates[53], entryType: 'demand', verbatim: 'My front door sticks again — you planed it down but the frame is warped', classification: 'failure', demandType: 'Repeat repair — same problem back', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.noFirstFix, whatMattersNotes: 'Quick fix instead of addressing the real problem', collector: collector(2) },
  { date: dates[54], entryType: 'demand', verbatim: 'The mould is growing back three months after you treated it', classification: 'failure', demandType: 'Repeat repair — same problem back', workType: '', handling: 'Escalated to manager', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.remoteDiagnosis, whatMattersNotes: 'Children have asthma — this is a health issue now', collector: collector(0) },
  { date: dates[55], entryType: 'demand', verbatim: 'The radiator is cold again — same one you bled last time', classification: 'failure', demandType: 'Repeat repair — same problem back', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.noFirstFix, whatMattersNotes: 'System probably needs a powerflush, not bleeding', collector: collector(1) },
  { date: dates[56], entryType: 'demand', verbatim: 'The lock you fitted last month has already broken — it is cheap rubbish', classification: 'failure', demandType: 'Repeat repair — same problem back', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.volumeIncentive, whatMattersNotes: 'Cheapest parts used instead of quality', collector: collector(2) },

  // Chasing parts on order — 6 entries
  { date: dates[57], entryType: 'demand', verbatim: 'The contractor said he needed to order a part two weeks ago — any update?', classification: 'failure', demandType: 'Chasing parts on order', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Report a new repair', failureCause: SC.partsDelay, whatMattersNotes: 'Nobody told them the part was on backorder', collector: collector(0) },
  { date: dates[58], entryType: 'demand', verbatim: 'When is the replacement boiler arriving? I was told one week', classification: 'failure', demandType: 'Chasing parts on order', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Request emergency repair', failureCause: SC.partsDelay, whatMattersNotes: 'Using temporary heaters — electricity bill is huge', collector: collector(1) },
  { date: dates[59], entryType: 'demand', verbatim: "I keep being told the part is on order — it's been a month now", classification: 'failure', demandType: 'Chasing parts on order', workType: '', handling: 'Escalated to manager', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Report a new repair', failureCause: SC.partsDelay, whatMattersNotes: 'Feels like an excuse — nobody can tell them what part or when', collector: collector(2) },
  { date: dates[60], entryType: 'demand', verbatim: 'My bathroom has been half-finished for three weeks waiting for tiles', classification: 'failure', demandType: 'Chasing parts on order', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Report a new repair', failureCause: SC.partsDelay, whatMattersNotes: 'Cannot use the bathroom properly', collector: collector(0) },
  { date: dates[61], entryType: 'demand', verbatim: 'Has the window arrived yet? The broken one has been boarded up for weeks', classification: 'failure', demandType: 'Chasing parts on order', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Report a new repair', failureCause: SC.partsDelay, whatMattersNotes: 'Living with plywood over the window — depressing', collector: collector(1) },
  { date: dates[62], entryType: 'demand', verbatim: 'Nobody can tell me when the part for my cooker will come in', classification: 'failure', demandType: 'Chasing parts on order', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Report a new repair', failureCause: SC.partsDelay, whatMattersNotes: 'Cannot cook properly — buying takeaways', collector: collector(2) },

  // Complaint about quality of work — 6 entries
  { date: dates[63], entryType: 'demand', verbatim: 'The plastering job is terrible — it is all uneven and cracking already', classification: 'failure', demandType: 'Complaint about quality of work', workType: '', handling: 'Escalated to manager', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.volumeIncentive, whatMattersNotes: 'Contractor rushed the job', collector: collector(0) },
  { date: dates[64], entryType: 'demand', verbatim: 'The new kitchen worktop does not fit properly — there are gaps everywhere', classification: 'failure', demandType: 'Complaint about quality of work', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.volumeIncentive, whatMattersNotes: 'Measurements were wrong', collector: collector(1) },
  { date: dates[65], entryType: 'demand', verbatim: 'The painter left paint all over my carpet and furniture', classification: 'failure', demandType: 'Complaint about quality of work', workType: '', handling: 'Escalated to manager', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.volumeIncentive, whatMattersNotes: "Did not protect the room before starting — tenant's belongings damaged", collector: collector(2) },
  { date: dates[66], entryType: 'demand', verbatim: 'The new front door does not sit right in the frame — there is a draught', classification: 'failure', demandType: 'Complaint about quality of work', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.remoteDiagnosis, whatMattersNotes: 'Door ordered without proper measurement', collector: collector(0) },
  { date: dates[67], entryType: 'demand', verbatim: 'The contractor left a mess everywhere — rubbish, dust, old parts just left behind', classification: 'failure', demandType: 'Complaint about quality of work', workType: '', handling: 'Follow-up required', contactMethod: 'Face2face', pointOfTransaction: 'Estate caretaker', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.volumeIncentive, whatMattersNotes: 'Reported to caretaker who was equally frustrated', collector: collector(1) },
  { date: dates[68], entryType: 'demand', verbatim: 'You fitted a bath panel that is already coming away from the wall', classification: 'failure', demandType: 'Complaint about quality of work', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Request adaptation / modification', failureCause: SC.volumeIncentive, whatMattersNotes: 'Part of adaptation work — especially disappointing', collector: collector(2) },

  // Wrong contractor sent — 5 entries
  { date: dates[69], entryType: 'demand', verbatim: 'You sent a plumber but I need an electrician — the problem is electrical', classification: 'failure', demandType: 'Wrong contractor sent', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Listen to what I am telling you', originalValueDemand: 'Report a new repair', failureCause: SC.wrongCategories, whatMattersNotes: 'Reported as plumbing because of how the categories work', collector: collector(0) },
  { date: dates[70], entryType: 'demand', verbatim: 'The joiner came but said this is a plasterer job — wasted visit', classification: 'failure', demandType: 'Wrong contractor sent', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Listen to what I am telling you', originalValueDemand: 'Report a new repair', failureCause: SC.remoteDiagnosis, whatMattersNotes: 'Diagnosis was wrong because nobody came to look first', collector: collector(1) },
  { date: dates[71], entryType: 'demand', verbatim: 'A general maintenance person came but said it needs a specialist roofer', classification: 'failure', demandType: 'Wrong contractor sent', workType: '', handling: 'Referred to contractor', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Report a new repair', failureCause: SC.remoteDiagnosis, whatMattersNotes: '', collector: collector(2) },
  { date: dates[72], entryType: 'demand', verbatim: 'The contractor does not do gas work — why was he sent for a boiler problem?', classification: 'failure', demandType: 'Wrong contractor sent', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Fix it right first time', originalValueDemand: 'Request emergency repair', failureCause: SC.wrongCategories, whatMattersNotes: 'Gas Safe registered engineer needed', collector: collector(0) },
  { date: dates[73], entryType: 'demand', verbatim: 'I told you it was a drainage issue but you sent someone for the toilet — it is the outside drains!', classification: 'failure', demandType: 'Wrong contractor sent', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Listen to what I am telling you', originalValueDemand: 'Report a new repair', failureCause: SC.wrongCategories, whatMattersNotes: 'Tenant described the problem clearly but the system categorised it wrong', collector: collector(1) },

  // Querying when inspection will happen — 4 entries
  { date: dates[74], entryType: 'demand', verbatim: 'When is someone coming to inspect my damp problem? I reported it a month ago', classification: 'failure', demandType: 'Querying when inspection will happen', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Book appointment for inspection', failureCause: SC.noAutoUpdates, whatMattersNotes: 'No one has contacted them since the initial report', collector: collector(2) },
  { date: dates[75], entryType: 'demand', verbatim: "I'm still waiting for the survey you promised — it's been six weeks", classification: 'failure', demandType: 'Querying when inspection will happen', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Book appointment for inspection', failureCause: SC.noAutoUpdates, whatMattersNotes: 'Promised a call within two weeks — never came', collector: collector(0) },
  { date: dates[76], entryType: 'demand', verbatim: 'Can anyone tell me when the asbestos survey will happen? I am worried about my health', classification: 'failure', demandType: 'Querying when inspection will happen', workType: '', handling: 'Escalated to manager', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: 'Understand the urgency', originalValueDemand: 'Book appointment for inspection', failureCause: SC.noAutoUpdates, whatMattersNotes: 'Health anxiety — feels ignored', collector: collector(1) },
  { date: dates[77], entryType: 'demand', verbatim: "I've called three times about the kitchen inspection — still no date", classification: 'failure', demandType: 'Querying when inspection will happen', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: "Don't make me chase", originalValueDemand: 'Book appointment for inspection', failureCause: SC.noAutoUpdates, whatMattersNotes: 'Each time told it is in the queue', collector: collector(2) },

  // ═══════════════════════════════════════════
  // DEMAND: UNKNOWN (2 entries)
  // ═══════════════════════════════════════════
  { date: dates[78], entryType: 'demand', verbatim: 'I just want to know what my rights are as a tenant', classification: '?', demandType: '', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: 'General enquiry — difficult to classify without more context', collector: collector(0) },
  { date: dates[79], entryType: 'demand', verbatim: 'Someone from the council told me to ring this number', classification: '?', demandType: '', workType: '', handling: 'Follow-up required', contactMethod: 'Phone', pointOfTransaction: 'Repairs call centre', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: 'Unclear what they need — referred from another service', collector: collector(1) },

  // ═══════════════════════════════════════════
  // WORK: VALUE (14 entries)
  // ═══════════════════════════════════════════

  // Scheduling / diary management — 5 value
  { date: dates[80], entryType: 'work', verbatim: 'Booking contractor appointments for next week', classification: 'value', demandType: '', workType: 'Scheduling / diary management', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[81], entryType: 'work', verbatim: 'Coordinating multi-trade job for kitchen refit — plumber, electrician, joiner', classification: 'value', demandType: '', workType: 'Scheduling / diary management', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },
  { date: dates[82], entryType: 'work', verbatim: 'Planning gas safety check routes for this week', classification: 'value', demandType: '', workType: 'Scheduling / diary management', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[83], entryType: 'work', verbatim: 'Scheduling void property inspections for new lets', classification: 'value', demandType: '', workType: 'Scheduling / diary management', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[84], entryType: 'work', verbatim: 'Allocating emergency repair to available contractor', classification: 'value', demandType: '', workType: 'Scheduling / diary management', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },

  // Raising purchase orders — 3 value
  { date: dates[85], entryType: 'work', verbatim: 'Raising PO for replacement boiler — approved by manager', classification: 'value', demandType: '', workType: 'Raising purchase orders', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[86], entryType: 'work', verbatim: 'Ordering materials for planned kitchen refit programme', classification: 'value', demandType: '', workType: 'Raising purchase orders', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[87], entryType: 'work', verbatim: 'Processing batch PO for monthly gas safety check contractor invoices', classification: 'value', demandType: '', workType: 'Raising purchase orders', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },

  // Updating case notes — 4 value
  { date: dates[88], entryType: 'work', verbatim: 'Updating repair records after successful first-fix completion', classification: 'value', demandType: '', workType: 'Updating case notes', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[89], entryType: 'work', verbatim: 'Logging completed adaptation works with photos', classification: 'value', demandType: '', workType: 'Updating case notes', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[90], entryType: 'work', verbatim: 'Recording tenant satisfaction feedback from completed repair', classification: 'value', demandType: '', workType: 'Updating case notes', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },
  { date: dates[91], entryType: 'work', verbatim: 'Closing job ticket after final inspection sign-off', classification: 'value', demandType: '', workType: 'Updating case notes', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },

  // Management reporting — 2 value
  { date: dates[92], entryType: 'work', verbatim: 'Compiling weekly performance dashboard for team meeting', classification: 'value', demandType: '', workType: 'Management reporting', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[93], entryType: 'work', verbatim: 'Preparing gas safety compliance report for regulatory submission', classification: 'value', demandType: '', workType: 'Management reporting', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },

  // ═══════════════════════════════════════════
  // WORK: FAILURE (24 entries)
  // ═══════════════════════════════════════════

  // Chasing contractor for update — 8 failure
  { date: dates[94], entryType: 'work', verbatim: 'Calling contractor to get update on outstanding repair — tenant has chased three times', classification: 'failure', demandType: '', workType: 'Chasing contractor for update', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[95], entryType: 'work', verbatim: 'Emailing contractor about missed appointment — no response to last two emails', classification: 'failure', demandType: '', workType: 'Chasing contractor for update', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[96], entryType: 'work', verbatim: 'Trying to confirm completion date for boiler replacement — supplier has no ETA', classification: 'failure', demandType: '', workType: 'Chasing contractor for update', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },
  { date: dates[97], entryType: 'work', verbatim: 'Calling three different contractors about overdue jobs — none answering', classification: 'failure', demandType: '', workType: 'Chasing contractor for update', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[98], entryType: 'work', verbatim: 'Chasing roofing contractor for certificate of completion to close the job', classification: 'failure', demandType: '', workType: 'Chasing contractor for update', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[99], entryType: 'work', verbatim: 'Following up on parts delivery that was supposed to arrive last week', classification: 'failure', demandType: '', workType: 'Chasing contractor for update', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },
  { date: dates[100], entryType: 'work', verbatim: 'Escalating overdue gas safety check to contractor manager', classification: 'failure', demandType: '', workType: 'Chasing contractor for update', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[101], entryType: 'work', verbatim: 'Sending third reminder to contractor about adaptation survey report', classification: 'failure', demandType: '', workType: 'Chasing contractor for update', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },

  // Rework — rebooking failed repair — 7 failure
  { date: dates[102], entryType: 'work', verbatim: 'Rebooking plumbing repair after contractor failed to complete first visit', classification: 'failure', demandType: '', workType: 'Rework — rebooking failed repair', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },
  { date: dates[103], entryType: 'work', verbatim: 'Finding alternative contractor after original one missed appointment twice', classification: 'failure', demandType: '', workType: 'Rework — rebooking failed repair', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[104], entryType: 'work', verbatim: 'Raising new job ticket for same repair — previous was closed incorrectly', classification: 'failure', demandType: '', workType: 'Rework — rebooking failed repair', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[105], entryType: 'work', verbatim: 'Rebooking electrician after wrong trade was sent initially', classification: 'failure', demandType: '', workType: 'Rework — rebooking failed repair', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },
  { date: dates[106], entryType: 'work', verbatim: 'Arranging recall for poor quality plastering work', classification: 'failure', demandType: '', workType: 'Rework — rebooking failed repair', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[107], entryType: 'work', verbatim: 'Re-ordering correct part after wrong one was delivered', classification: 'failure', demandType: '', workType: 'Rework — rebooking failed repair', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[108], entryType: 'work', verbatim: 'Rebooking gas safety check for fifth attempt — four previous no-access visits', classification: 'failure', demandType: '', workType: 'Rework — rebooking failed repair', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },

  // Scheduling / diary management — 3 failure
  { date: dates[109], entryType: 'work', verbatim: 'Rescheduling five appointments because contractor called in sick', classification: 'failure', demandType: '', workType: 'Scheduling / diary management', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[110], entryType: 'work', verbatim: 'Trying to find available slot for urgent repair — diary is full for two weeks', classification: 'failure', demandType: '', workType: 'Scheduling / diary management', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[111], entryType: 'work', verbatim: 'Juggling diary to fit in a complaint case that has been escalated', classification: 'failure', demandType: '', workType: 'Scheduling / diary management', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },

  // Raising purchase orders — 2 failure
  { date: dates[112], entryType: 'work', verbatim: 'Re-raising PO that was rejected because budget code was wrong', classification: 'failure', demandType: '', workType: 'Raising purchase orders', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[113], entryType: 'work', verbatim: 'Chasing finance for PO approval that has been sitting for a week', classification: 'failure', demandType: '', workType: 'Raising purchase orders', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },

  // Updating case notes — 2 failure
  { date: dates[114], entryType: 'work', verbatim: 'Updating repair record because contractor marked it complete but tenant says otherwise', classification: 'failure', demandType: '', workType: 'Updating case notes', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },
  { date: dates[115], entryType: 'work', verbatim: 'Correcting job category in system after wrong trade was dispatched', classification: 'failure', demandType: '', workType: 'Updating case notes', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },

  // Management reporting — 2 failure
  { date: dates[116], entryType: 'work', verbatim: 'Compiling data for councillor complaint response — pulling info from three systems', classification: 'failure', demandType: '', workType: 'Management reporting', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
  { date: dates[117], entryType: 'work', verbatim: 'Re-running performance report because the figures did not match — data entry errors', classification: 'failure', demandType: '', workType: 'Management reporting', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(0) },

  // Internal process query — 2 failure
  { date: dates[118], entryType: 'work', verbatim: 'Trying to work out which budget code to use for an adaptation that crossed two categories', classification: 'failure', demandType: '', workType: 'Internal process query', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(1) },
  { date: dates[119], entryType: 'work', verbatim: 'Asking manager about process for emergency repair outside contract hours — no clear guidance', classification: 'failure', demandType: '', workType: 'Internal process query', handling: '', contactMethod: '', pointOfTransaction: '', whatMattersCategory: '', originalValueDemand: '', failureCause: '', whatMattersNotes: '', collector: collector(2) },
];
