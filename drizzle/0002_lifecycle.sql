-- Lifecycle feature: optional Customer Lifecycle (tVM) lens
-- Note: also includes the volume_mode column that was previously added directly via drizzle-kit push.

ALTER TABLE "studies" ADD COLUMN IF NOT EXISTS "volume_mode" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "studies" ADD COLUMN IF NOT EXISTS "lifecycle_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lifecycle_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lifecycle_stages" ADD CONSTRAINT "lifecycle_stages_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "demand_types" ADD COLUMN IF NOT EXISTS "lifecycle_stage_id" text;
--> statement-breakpoint
ALTER TABLE "demand_types" ADD COLUMN IF NOT EXISTS "lifecycle_ai_suggestion" text;
--> statement-breakpoint
ALTER TABLE "demand_types" ADD COLUMN IF NOT EXISTS "lifecycle_classified_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "demand_types" ADD CONSTRAINT "demand_types_lifecycle_stage_id_lifecycle_stages_id_fk" FOREIGN KEY ("lifecycle_stage_id") REFERENCES "public"."lifecycle_stages"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "work_types" ADD COLUMN IF NOT EXISTS "lifecycle_stage_id" text;
--> statement-breakpoint
ALTER TABLE "work_types" ADD COLUMN IF NOT EXISTS "lifecycle_ai_suggestion" text;
--> statement-breakpoint
ALTER TABLE "work_types" ADD COLUMN IF NOT EXISTS "lifecycle_classified_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "work_types" ADD CONSTRAINT "work_types_lifecycle_stage_id_lifecycle_stages_id_fk" FOREIGN KEY ("lifecycle_stage_id") REFERENCES "public"."lifecycle_stages"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "demand_entries" ADD COLUMN IF NOT EXISTS "lifecycle_stage_id" text;
--> statement-breakpoint
ALTER TABLE "demand_entries" ADD CONSTRAINT "demand_entries_lifecycle_stage_id_lifecycle_stages_id_fk" FOREIGN KEY ("lifecycle_stage_id") REFERENCES "public"."lifecycle_stages"("id") ON DELETE set null ON UPDATE no action;
