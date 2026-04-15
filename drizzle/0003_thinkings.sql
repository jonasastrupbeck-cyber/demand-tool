-- Thinking taxonomy: study-scoped library of "the thinking that produced the system conditions".
-- Mirrors system_conditions exactly (table shape + junction).

CREATE TABLE IF NOT EXISTS "thinkings" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"label" text NOT NULL,
	"operational_definition" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thinkings" ADD CONSTRAINT "thinkings_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "demand_entry_thinkings" (
	"id" text PRIMARY KEY NOT NULL,
	"demand_entry_id" text NOT NULL,
	"thinking_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "demand_entry_thinkings" ADD CONSTRAINT "demand_entry_thinkings_demand_entry_id_demand_entries_id_fk" FOREIGN KEY ("demand_entry_id") REFERENCES "public"."demand_entries"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "demand_entry_thinkings" ADD CONSTRAINT "demand_entry_thinkings_thinking_id_thinkings_id_fk" FOREIGN KEY ("thinking_id") REFERENCES "public"."thinkings"("id") ON DELETE no action ON UPDATE no action;
