-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "contact_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handling_types" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"operational_definition" text
);
--> statement-breakpoint
CREATE TABLE "demand_types" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"operational_definition" text
);
--> statement-breakpoint
CREATE TABLE "what_matters_types" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"operational_definition" text
);
--> statement-breakpoint
CREATE TABLE "demand_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"verbatim" text NOT NULL,
	"classification" text NOT NULL,
	"handling_type_id" text,
	"demand_type_id" text,
	"contact_method_id" text,
	"what_matters_type_id" text,
	"failure_cause" text,
	"what_matters" text,
	"original_value_demand_type_id" text,
	"point_of_transaction_id" text,
	"collector_name" text,
	"entry_type" text DEFAULT 'demand' NOT NULL,
	"work_type_id" text,
	"linked_value_demand_entry_id" text
);
--> statement-breakpoint
CREATE TABLE "studies" (
	"id" text PRIMARY KEY NOT NULL,
	"access_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"one_stop_handling_type" text,
	"created_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"primary_contact_method_id" text,
	"primary_point_of_transaction_id" text,
	"work_tracking_enabled" boolean DEFAULT false NOT NULL,
	"active_layer" integer DEFAULT 1 NOT NULL,
	"consultant_pin" text,
	"purpose" text DEFAULT '',
	CONSTRAINT "studies_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE "points_of_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_types" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demand_entry_what_matters" (
	"id" text PRIMARY KEY NOT NULL,
	"demand_entry_id" text NOT NULL,
	"what_matters_type_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_methods" ADD CONSTRAINT "contact_methods_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handling_types" ADD CONSTRAINT "handling_types_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_types" ADD CONSTRAINT "demand_types_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "what_matters_types" ADD CONSTRAINT "what_matters_types_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entries" ADD CONSTRAINT "demand_entries_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entries" ADD CONSTRAINT "demand_entries_handling_type_id_handling_types_id_fk" FOREIGN KEY ("handling_type_id") REFERENCES "public"."handling_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entries" ADD CONSTRAINT "demand_entries_demand_type_id_demand_types_id_fk" FOREIGN KEY ("demand_type_id") REFERENCES "public"."demand_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entries" ADD CONSTRAINT "demand_entries_contact_method_id_contact_methods_id_fk" FOREIGN KEY ("contact_method_id") REFERENCES "public"."contact_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entries" ADD CONSTRAINT "demand_entries_what_matters_type_id_what_matters_types_id_fk" FOREIGN KEY ("what_matters_type_id") REFERENCES "public"."what_matters_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entries" ADD CONSTRAINT "demand_entries_original_value_demand_type_id_demand_types_id_fk" FOREIGN KEY ("original_value_demand_type_id") REFERENCES "public"."demand_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entries" ADD CONSTRAINT "demand_entries_work_type_id_work_types_id_fk" FOREIGN KEY ("work_type_id") REFERENCES "public"."work_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entries" ADD CONSTRAINT "demand_entries_point_of_transaction_id_points_of_transaction_id" FOREIGN KEY ("point_of_transaction_id") REFERENCES "public"."points_of_transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_of_transaction" ADD CONSTRAINT "points_of_transaction_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_types" ADD CONSTRAINT "work_types_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entry_what_matters" ADD CONSTRAINT "demand_entry_what_matters_demand_entry_id_demand_entries_id_fk" FOREIGN KEY ("demand_entry_id") REFERENCES "public"."demand_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_entry_what_matters" ADD CONSTRAINT "demand_entry_what_matters_what_matters_type_id_what_matters_typ" FOREIGN KEY ("what_matters_type_id") REFERENCES "public"."what_matters_types"("id") ON DELETE no action ON UPDATE no action;
*/