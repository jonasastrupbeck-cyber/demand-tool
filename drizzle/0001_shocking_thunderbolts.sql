CREATE TABLE "demand_entry_system_conditions" (
	"id" text PRIMARY KEY NOT NULL,
	"demand_entry_id" text NOT NULL,
	"system_condition_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_conditions" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"label" text NOT NULL,
	"operational_definition" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "demand_entries" DROP CONSTRAINT "demand_entries_point_of_transaction_id_points_of_transaction_id";
--> statement-breakpoint
ALTER TABLE "demand_entry_what_matters" DROP CONSTRAINT "demand_entry_what_matters_what_matters_type_id_what_matters_typ";
--> statement-breakpoint
ALTER TABLE "studies" ADD COLUMN "system_conditions_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studies" ADD COLUMN "demand_types_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studies" ADD COLUMN "work_types_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "demand_entry_system_conditions" ADD CONSTRAINT "demand_entry_system_conditions_demand_entry_id_demand_entries_id_fk" FOREIGN KEY ("demand_entry_id") REFERENCES "public"."demand_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entry_system_conditions" ADD CONSTRAINT "demand_entry_system_conditions_system_condition_id_system_conditions_id_fk" FOREIGN KEY ("system_condition_id") REFERENCES "public"."system_conditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_conditions" ADD CONSTRAINT "system_conditions_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entries" ADD CONSTRAINT "demand_entries_point_of_transaction_id_points_of_transaction_id_fk" FOREIGN KEY ("point_of_transaction_id") REFERENCES "public"."points_of_transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entry_what_matters" ADD CONSTRAINT "demand_entry_what_matters_what_matters_type_id_what_matters_types_id_fk" FOREIGN KEY ("what_matters_type_id") REFERENCES "public"."what_matters_types"("id") ON DELETE no action ON UPDATE no action;