-- ══════════════════════════════════════════════════════════════════════════════
-- ARVI HEALTH CARE — COMPLETE DB MIGRATION
-- ──────────────────────────────────────────────────────────────────────────────
-- HOW TO RUN:
--   1. Go to https://supabase.com → Your Project → SQL Editor
--   2. Click "New Query"
--   3. Paste this ENTIRE file
--   4. Click "Run" (green button)
--   5. You should see the verification output at the bottom:
--      leave_management | 0
--      flash_news        | 1
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Step 1: Drop old tables completely (fresh start) ──────────────────────────
DROP TABLE IF EXISTS leave_management CASCADE;
DROP TABLE IF EXISTS flash_news CASCADE;

-- ── Step 2: Create leave_management ──────────────────────────────────────────
CREATE TABLE leave_management (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist      text        NOT NULL
                              CHECK (specialist IN (
                                'doctor_aravind',
                                'doctor_vishali',
                                'physiotherapist',
                                'clinic_holiday'
                              )),
  start_date      date        NOT NULL,
  end_date        date        NOT NULL,
  full_day        boolean     NOT NULL DEFAULT true,
  half_day_period text        CHECK (half_day_period IN ('first_half','second_half')),
  time_from       time,
  time_to         time,
  reason          text,
  status          text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','cancelled')),
  created_by      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE leave_management ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leave_sel" ON leave_management FOR SELECT TO anon USING (true);
CREATE POLICY "leave_ins" ON leave_management FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "leave_upd" ON leave_management FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "leave_del" ON leave_management FOR DELETE TO anon USING (true);

CREATE INDEX idx_leave_dates      ON leave_management(start_date, end_date);
CREATE INDEX idx_leave_specialist ON leave_management(specialist);
CREATE INDEX idx_leave_status     ON leave_management(status);

-- ── Step 3: Create flash_news ─────────────────────────────────────────────────
CREATE TABLE flash_news (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message     text        NOT NULL DEFAULT '',
  is_active   boolean     NOT NULL DEFAULT false,
  speed       text        NOT NULL DEFAULT 'normal'
                          CHECK (speed IN ('slow','normal','fast')),
  theme       text        NOT NULL DEFAULT 'default'
                          CHECK (theme IN ('default','emergency','info','success')),
  created_by  text,
  started_at  timestamptz,
  stopped_at  timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE flash_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fn_sel" ON flash_news FOR SELECT TO anon USING (true);
CREATE POLICY "fn_ins" ON flash_news FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "fn_upd" ON flash_news FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "fn_del" ON flash_news FOR DELETE TO anon USING (true);

-- Insert one default row so admin always has a row to UPDATE (not insert)
INSERT INTO flash_news (message, is_active, speed, theme)
VALUES ('', false, 'normal', 'default');

-- ── Step 4: Verify (you should see 2 rows in the output) ─────────────────────
SELECT 'leave_management' AS table_name, COUNT(*) AS row_count FROM leave_management
UNION ALL
SELECT 'flash_news',                      COUNT(*)              FROM flash_news;
