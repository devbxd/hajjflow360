-- ManasikPro schema
-- Run once against the Neon database: npm run db:migrate

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

CREATE INDEX IF NOT EXISTS idx_pilgrims_group_id ON pilgrims(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_pilgrim_id ON payments(pilgrim_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_spent_on ON expenses(spent_on DESC);

-- payment_paid is always summed from real payment rows here, never stored
-- on the pilgrim itself, so the displayed "paid" amount can't drift from
-- the actual transaction history.
CREATE OR REPLACE VIEW pilgrims_with_paid AS
SELECT p.*, COALESCE(pay.paid, 0) AS payment_paid
FROM pilgrims p
LEFT JOIN (
  SELECT pilgrim_id, SUM(amount) AS paid FROM payments WHERE status = 'cleared' GROUP BY pilgrim_id
) pay ON pay.pilgrim_id = p.id;
