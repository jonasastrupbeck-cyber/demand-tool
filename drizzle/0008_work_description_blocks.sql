CREATE TABLE "work_description_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"demand_entry_id" text NOT NULL,
	"tag" text NOT NULL,
	"text" text NOT NULL,
	"sort_order" integer NOT NULL DEFAULT 0
);
ALTER TABLE "work_description_blocks" ADD CONSTRAINT "work_description_blocks_demand_entry_id_demand_entries_id_fk" FOREIGN KEY ("demand_entry_id") REFERENCES "demand_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
