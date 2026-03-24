import { sqlite } from './db';

export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS studies (
      id TEXT PRIMARY KEY,
      access_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      one_stop_handling_type TEXT,
      created_at INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS handling_types (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES studies(id),
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS demand_types (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES studies(id),
      category TEXT NOT NULL CHECK(category IN ('value', 'failure')),
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS contact_methods (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES studies(id),
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS demand_entries (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES studies(id),
      created_at INTEGER NOT NULL,
      verbatim TEXT NOT NULL,
      classification TEXT NOT NULL CHECK(classification IN ('value', 'failure')),
      handling_type_id TEXT REFERENCES handling_types(id),
      demand_type_id TEXT REFERENCES demand_types(id),
      contact_method_id TEXT REFERENCES contact_methods(id),
      failure_cause TEXT,
      what_matters TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_entries_study ON demand_entries(study_id);
    CREATE INDEX IF NOT EXISTS idx_entries_created ON demand_entries(created_at);
    CREATE INDEX IF NOT EXISTS idx_handling_types_study ON handling_types(study_id);
    CREATE INDEX IF NOT EXISTS idx_demand_types_study ON demand_types(study_id);
    CREATE INDEX IF NOT EXISTS idx_contact_methods_study ON contact_methods(study_id);

    CREATE TABLE IF NOT EXISTS what_matters_types (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES studies(id),
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_what_matters_types_study ON what_matters_types(study_id);
  `);

  // Migrations for existing databases
  try {
    sqlite.exec(`ALTER TABLE demand_entries ADD COLUMN contact_method_id TEXT REFERENCES contact_methods(id)`);
  } catch { /* already exists */ }
  try {
    sqlite.exec(`ALTER TABLE demand_entries ADD COLUMN what_matters_type_id TEXT REFERENCES what_matters_types(id)`);
  } catch { /* already exists */ }
}
