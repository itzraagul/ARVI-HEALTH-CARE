/*
  ARVI — Migration v6: Patient Stories
  Run in Supabase SQL Editor after previous migrations.
*/

-- Patient stories table
CREATE TABLE IF NOT EXISTS patient_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  treatment text NOT NULL,
  description text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Patient story media table (multiple files per patient)
CREATE TABLE IF NOT EXISTS patient_story_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES patient_stories(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE patient_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_story_media ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "anon_ps_sel" ON patient_stories FOR SELECT TO anon USING (true);
CREATE POLICY "anon_ps_ins" ON patient_stories FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_ps_upd" ON patient_stories FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_ps_del" ON patient_stories FOR DELETE TO anon USING (true);

CREATE POLICY "anon_psm_sel" ON patient_story_media FOR SELECT TO anon USING (true);
CREATE POLICY "anon_psm_ins" ON patient_story_media FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_psm_upd" ON patient_story_media FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_psm_del" ON patient_story_media FOR DELETE TO anon USING (true);

-- Storage bucket for patient story media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('patient-stories', 'patient-stories', true, 20971520,
        ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm',
              'application/pdf','application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "pub_r_ps"  ON storage.objects FOR SELECT TO public USING (bucket_id = 'patient-stories');
CREATE POLICY "anon_w_ps" ON storage.objects FOR INSERT TO anon   WITH CHECK (bucket_id = 'patient-stories');
CREATE POLICY "anon_d_ps" ON storage.objects FOR DELETE TO anon   USING (bucket_id = 'patient-stories');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_psm_story_id ON patient_story_media(story_id);

SELECT 'Patient stories migration complete' as status;
