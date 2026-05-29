-- ── Drop old leave_management and recreate with improved schema ───────────────
DROP TABLE IF EXISTS leave_management CASCADE;

CREATE TABLE leave_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist text NOT NULL,           -- 'doctor_aravind' | 'doctor_vishali' | 'physiotherapist' | 'clinic_holiday'
  start_date date NOT NULL,
  end_date date NOT NULL,
  full_day boolean NOT NULL DEFAULT true,
  half_day_period text CHECK (half_day_period IN ('first_half', 'second_half')),  -- used when full_day = false
  time_from time,                     -- optional time range start
  time_to   time,                     -- optional time range end
  reason text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leave_management ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_leave_sel" ON leave_management FOR SELECT TO anon USING (true);
CREATE POLICY "anon_leave_ins" ON leave_management FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_leave_upd" ON leave_management FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_leave_del" ON leave_management FOR DELETE TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_leave_dates     ON leave_management(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_specialist ON leave_management(specialist);
CREATE INDEX IF NOT EXISTS idx_leave_status    ON leave_management(status);

SELECT 'leave_management recreated with specialist model' AS status;
