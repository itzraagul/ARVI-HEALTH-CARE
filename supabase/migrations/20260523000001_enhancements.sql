/*
  ═══════════════════════════════════════════════════════════════════
  ARVI Ortho & Child Care — Complete Migration (v3 — Single Table Auth)
  
  HOW TO RUN:
  1. Go to supabase.com → your project → SQL Editor → New Query
  2. Paste this entire file → click Run
  3. Expected result: "Success. No rows returned."
  
  KEY CHANGE: password_hash is now a column on admin_users itself.
  This avoids all RLS issues with a separate admin_passwords table.
  ═══════════════════════════════════════════════════════════════════
*/

-- ── 1. Create all tables ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  patient_phone text NOT NULL,
  patient_email text,
  doctor text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  subject text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  review text NOT NULL,
  doctor text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Clinic',
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  thumbnail_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  category text NOT NULL DEFAULT 'general',
  cover_image text,
  author text NOT NULL DEFAULT 'ARVI Clinic',
  is_published boolean NOT NULL DEFAULT false,
  reading_time int DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- admin_users now includes password_hash directly (no separate passwords table needed)
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'clinic_assistant',
  full_name text NOT NULL,
  email text NOT NULL DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Keep admin_passwords table for backward compat (won't be used for login)
CREATE TABLE IF NOT EXISTS admin_passwords (
  user_id uuid PRIMARY KEY,
  password_hash text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ── 2. Add missing columns safely ────────────────────────────────
ALTER TABLE admin_users    ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT '';
ALTER TABLE appointments   ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE gallery_items  ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- ── 3. Enable RLS on all tables ───────────────────────────────────
ALTER TABLE appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_passwords  ENABLE ROW LEVEL SECURITY;

-- ── 4. Drop ALL existing policies (clean slate) ───────────────────
DO $$ DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE tablename IN (
      'appointments','contact_messages','testimonials','gallery_items',
      'blog_posts','admin_users','admin_sessions','admin_passwords'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── 5. Create wide-open anon policies (frontend uses anon key) ────

CREATE POLICY "anon_apt_ins" ON appointments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_apt_sel" ON appointments FOR SELECT TO anon USING (true);
CREATE POLICY "anon_apt_upd" ON appointments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_apt_del" ON appointments FOR DELETE TO anon USING (true);

CREATE POLICY "anon_msg_ins" ON contact_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_msg_sel" ON contact_messages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_msg_upd" ON contact_messages FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_tes_sel" ON testimonials FOR SELECT TO anon USING (true);
CREATE POLICY "anon_tes_ins" ON testimonials FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_tes_upd" ON testimonials FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_gal_sel" ON gallery_items FOR SELECT TO anon USING (true);
CREATE POLICY "anon_gal_ins" ON gallery_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_gal_upd" ON gallery_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_gal_del" ON gallery_items FOR DELETE TO anon USING (true);

CREATE POLICY "anon_blg_sel" ON blog_posts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_blg_ins" ON blog_posts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_blg_upd" ON blog_posts FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- admin_users: anon can read all columns (including password_hash for login)
CREATE POLICY "anon_aus_sel" ON admin_users FOR SELECT TO anon USING (true);
CREATE POLICY "anon_aus_ins" ON admin_users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_aus_upd" ON admin_users FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_aus_del" ON admin_users FOR DELETE TO anon USING (true);

CREATE POLICY "anon_ase_sel" ON admin_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_ase_ins" ON admin_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_ase_del" ON admin_sessions FOR DELETE TO anon USING (true);

CREATE POLICY "anon_apw_sel" ON admin_passwords FOR SELECT TO anon USING (true);
CREATE POLICY "anon_apw_ins" ON admin_passwords FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_apw_upd" ON admin_passwords FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ── 6. Seed admin users (with password_hash in same row) ──────────
-- Passwords are stored as plain text here.
-- auth.ts accepts plain text OR sha256 hash — both work.
-- After first login, use "Change Password" to set a hashed password.

INSERT INTO admin_users (username, password_hash, role, full_name, email, is_active)
VALUES
  ('admin',          'Admin@123', 'master_admin',    'Master Admin',          'admin@arviclinic.com',   true),
  ('aravind',        'Pass@123',  'doctor_aravind',  'Dr. Aravindasamy M',    'aravind@arviclinic.com', true),
  ('vishali',        'Pass@123',  'doctor_vishali',  'Dr. Vishali G',         'vishali@arviclinic.com', true),
  ('CA',             'Pass@123',  'clinic_assistant','Clinic Assistant',       'ca@arviclinic.com',      true),
  ('Physiotherapist','Pass@123',  'physiotherapist', 'Physiotherapist Expert','physio@arviclinic.com',  true)
ON CONFLICT (username) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      role          = EXCLUDED.role,
      full_name     = EXCLUDED.full_name,
      email         = EXCLUDED.email,
      is_active     = EXCLUDED.is_active;

-- ── 7. Seed testimonials ──────────────────────────────────────────
INSERT INTO testimonials (patient_name, rating, review, doctor) VALUES
  ('Rajesh Kumar',    5, 'Dr. Aravindasamy treated my knee injury with exceptional skill. I am back to walking pain-free within weeks. Highly recommended!', 'Dr. Aravindasamy'),
  ('Priya Suresh',    5, 'Dr. Vishali is amazing with children. My son was scared of doctors but she made him feel so comfortable. Best paediatrician in Porur!', 'Dr. Vishali'),
  ('Meenakshi Rajan', 5, 'Excellent clinic with modern facilities. The staff is caring and the doctors are highly knowledgeable. Very satisfied with the treatment.', 'Dr. Aravindasamy'),
  ('Arjun Nair',      5, 'My daughter received vaccination here. Dr. Vishali explained everything clearly. Very professional and child-friendly environment.', 'Dr. Vishali'),
  ('Sundar Krishnan', 5, 'After years of back pain, Dr. Aravindasamy''s treatment has given me a new life. The physiotherapy support is also excellent.', 'Dr. Aravindasamy')
ON CONFLICT DO NOTHING;

-- ── 8. Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_apt_status   ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_apt_doctor   ON appointments(doctor);
CREATE INDEX IF NOT EXISTS idx_apt_date     ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_aus_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_ase_token    ON admin_sessions(session_token);

-- ── 9. Storage buckets ────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('clinic-images', 'clinic-images', true, 10485760,
        ARRAY['image/jpeg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('clinic-videos', 'clinic-videos', true, 52428800,
        ARRAY['video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "pub_r_img"  ON storage.objects;
  DROP POLICY IF EXISTS "anon_w_img" ON storage.objects;
  DROP POLICY IF EXISTS "anon_d_img" ON storage.objects;
  DROP POLICY IF EXISTS "pub_r_vid"  ON storage.objects;
  DROP POLICY IF EXISTS "anon_w_vid" ON storage.objects;
  DROP POLICY IF EXISTS "anon_d_vid" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "pub_r_img"  ON storage.objects FOR SELECT TO public USING (bucket_id = 'clinic-images');
CREATE POLICY "anon_w_img" ON storage.objects FOR INSERT TO anon   WITH CHECK (bucket_id = 'clinic-images');
CREATE POLICY "anon_d_img" ON storage.objects FOR DELETE TO anon   USING (bucket_id = 'clinic-images');
CREATE POLICY "pub_r_vid"  ON storage.objects FOR SELECT TO public USING (bucket_id = 'clinic-videos');
CREATE POLICY "anon_w_vid" ON storage.objects FOR INSERT TO anon   WITH CHECK (bucket_id = 'clinic-videos');
CREATE POLICY "anon_d_vid" ON storage.objects FOR DELETE TO anon   USING (bucket_id = 'clinic-videos');

/*
  ✅ DONE — Expected: "Success. No rows returned."

  Login credentials:
  ┌─────────────────┬───────────────┬────────────┐
  │ Role            │ Username      │ Password   │
  ├─────────────────┼───────────────┼────────────┤
  │ Master Admin    │ admin         │ Admin@123  │
  │ Dr. Aravindasamy│ aravind       │ Pass@123   │
  │ Dr. Vishali     │ vishali       │ Pass@123   │
  │ Clinic Assistant│ CA            │ Pass@123   │
  │ Physiotherapist │ Physiotherapist│ Pass@123  │
  └─────────────────┴───────────────┴────────────┘

  Usernames are NOT case-sensitive (Admin = admin = ADMIN).
*/
