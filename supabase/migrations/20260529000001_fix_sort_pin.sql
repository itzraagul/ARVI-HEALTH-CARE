-- Fix sort_order column: integer → bigint (Date.now() exceeds integer range)
ALTER TABLE patient_story_media ALTER COLUMN sort_order TYPE bigint;

-- Ensure is_pinned columns exist with correct defaults
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
ALTER TABLE patient_story_media ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Create indexes for fast pinned-first ordering
CREATE INDEX IF NOT EXISTS idx_gallery_pinned ON gallery_items(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_media_pinned ON patient_story_media(story_id, is_pinned DESC, created_at DESC);

SELECT 'Fix sort_order and pin indexes complete' as status;
