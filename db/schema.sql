-- ManasikPro schema
-- Run once against the Neon database: npm run db:migrate

-- One row per client agency. Every business table below carries a
-- company_id so agencies never see each other's data, even though they all
-- share the same database.
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_users (
  username TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_leaders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  group_id TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS pilgrims (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  nationality TEXT NOT NULL,
  nationality_code TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  passport_expiry TEXT NOT NULL,
  passport_status TEXT NOT NULL,
  visa_status TEXT NOT NULL,
  visa_number TEXT,
  visa_expiry TEXT,
  flight_status TEXT NOT NULL,
  flight_number TEXT,
  flight_date TEXT,
  hotel_makkah TEXT,
  hotel_madinah TEXT,
  room_number TEXT,
  room_type TEXT,
  bus_number INT,
  seat_number TEXT,
  group_id TEXT NOT NULL REFERENCES group_leaders(group_id),
  payment_total NUMERIC NOT NULL DEFAULT 0,
  -- Staff-set label (paid/partial/overdue/pending). "Overdue" reflects a
  -- schedule judgment call that isn't derivable from amounts alone; the
  -- actual amount paid is always computed from the payments table, never
  -- stored here, so the two can't drift apart.
  payment_status TEXT NOT NULL DEFAULT 'pending',
  gender TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  age INT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  emergency_phone TEXT NOT NULL,
  mahram_id TEXT,
  attendance_status TEXT NOT NULL DEFAULT 'not-checked',
  registered_at TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per payment received. payment_paid / payment_status on a pilgrim
-- are derived from this table at query time instead of being stored
-- redundantly (avoids the two ever drifting apart).
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  pilgrim_id TEXT NOT NULL REFERENCES pilgrims(id) ON DELETE CASCADE,
  paid_on DATE NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'cleared'
);

CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  stars INT NOT NULL,
  total_rooms INT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS buses (
  id TEXT PRIMARY KEY,
  number INT NOT NULL,
  capacity INT NOT NULL,
  driver TEXT NOT NULL,
  route TEXT NOT NULL,
  group_id TEXT REFERENCES group_leaders(group_id)
);

CREATE TABLE IF NOT EXISTS flights (
  id TEXT PRIMARY KEY,
  flight_number TEXT NOT NULL,
  airline TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  flight_date TEXT NOT NULL,
  flight_time TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign running costs (hotel deposits, flight blocks, staff, etc). Kept
-- separate from `payments`, which is money coming IN from pilgrims.
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  spent_on DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pilgrims ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

-- Multi-tenant separation: every business table gets a company_id, existing
-- rows are backfilled onto a first company so nothing currently in use
-- breaks, then the column is locked to NOT NULL.
INSERT INTO companies (id, name) VALUES ('CO-001', 'ManasikPro') ON CONFLICT (id) DO NOTHING;

ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);
UPDATE staff_users SET company_id = 'CO-001' WHERE company_id IS NULL;
ALTER TABLE staff_users ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE group_leaders ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);
UPDATE group_leaders SET company_id = 'CO-001' WHERE company_id IS NULL;
ALTER TABLE group_leaders ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE pilgrims ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);
UPDATE pilgrims SET company_id = 'CO-001' WHERE company_id IS NULL;
ALTER TABLE pilgrims ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE hotels ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);
UPDATE hotels SET company_id = 'CO-001' WHERE company_id IS NULL;
ALTER TABLE hotels ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE buses ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);
UPDATE buses SET company_id = 'CO-001' WHERE company_id IS NULL;
ALTER TABLE buses ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE flights ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);
UPDATE flights SET company_id = 'CO-001' WHERE company_id IS NULL;
ALTER TABLE flights ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);
UPDATE activity_log SET company_id = 'CO-001' WHERE company_id IS NULL;
ALTER TABLE activity_log ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);
UPDATE expenses SET company_id = 'CO-001' WHERE company_id IS NULL;
ALTER TABLE expenses ALTER COLUMN company_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pilgrims_group_id ON pilgrims(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_pilgrim_id ON payments(pilgrim_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_spent_on ON expenses(spent_on DESC);
CREATE INDEX IF NOT EXISTS idx_pilgrims_company_id ON pilgrims(company_id);
CREATE INDEX IF NOT EXISTS idx_group_leaders_company_id ON group_leaders(company_id);
CREATE INDEX IF NOT EXISTS idx_hotels_company_id ON hotels(company_id);
CREATE INDEX IF NOT EXISTS idx_buses_company_id ON buses(company_id);
CREATE INDEX IF NOT EXISTS idx_flights_company_id ON flights(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_company_id ON activity_log(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_company_id ON staff_users(company_id);

-- payment_paid is always summed from real payment rows here, never stored
-- on the pilgrim itself, so the displayed "paid" amount can't drift from
-- the actual transaction history.
-- Dropped and recreated (not CREATE OR REPLACE) because adding company_id
-- to pilgrims shifts every column position after it, which CREATE OR
-- REPLACE VIEW rejects as an implicit column rename.
DROP VIEW IF EXISTS pilgrims_with_paid;
CREATE VIEW pilgrims_with_paid AS
SELECT p.*, COALESCE(pay.paid, 0) AS payment_paid
FROM pilgrims p
LEFT JOIN (
  SELECT pilgrim_id, SUM(amount) AS paid FROM payments WHERE status = 'cleared' GROUP BY pilgrim_id
) pay ON pay.pilgrim_id = p.id;
