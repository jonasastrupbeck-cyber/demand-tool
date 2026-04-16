# Understanding Demand — Technical Documentation

*Architecture, data model, API reference, and deployment guide*

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon, EU region) |
| ORM | Drizzle ORM |
| Charts | Recharts |
| PowerPoint | PptxGenJS |
| Spreadsheets | SheetJS (xlsx) |
| Hosting | Vercel |
| i18n | Custom implementation (4 locales) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Landing page (create/join study)
│   ├── layout.tsx                        # Root layout (fonts, metadata)
│   ├── study/[code]/
│   │   ├── layout.tsx                    # Study layout (nav bar, tabs)
│   │   ├── capture/page.tsx              # Unified capture: form + filter chips + entries list
│   │   ├── dashboard/page.tsx            # Analysis dashboard
│   │   └── settings/page.tsx             # Study configuration + capture toggles
│   └── api/
│       └── studies/
│           ├── route.ts                  # POST: create study
│           └── [code]/
│               ├── route.ts              # GET/PUT: study details (incl. capture toggles)
│               ├── entries/
│               │   ├── route.ts          # GET/POST: entries
│               │   ├── [entryId]/route.ts # PATCH/DELETE: single entry
│               │   ├── import/route.ts   # POST: XLSX import
│               │   └── export/route.ts   # GET: XLSX export
│               ├── dashboard/
│               │   └── flow-causes/route.ts # GET: Sankey drill-down
│               ├── pending-counts/route.ts  # GET: counts for filter chips
│               ├── demand-types/         # CRUD
│               ├── handling-types/       # CRUD
│               ├── contact-methods/      # CRUD
│               ├── points-of-transaction/ # CRUD
│               ├── what-matters-types/   # CRUD
│               └── work-types/           # CRUD
├── components/
│   ├── EntryEditModal.tsx                # Inline edit for any entry, every field
│   └── InlineTypeAdder.tsx               # Reusable "+ Add new" for taxonomy dropdowns
├── lib/
│   ├── schema.ts                         # Drizzle schema (all tables)
│   ├── db.ts                             # Database connection
│   ├── queries.ts                        # Reusable query functions (incl. getPendingCounts)
│   ├── dashboard-aggregations.ts         # Dashboard data calculations
│   ├── i18n.ts                           # Translation keys (en/da/sv/de)
│   ├── locale-context.tsx                # React context for i18n
│   └── pptx-export.ts                   # PowerPoint generation
├── types/
│   └── index.ts                          # Shared TypeScript interfaces
scripts/
├── seed-test-data.ts                     # Test data seeder
└── data/
    ├── bank-contact-centre.ts            # Study A: 100 entries
    └── housing-repairs.ts                # Study B: 120 entries
drizzle/
├── schema.ts                             # Generated schema
├── relations.ts                          # Generated relations
└── meta/                                 # Migration metadata
```

---

## Database Schema

### studies

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| accessCode | varchar(6) | Unique, auto-generated |
| name | varchar(255) | Required |
| description | text | Optional |
| purpose | text | Study purpose statement |
| activeLayer | integer | Legacy; retained for backward compat and used to auto-seed new booleans on first read. No longer read by features. |
| classificationEnabled | boolean | Default false. When on, capture form/list expose classification, demand type, failure cause. |
| handlingEnabled | boolean | Default false. Enables Capability of Response capture + Perfect % metric. (Column name retained from earlier "Handling Type" terminology — UI now labels this "Capability of Response".) |
| valueLinkingEnabled | boolean | Default false. Enables failure→value linking + Failure Flow Sankey. |
| whatMattersEnabled | boolean | Default false. Enables what-matters category capture. |
| systemConditionsEnabled | boolean | Default false. Enables free-text failure cause capture. |
| workTypesEnabled | boolean | Default false. Enables structured work types. |
| consultantPin | varchar(6) | Optional, 4–6 digits |
| workTrackingEnabled | boolean | Default false |
| oneStopHandlingType | uuid | FK → handlingTypes |
| primaryContactMethodId | uuid | FK → contactMethods |
| primaryPointOfTransactionId | uuid | FK → pointsOfTransaction |
| isActive | boolean | Default true |
| createdAt | timestamp | Auto-set |

### demandEntries

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| studyId | uuid | FK → studies |
| verbatim | text | Required — customer's exact words |
| classification | varchar | 'value', 'failure', 'unknown' |
| entryType | varchar | 'demand' or 'work' |
| demandTypeId | uuid | FK → demandTypes (when classificationEnabled) |
| workTypeId | uuid | FK → workTypes |
| handlingTypeId | uuid | FK → handlingTypes (when handlingEnabled) |
| contactMethodId | uuid | FK → contactMethods |
| pointOfTransactionId | uuid | FK → pointsOfTransaction |
| failureCause | text | Free-text system condition |
| originalValueDemandTypeId | uuid | FK → demandTypes (failure→value link) |
| linkedValueDemandEntryId | uuid | FK → demandEntries (when valueLinkingEnabled) |
| whatMatters | text | Free-text notes |
| collectorName | varchar(100) | Who captured this entry |
| createdAt | timestamp | Auto-set |

### demandEntryWhatMatters (junction table)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| entryId | uuid | FK → demandEntries |
| whatMattersTypeId | uuid | FK → whatMattersTypes |

### Type tables (all follow same pattern)

Tables: `demandTypes`, `handlingTypes`, `contactMethods`, `pointsOfTransaction`, `whatMattersTypes`, `workTypes`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| studyId | uuid | FK → studies |
| label | varchar(255) | Display name |
| category | varchar | Only on demandTypes: 'value' or 'failure' |
| operationalDefinition | text | Optional description (some tables) |
| sortOrder | integer | Display ordering |
| createdAt | timestamp | Auto-set |

---

## API Reference

All API routes are under `/api/studies`. The study is identified by its 6-character `accessCode` (referred to as `[code]` in routes).

### Study Management

#### POST /api/studies
Create a new study.

**Request body:**
```json
{
  "name": "Housing Repairs Service",
  "description": "Optional description",
  "locale": "en",
  "primaryContactMethod": "Phone"
}
```

**Response:** `{ id, accessCode, name }`

#### GET /api/studies/[code]
Returns full study object with all configured types.

#### PUT /api/studies/[code]
Update study fields. Accepts any subset of: `purpose`, `consultantPin`, `workTrackingEnabled`, `classificationEnabled`, `handlingEnabled`, `valueLinkingEnabled`, `whatMattersEnabled`, `systemConditionsEnabled`, `workTypesEnabled`, `primaryContactMethodId`, `primaryPointOfTransactionId`, `oneStopHandlingType`.

**Auto-seed on first read:** `GET /api/studies/[code]` seeds the new boolean columns from legacy `activeLayer` if they are all false — `activeLayer ≥ 2` sets `classificationEnabled`, `≥ 3` sets `handlingEnabled`, `≥ 4` sets `valueLinkingEnabled`. Existing studies created before the unified flow stay functional without manual migration.

---

### Entries

#### GET /api/studies/[code]/entries
List all entries. Supports query parameters:
- `from` — ISO date string (filter start)
- `to` — ISO date string (filter end)

#### POST /api/studies/[code]/entries
Create a new entry.

**Request body:**
```json
{
  "verbatim": "I called about my repair last week",
  "classification": "failure",
  "entryType": "demand",
  "demandTypeId": "uuid",
  "handlingTypeId": "uuid",
  "contactMethodId": "uuid",
  "pointOfTransactionId": "uuid",
  "failureCause": "No feedback loop to customer",
  "originalValueDemandTypeId": "uuid",
  "whatMattersTypeIds": ["uuid1", "uuid2"],
  "whatMatters": "Just wants to know when it will be fixed",
  "collectorName": "Sarah M"
}
```

#### PATCH /api/studies/[code]/entries/[entryId]
Update any subset of fields on a single entry. Used by `EntryEditModal` when the user clicks **Edit** on a row in the capture list.

#### DELETE /api/studies/[code]/entries/[entryId]
Delete a single entry (used by undo).

---

### Import / Export

#### POST /api/studies/[code]/entries/import
Upload XLSX file via multipart form data.

**Request:** `FormData` with `file` field containing `.xlsx` file.

**Response:**
```json
{
  "imported": 95,
  "errors": [
    { "row": 12, "message": "Unknown demand type: 'Booking'" }
  ]
}
```

**Column mapping:**
| Column Header | Maps to |
|--------------|---------|
| Date | createdAt |
| Entry Type | entryType ('demand' or 'work') |
| Demand (Verbatim) | verbatim |
| Classification | classification |
| Demand Type | demandTypeId (matched by label) |
| Work Type | workTypeId (matched by label) |
| Handling | handlingTypeId (matched by label) |
| Contact Method | contactMethodId (matched by label) |
| Point of Transaction | pointOfTransactionId (matched by label) |
| What Matters Category | whatMattersTypeIds (matched by label) |
| Original Value Demand | originalValueDemandTypeId (matched by label) |
| Failure Cause (System Condition) | failureCause |
| What Matters (Notes) | whatMatters |
| Collector | collectorName |

**Classification value mapping (multi-language):**
- Value: `value`, `værdi`, `vs`, `värde`, `wert`
- Failure: `failure`, `ikke-værdiskabende`, `ivs`, `spild`, `icke-värdeskapande`, `fehlernachfrage`
- Unknown: `?`, `unknown`

**Date parsing:** Supports ISO strings (`2025-01-15`) and Excel serial numbers.

#### GET /api/studies/[code]/entries/export
Downloads XLSX with three sheets:
1. **Entries** — All data with columns gated by the study's capture toggles
2. **Summary** — Key metrics
3. **Failure Flow** — Cross-tabulation matrix

---

### Dashboard

#### GET /api/studies/[code]/dashboard
Returns aggregated dashboard data. Supports `from` and `to` query params.

**Response includes:**
```typescript
{
  totalEntries: number
  valueCount: number
  failureCount: number
  unknownCount: number
  perfectCount: number
  demandCount: number
  workCount: number
  workValueCount: number
  workFailureCount: number
  topDemandTypes: { label, count, category }[]
  handlingBreakdown: { label, count }[]
  handlingByClassification: { label, value, failure }[]
  overTime: { date, value, failure }[]
  contactMethods: { label, count }[]
  whatMatters: { label, count }[]
  whatMattersByClassification: { label, value, failure }[]
  whatMattersNotes: { text, date, demandType, classification }[]
  pointOfTransactionByClassification: { label, value, failure, total }[]
  failureCauses: { cause, count }[]
  failureFlowLinks: { source, target, value }[]
  failureByValueDemand: { label, count }[]
  collectors: { name, count, lastActive }[]
}
```

#### GET /api/studies/[code]/dashboard/flow-causes
Returns system conditions for a specific failure flow (Sankey drill-down).

**Query params:** `source` (value demand type label), `target` (failure demand type label)

**Response:** `{ causes: { cause: string, count: number }[] }`

---

### Pending Counts (Capture filter chips)

#### GET /api/studies/[code]/pending-counts
Returns counts used to label the filter chips on the Capture page.

**Response:**
```json
{
  "needsClassification": 12,
  "needsHandling": 4,
  "needsValueLink": 7
}
```

Each count is computed by the same predicates used to light the chips — e.g. `needsClassification` is the number of entries whose `classification` is still `'unknown'` when the study has `classificationEnabled` on.

---

### Type Management (CRUD)

All type endpoints follow the same pattern:

#### GET /api/studies/[code]/{type-plural}
List all types for the study.

#### POST /api/studies/[code]/{type-plural}
Create a new type. Body: `{ label, category?, operationalDefinition? }`

#### PUT /api/studies/[code]/{type-plural}/[id]
Update a type (label, operational definition, sort order).

#### DELETE /api/studies/[code]/{type-plural}/[id]
Delete a type (fails if entries reference it).

**Type endpoints:**
- `/demand-types` — includes `category` field ('value' or 'failure')
- `/handling-types`
- `/contact-methods`
- `/points-of-transaction`
- `/what-matters-types`
- `/work-types`

---

## Internationalisation (i18n)

### Supported Locales
- `en` — English
- `da` — Danish (Dansk)
- `sv` — Swedish (Svenska)
- `de` — German (Deutsch)

### How It Works

Translations are defined in `src/lib/i18n.ts` as a flat key-value map per locale. The React context (`src/lib/locale-context.tsx`) provides:

- `locale` — Current locale string
- `setLocale(locale)` — Change locale (persisted to localStorage)
- `t(key)` — Translate a key, falls back to English if missing
- `tl(label, type)` — Translate a study-configured label (demand types, etc.)

### Adding a New Language

1. Add the locale code to the `Locale` type in `i18n.ts`
2. Add a complete translation object with all existing keys
3. Add the locale option to the language selector in `layout.tsx` and `page.tsx`
4. Add classification mappings in the XLSX import route

---

## Dashboard Aggregations

The file `src/lib/dashboard-aggregations.ts` contains all the data processing logic for the dashboard. Key functions:

### extractThemes(notes)
Extracts common themes from free-text "what matters" notes:
- Tokenises and normalises text
- Counts unigrams and bigrams
- Filters stop words
- Returns top 20 terms with count ≥ 2
- Used by the word cloud visualisation

### Dashboard data flow
1. Client requests `/api/studies/[code]/dashboard?from=X&to=Y`
2. Server fetches all entries in date range with joins
3. `buildDashboardData()` aggregates into all chart datasets
4. Client renders charts with Recharts

---

## PowerPoint Export

The file `src/lib/pptx-export.ts` generates a branded presentation:

### Slides
1. **Title** — Vanguard logo, study name, date range, entry count
2. **Executive Summary** — Auto-generated findings (value/failure split, top type, perfect %, top failure flow, top system condition)
3. **Key Metrics** — 4 metric cards + pie chart
4. **Top Demand Types** — Horizontal bar chart (when classificationEnabled)
5. **Failure by Value Demand** — Bar chart (when classificationEnabled)
6. Additional slides for handling, contact methods, what matters

### Design
- Burgundy accent (#ac2c2d) for borders and highlights
- Green (#22c55e) for value, Red (#ef4444) for failure
- Vanguard logo embedded as base64
- Footer with logo and date on each slide

---

## Deployment

### Requirements
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Vercel account (or any Node.js hosting)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |

### Deploy to Vercel

1. Push code to GitHub
2. Import repo in Vercel dashboard
3. Set `DATABASE_URL` environment variable
4. Deploy — Vercel auto-detects Next.js

### Database Setup

Push the schema to a new database:
```bash
DATABASE_URL="your-connection-string" npx drizzle-kit push
```

### Seed Test Data

Two realistic test studies are included:

```bash
# Ensure the app is running
npm run dev

# Seed locally
npx tsx scripts/seed-test-data.ts

# Seed on deployed version
BASE_URL="https://your-url.vercel.app" npx tsx scripts/seed-test-data.ts
```

**Study A: Bank Contact Centre** — 100 demand entries, 6 value types, 8 failure types
**Study B: Housing Repairs Service** — 120 entries (80 demand + 40 work), 5 value types, 7 failure types, 7 work types

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Push schema to database
npx drizzle-kit push

# Run dev server
npm run dev
```

The app runs at `http://localhost:3000`.

---

## Colour Conventions (Vanguard Method)

These colours carry meaning throughout the tool:

| Colour | Hex | Meaning |
|--------|-----|---------|
| Green | #22c55e | Value — good, what matters, what customers want |
| Red | #ef4444 | Failure — waste, system conditions, problems |
| Amber | #f59e0b | Unknown — not yet classified |
| Burgundy | #ac2c2d | Vanguard brand accent |
| Blue | #3b82f6 | Neutral — informational, what matters categories |
| Green (dark) | #16a34a | Word cloud — what matters themes |

**Important principle:** Green is always positive (value, what matters). Red is always systemic failure (never about individuals). The tool studies the **system**, not people.

---

## Key Design Decisions

1. **No user accounts** — Studies are accessed by code only. This removes friction for front-line workers who need to capture demand quickly.

2. **Progressive disclosure via capture toggles** — Rather than overwhelming users with every field at once, consultants switch on individual capture dimensions (classification, handling, value linking, etc.) in Settings. Each toggle independently controls the capture form fields, the entries list columns, the dashboard metrics, and the export columns. This replaces the older `activeLayer` stage-gate: the team adds complexity on their own cadence, and classification is always possible retroactively by clicking **Edit** on an entry.

3. **Free-text failure causes** — System conditions are not predefined types. They're free-text to avoid constraining the analysis. The dashboard groups them by exact string match.

4. **Multi-language from day one** — Vanguard Method is used internationally. All UI text is translated into English, Danish, Swedish, and German.

5. **Client-side locale** — Language preference is stored in localStorage, not in the database. Different team members can use different languages on the same study.

6. **Consultant PIN** — Settings are protected but capture is open. This lets front-line workers collect data without accidentally changing the study configuration.
