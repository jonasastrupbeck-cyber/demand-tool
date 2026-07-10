-- Broker/Direct channel on cases (2026-07-10)
-- Per-customer (case) channel: 'broker' or 'direct'. When broker, capture the
-- broker's firm + contact name. Opt-in per study (broker_channel_enabled).
-- Additive only.

ALTER TABLE cases   ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE cases   ADD COLUMN IF NOT EXISTS firm_name TEXT;
ALTER TABLE cases   ADD COLUMN IF NOT EXISTS broker_name TEXT;

ALTER TABLE studies ADD COLUMN IF NOT EXISTS broker_channel_enabled BOOLEAN NOT NULL DEFAULT false;
