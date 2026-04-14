# Understanding Demand — User Manual

*A consultant's guide to running Vanguard Method demand studies*

---

## What is Understanding Demand?

Understanding Demand is a web-based tool for running demand analysis studies using the Vanguard Method. It helps you capture what customers actually ask for (demand), classify whether the organisation is delivering value or creating failure, and uncover the system conditions causing problems.

The tool supports the full Check phase workflow: **Purpose → Demand → Capability → Flow → System Conditions → Thinking**.

---

## Quick Start

### Creating a New Study

1. Go to your Understanding Demand URL (e.g. `demand.vanguardmetoden.dk`)
2. Click **"Create New Study"**
3. Fill in:
   - **Study name** (required) — e.g. "Housing Repairs Contact Centre"
   - **Description** (optional) — brief context for the study
   - **Primary contact method** — how most customers reach you (Phone, Mail, Face-to-Face, etc.)
   - **Consultant PIN** (optional but recommended) — protects the Settings page so only you can change the study configuration
4. Click **Create**
5. You'll be taken to the **Settings** page to configure the study

### Sharing with Your Team

After creating a study, you'll see a **6-character access code** (e.g. `A3K9X2`). Share this with everyone who will be collecting demand:

1. They go to the same URL
2. They enter the access code in the **"Join Existing Study"** box
3. They're taken straight to the **Capture** page to start recording

---

## Capture Toggles — What Are We Capturing?

Understanding Demand lets you decide what to capture on each study, one dimension at a time. Instead of moving through rigid "layers" in a fixed order, you switch on the dimensions you're ready for in **Settings → What are we capturing?**. Every toggle independently controls:

- Which fields appear on the Capture form
- Which columns show up on the entries list
- Which filter chips are visible (e.g. "Needs classification")
- Which metrics appear on the Dashboard and in exports

**This is important:** You don't need everything on from day one. Many studies start with verbatim only, switch on classification once the team has a shared definition of value/failure, and layer in handling later. The tool bends to the team's rhythm, not the other way around.

### The available toggles

| Toggle | What it unlocks |
|---|---|
| **Classification** | Mark each entry as Value / Failure / Unknown, assign demand types, record system conditions. Enables the Value vs Failure split on the dashboard. |
| **Handling** | Record how each demand was dealt with (One Stop, Pass-on, Pass-back). Unlocks the **Perfect %** metric — value demand handled in one stop. |
| **Failure → Value linking** | Link each failure demand back to the original value demand it stems from. Drives the **Failure Flow** Sankey diagram. |
| **What Matters** | Categorise what matters to the customer with predefined categories (on top of free-text notes). |
| **System conditions** | Capture free-text causes on failure demand. These feed the Failure Causes chart. |
| **Work types** | Also capture what work the organisation is doing (value work vs failure work). |
| **Demand types** | Use structured demand types (value / failure) alongside or instead of free-text. |

### How to switch a toggle on

1. Go to **Settings**
2. Find the **What are we capturing?** panel
3. Tick the toggles you want on (or off)
4. Make sure the prerequisite lookup data exists — e.g. to use Classification you'll want at least one value and one failure demand type; to use Handling you'll want at least one handling type. You can add these right from Settings (or inline from the entry Edit modal during capture).

Any entries you captured before switching on a dimension stay as they are — you can fill in the new field later by clicking **Edit** on the entry in the Capture list.

---

## Settings — Configuring Your Study

The Settings page is where you set up everything before (and during) the study. If you set a consultant PIN, only you can access this page.

### Purpose Statement
Write a clear purpose statement for the study. This appears on the dashboard and in exports. Example: *"To understand demand on the housing repairs service from the customer's perspective and redesign against what matters."*

### Demand Types (when Classification is on)
These are the categories of demand your team will classify entries into. You need both:

- **Value demand types** (green) — things customers legitimately want
  - Example: "Report a new repair", "Book an appointment", "Get advice"
- **Failure demand types** (red) — things caused by the system failing
  - Example: "Chase progress", "Complaint about quality", "Repeat contact"

**Tip:** Start with a few types based on your initial listening. You can always add more as patterns emerge. Each type can have an **operational definition** — a short description to help collectors classify consistently.

### Handling Types (when Handling is on)
How demand gets dealt with:
- **One Stop** — resolved completely in one interaction (mark this as your "one-stop" type using the star button)
- **Pass-on** — handed to someone else
- **Pass-back** — customer told to call back / come again

### Contact Methods
How customers reach you: Phone, Email, Face-to-Face, Online Portal, etc. One is set as the default so collectors don't have to select it every time.

### Points of Transaction
Where in the process the demand occurs. Useful for multi-site or multi-stage services.

### What Matters Categories (when What Matters is on)
Predefined categories for what customers say matters to them. Examples: "Speed of response", "Being kept informed", "Quality of work".

### Work Types (if Work Tracking is enabled)
If you toggle on **Work Tracking**, you can also capture what work the organisation does (not just what customers ask for). This reveals how much work is value work vs failure work (rework, chasing, correcting errors).

---

## Capture — The Home of the Study

This is the page your team uses day-to-day. It has three zones:

1. **Verbatim form at the top** — where you record new interactions.
2. **Filter chips in the middle** — `All | Needs classification (N) | Needs handling (N) | Needs value link (N)` — jump straight to entries that are missing information.
3. **Live entries list at the bottom** — every entry captured so far, newest first, each with an **Edit** button.

### First Time
Each collector enters their name when they first open the Capture page. This is remembered for future sessions.

### Recording an Entry

1. **Verbatim** (required) — Write down exactly what the customer said, in their words. This is the most important field. Example: *"I called last week about my boiler and nobody came"*

2. **Classification** (when Classification is on) — Is this Value or Failure demand?
   - 🟢 **Value** — The customer wants something we should be doing
   - 🔴 **Failure** — The customer is contacting us because something went wrong
   - 🟡 **Unknown** — Not sure yet (use sparingly — you can come back to this via the "Needs classification" chip)

3. **Demand Type** (when Classification is on) — Which category does this fall into?

4. **Failure Cause** (when Classification is on, failure only) — What system condition caused this failure? Type freely — the tool will suggest previous entries as you type.

5. **Original Value Demand** (when Failure → Value linking is on, failure only) — What did the customer originally want? Select the value demand type this failure stems from.

6. **Handling** (when Handling is on) — How was this demand dealt with?

7. **Contact Method** — Defaults to the study's primary method, change if needed.

8. **What Matters** — What did the customer say matters to them? Use the category pills and/or write free-text notes.

9. Click **Save** — the entry is recorded, the form resets, and you're ready for the next one.

### Tips for Collectors
- Write the verbatim **in the customer's words**, not your interpretation
- If unsure about classification, mark as Unknown — it can be reclassified later
- The failure cause should describe the **system condition**, not blame individuals
- Capture "what matters" in the customer's language

### Undo
Made a mistake? After saving, you'll see a brief "Undo" option at the top of the page to remove the last entry.

### Work Entries (if enabled)
If work tracking is on, you'll see a toggle between **Demand** and **Work** at the top. Switch to Work mode to record what work the organisation is doing (rather than what customers are asking for).

### Editing an Existing Entry — Classify on the Fly
Every row in the entries list has an **Edit** button. Click it to open the full edit modal covering every field — classification, demand type, handling, failure cause, what matters, the lot. This replaces the old standalone Reclassify page: instead of working through a separate queue, you:

- Pick the filter chip that matches what you're looking for (e.g. *"Needs classification"*)
- Click **Edit** on any row in the filtered list
- Fill the missing fields and save

If a demand type, handling type, contact method, point of transaction, what-matters category, system condition, or work type is missing, there's a **+ Add new** button right inside the modal. You don't need to detour to Settings mid-session.

---

## Dashboard — Analysis & Insights

The dashboard is where the study comes to life. All charts update in real-time as new entries are captured.

### Date Filters
Use the buttons at the top to filter by time period: **All Time**, **Today**, **7 Days**, **30 Days**, or a **Custom** range.

### Summary Cards
At the top you'll see key metrics:
- **Total Entries** — How many interactions have been captured
- **Value Demand %** — Proportion that is genuine value demand
- **Failure Demand %** — Proportion caused by system failure
- **Perfect %** (when Handling is on) — Value demand handled in one stop. This is the headline measure of system capability.

### Charts & Visualisations

**Value vs Failure** (pie chart)
Shows the overall split. In most services, failure demand is 40–80% of total demand. This is the key insight for leadership.

**Top 10 Demand Types** (bar chart)
The most common types of demand, colour-coded green (value) and red (failure). Shows where volume concentrates.

**Demand Over Time** (line chart)
Tracks value and failure demand day by day. Useful for spotting patterns, peaks, or trends.

**Failure Flow** (Sankey diagram, when Classification is on)
This is one of the most powerful visualisations. It shows how original value demands generate failure demands. For example, you might see that "Report a repair" → generates → "Chase progress" at high volume. **Click on any flow** to see the system conditions (causes) behind it.

**Failure Causes / System Conditions** (bar chart, when Classification is on)
The top 10 system conditions causing failure demand, ranked by frequency. These are the things to fix.

**Handling Breakdown** (pie chart, when Handling is on)
Shows how demand is being dealt with — one-stop vs pass-on vs pass-back.

**Point of Transaction** (stacked bar chart)
If you have multiple points of transaction, shows value/failure split at each.

**Contact Methods** (pie chart)
Distribution of demand across channels.

**What Matters: Themes** (word cloud)
A visual display of what customers say matters, with larger words appearing more frequently. Shown in green — because what matters to customers is always important and positive in Vanguard terms.

**What Matters: Notes** (text list)
The actual verbatim notes about what matters, grouped by date or by demand type. Searchable and scrollable.

**Data Collection Coverage** (table)
Shows each collector's contribution: total entries, last capture date. Helps you monitor whether data collection is consistent.

### Tabs: Demand / Work / Overview
If work tracking is enabled and you have work entries, three tabs appear:
- **Demand** — Customer demand analysis (the default view)
- **Work** — What work the organisation is doing, and how much is value work vs failure work
- **Overview** — Combined view of demand and work together

---

## Importing & Exporting Data

### Download Template
Click **"Download Template"** on the dashboard to get an empty XLSX spreadsheet with the correct column headers. Fill it in with existing data and upload it.

### Upload XLSX
Click the upload button to import data from a spreadsheet. The column headers must match:
- Date, Entry Type, Demand (Verbatim), Classification, Demand Type, Work Type, Handling, Contact Method, Point of Transaction, What Matters Category, Original Value Demand, Failure Cause (System Condition), What Matters (Notes), Collector

**Classification values:** Use "Value", "Failure", or "?" (also supports Danish: "Værdi" / "Ikke-værdiskabende", Swedish: "Värde" / "Icke-värdeskapande", German: "Wert" / "Fehlernachfrage")

### Export XLSX
Downloads all study data as a spreadsheet with three sheets:
1. **All entries** — Every captured entry with all fields
2. **Summary** — Key metrics
3. **Failure Flow** — Cross-tabulation of which value demands generate which failure demands

### Export PowerPoint (PPTX)
Creates a presentation-ready slide deck with:
1. **Title slide** with study name and date range
2. **Executive Summary** — Auto-generated bullet points with key findings
3. **Key Metrics** — Visual cards with the headline numbers
4. **Top Demand Types** — Bar chart
5. **Failure Flows** — Which value demands create which failures
6. Additional slides for handling, contact methods, and what matters

This is designed to be shared directly with leadership teams and stakeholders.

---

## Languages

The tool supports four languages:
- 🇬🇧 English
- 🇩🇰 Dansk (Danish)
- 🇸🇪 Svenska (Swedish)
- 🇩🇪 Deutsch (German)

Switch language using the dropdown in the top navigation. The language choice is remembered between sessions.

---

## Running a Study — Consultant Checklist

### Before Starting
- [ ] Create the study and set a consultant PIN
- [ ] Write a clear purpose statement
- [ ] Define initial value and failure demand types (you can add more later, including inline from the capture form)
- [ ] Set the primary contact method
- [ ] Add points of transaction if relevant
- [ ] Switch on the **Classification** toggle if you want value/failure capture from day one (leave it off if you just want to listen first)
- [ ] Share the access code with your collection team

### During Collection (typically 1–2 weeks)
- [ ] Monitor the dashboard daily for emerging patterns
- [ ] Add new demand types as new patterns appear (inline from the Capture form or Edit modal)
- [ ] Check the Data Collection Coverage table to ensure consistent collection
- [ ] Switch on **Handling** once the team is comfortable with classification
- [ ] Use the filter chips on Capture ("Needs classification", "Needs handling") and click **Edit** on rows to fill in missing fields

### Analysis & Reporting
- [ ] Switch on **Failure → Value linking** to trace failure flows
- [ ] Review the Failure Flow Sankey diagram — identify the biggest flows
- [ ] Click on flows to see the system conditions (root causes)
- [ ] Review the What Matters themes — this is the customer's voice
- [ ] Export a PPTX presentation for leadership
- [ ] Export XLSX data for deeper analysis if needed

### Key Questions the Dashboard Answers
1. **What proportion of demand is failure demand?** → Value vs Failure split
2. **What are the most common types of demand?** → Top 10 Demand Types
3. **How capable is the system?** → Perfect % (value + one-stop)
4. **What system conditions are creating failure?** → Failure Causes chart
5. **Which value demands generate the most failure?** → Failure Flow diagram
6. **What matters to customers?** → What Matters word cloud and notes
7. **Is demand changing over time?** → Demand Over Time chart

---

## Troubleshooting

**"Study not found"** when joining
→ Check the access code is exactly 6 characters and correctly entered

**Can't access Settings**
→ The study has a consultant PIN. Enter the PIN to unlock.

**A capture field I expected is missing**
→ Check Settings → *What are we capturing?* and turn on the matching toggle (Classification, Handling, Value linking, etc.). The field will appear on the Capture form, the columns on the entries list, and the matching filter chip.

**XLSX import errors**
→ Make sure column headers match exactly. Classification must be "Value", "Failure", or "?" (or the equivalent in your study's language). Demand type and handling labels must match what's configured in Settings.

**Dashboard shows no data**
→ Check the date filter — you may have a narrow range selected. Try "All Time".

---

*Understanding Demand is built on the Vanguard Method. For more about the method, visit vanguard-method.net*
