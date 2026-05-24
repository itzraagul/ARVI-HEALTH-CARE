/*
  ARVI — Migration v4: WhatsApp logs + Google Images album
  Run in Supabase SQL Editor after the base migration.
*/

-- WhatsApp delivery log table
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid,
  patient_name text,
  patient_phone text,
  message_sent text,
  status text DEFAULT 'sent',
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_wa_sel" ON whatsapp_logs;
DROP POLICY IF EXISTS "anon_wa_ins" ON whatsapp_logs;
CREATE POLICY "anon_wa_sel" ON whatsapp_logs FOR SELECT TO anon USING (true);
CREATE POLICY "anon_wa_ins" ON whatsapp_logs FOR INSERT TO anon WITH CHECK (true);

-- Track which appointments already had WA sent (prevent duplicates)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_sent boolean DEFAULT false;

-- Admin settings table (for WA toggle etc.)
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_cfg_sel" ON admin_settings;
DROP POLICY IF EXISTS "anon_cfg_upd" ON admin_settings;
DROP POLICY IF EXISTS "anon_cfg_ins" ON admin_settings;
CREATE POLICY "anon_cfg_sel" ON admin_settings FOR SELECT TO anon USING (true);
CREATE POLICY "anon_cfg_upd" ON admin_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_cfg_ins" ON admin_settings FOR INSERT TO anon WITH CHECK (true);

-- Seed default WA setting
INSERT INTO admin_settings (key, value) VALUES ('whatsapp_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Google Images album: stored as gallery_items with category='Google Images'
-- No extra table needed — reuses gallery_items
-- Just ensure the category column accepts it (already text, no constraint)

CREATE INDEX IF NOT EXISTS idx_wlog_apt ON whatsapp_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_gal_cat  ON gallery_items(category);
