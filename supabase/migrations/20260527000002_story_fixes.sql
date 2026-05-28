-- Add file_name column to patient_story_media
ALTER TABLE patient_story_media ADD COLUMN IF NOT EXISTS file_name text;

-- Ensure created_at has default on patient_story_media
ALTER TABLE patient_story_media ALTER COLUMN created_at SET DEFAULT now();

-- Update storage bucket to allow 200MB files and include more mime types
UPDATE storage.buckets SET
  file_size_limit = 209715200,
  allowed_mime_types = ARRAY[
    'image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
    'video/mp4','video/webm','video/quicktime','video/x-msvideo','video/mpeg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
WHERE id = 'patient-stories';

SELECT 'Story fixes migration complete' as status;
