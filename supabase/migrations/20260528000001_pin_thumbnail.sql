-- Add is_pinned to gallery_items
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Add is_pinned and thumbnail_url to patient_story_media
ALTER TABLE patient_story_media ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
ALTER TABLE patient_story_media ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE patient_story_media ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE patient_story_media ALTER COLUMN created_at SET DEFAULT now();

-- Update storage bucket limits: 200MB, include video types
UPDATE storage.buckets SET
  file_size_limit = 209715200,
  allowed_mime_types = ARRAY[
    'image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
    'video/mp4','video/webm','video/quicktime','video/x-msvideo','video/mpeg',
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
WHERE id = 'patient-stories';

-- Also increase clinic-videos bucket to 200MB
UPDATE storage.buckets SET file_size_limit = 209715200 WHERE id = 'clinic-videos';

SELECT 'Pin + thumbnail migration complete' as status;
