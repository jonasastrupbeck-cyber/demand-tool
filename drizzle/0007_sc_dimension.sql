ALTER TABLE "demand_entry_system_conditions" ADD COLUMN "dimension" text NOT NULL DEFAULT 'hinders';
ALTER TABLE "demand_entry_system_conditions" ADD CONSTRAINT "demand_entry_system_conditions_demand_entry_id_system_condition_id_unique" UNIQUE ("demand_entry_id", "system_condition_id");
