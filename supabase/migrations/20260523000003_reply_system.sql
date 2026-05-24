/*
  ARVI — Migration v5: Reply system for contact messages
  Run in Supabase SQL Editor after previous migrations.
*/

-- Add reply columns to contact_messages
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_at timestamptz;

-- Allow anon to update contact_messages (for saving replies)
DROP POLICY IF EXISTS "anon_msg_upd" ON contact_messages;
CREATE POLICY "anon_msg_upd" ON contact_messages FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Confirm completed
SELECT 'Reply system migration complete' as status;
