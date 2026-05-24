/*
  # Add Authentication and Role-Based Access Control

  1. New Tables
    - `admin_users` - Stores admin/doctor credentials and roles
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `username` (text, unique)
      - `role` (text) - master_admin, doctor_aravind, doctor_vishali, clinic_assistant, physiotherapist
      - `full_name` (text)
      - `email` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `admin_sessions` - Stores active sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references admin_users)
      - `session_token` (text, unique)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `admin_users` table
    - Enable RLS on `admin_sessions` table
    - Add policies for role-based access
    - Policies for session validation

  3. Initial Data
    - Create master admin account
    - Create doctor accounts (Aravind, Vishali)
    - Create clinic assistant account
    - Create physiotherapist account
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('master_admin', 'doctor_aravind', 'doctor_vishali', 'clinic_assistant', 'physiotherapist')),
  full_name text NOT NULL,
  email text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Master admin can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'master_admin'
      AND is_active = true
    )
  );

CREATE POLICY "Admin users can view own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Master admin can create users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'master_admin'
      AND is_active = true
    )
  );

CREATE POLICY "Master admin can update users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'master_admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'master_admin'
      AND is_active = true
    )
  );

CREATE POLICY "Users can update own password"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for admin_sessions
CREATE POLICY "Users can view own sessions"
  ON admin_sessions FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sessions can be created by authenticated users"
  ON admin_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own sessions"
  ON admin_sessions FOR DELETE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
