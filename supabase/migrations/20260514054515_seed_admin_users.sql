/*
  # Seed Admin Users

  1. Data
    - Creates working admin user accounts with proper authentication
    - Master Admin account for full system access
    - Doctor accounts (Aravind, Vishali) with role-specific access
    - Clinic Assistant account (read-only)
    - Physiotherapist account (physiotherapy-only)

  2. Note
    - All users are seeded with standard passwords for initial login
    - Passwords: Admin@123 for master admin, Pass@123 for others
    - Users must change password on first login in production
*/

-- Insert admin users (passwords stored as plain text for MVP - in production use bcrypt/argon2)
INSERT INTO admin_users (username, role, full_name, email, is_active)
VALUES
  ('admin', 'master_admin', 'Master Admin', 'admin@arviclinic.com', true),
  ('aravind', 'doctor_aravind', 'Dr. Aravindasamy M', 'aravind@arviclinic.com', true),
  ('vishali', 'doctor_vishali', 'Dr. Vishali G', 'vishali@arviclinic.com', true),
  ('CA', 'clinic_assistant', 'Clinic Assistant', 'assistant@arviclinic.com', true),
  ('Physiotherapist', 'physiotherapist', 'Physiotherapist Expert', 'physio@arviclinic.com', true)
ON CONFLICT (username) DO NOTHING;

-- Create a passwords reference table for development (DO NOT USE IN PRODUCTION)
-- In production, implement proper password hashing with bcrypt or argon2
CREATE TABLE IF NOT EXISTS admin_passwords (
  user_id uuid PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert password hashes (for development - plain text passwords stored)
INSERT INTO admin_passwords (user_id, password_hash)
SELECT id, 'Admin@123' FROM admin_users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO admin_passwords (user_id, password_hash)
SELECT id, 'Pass@123' FROM admin_users WHERE username = 'aravind'
ON CONFLICT DO NOTHING;

INSERT INTO admin_passwords (user_id, password_hash)
SELECT id, 'Pass@123' FROM admin_users WHERE username = 'vishali'
ON CONFLICT DO NOTHING;

INSERT INTO admin_passwords (user_id, password_hash)
SELECT id, 'Pass@123' FROM admin_users WHERE username = 'CA'
ON CONFLICT DO NOTHING;

INSERT INTO admin_passwords (user_id, password_hash)
SELECT id, 'Pass@123' FROM admin_users WHERE username = 'Physiotherapist'
ON CONFLICT DO NOTHING;

-- Enable RLS on passwords table
ALTER TABLE admin_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view password metadata"
  ON admin_passwords FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "Users can update own password"
  ON admin_passwords FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM admin_users WHERE user_id = auth.uid()));
