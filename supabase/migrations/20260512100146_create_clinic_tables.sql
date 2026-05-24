
/*
  # ARVI ORTHO AND CHILD CARE — Initial Schema

  1. New Tables
    - `appointments` — patient appointment requests with status workflow
    - `contact_messages` — inquiries from the Ask Us / Contact pages
    - `blog_posts` — medical blog articles with SEO fields
    - `testimonials` — patient testimonials displayed on homepage
    - `gallery_items` — clinic gallery images/videos
  2. Security
    - RLS enabled on all tables
    - Authenticated users (admins) can read/write all records
    - Public users can insert appointments and contact messages
    - Public can read published blog posts, testimonials, gallery items
*/

-- Appointments
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

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert appointments"
  ON appointments FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can read appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Contact Messages
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

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert contact messages"
  ON contact_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can read contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Blog Posts
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
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published blog posts"
  ON blog_posts FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Authenticated can read all blog posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert blog posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update blog posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  review text NOT NULL,
  doctor text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published testimonials"
  ON testimonials FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Authenticated can read all testimonials"
  ON testimonials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update testimonials"
  ON testimonials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Gallery Items
CREATE TABLE IF NOT EXISTS gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'clinic',
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published gallery items"
  ON gallery_items FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Authenticated can read all gallery items"
  ON gallery_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert gallery items"
  ON gallery_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update gallery items"
  ON gallery_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed testimonials
INSERT INTO testimonials (patient_name, rating, review, doctor) VALUES
  ('Rajesh Kumar', 5, 'Dr. Aravindasamy treated my knee injury with exceptional skill. I am back to walking pain-free within weeks. Highly recommended!', 'Dr. Aravindasamy'),
  ('Priya Suresh', 5, 'Dr. Vishali is amazing with children. My son was scared of doctors but she made him feel so comfortable. Best paediatrician in Porur!', 'Dr. Vishali'),
  ('Meenakshi Rajan', 5, 'Excellent clinic with modern facilities. The staff is caring and the doctors are highly knowledgeable. Very satisfied with the treatment.', 'Dr. Aravindasamy'),
  ('Arjun Nair', 5, 'My daughter received vaccination here. Dr. Vishali explained everything clearly. Very professional and child-friendly environment.', 'Dr. Vishali'),
  ('Sundar Krishnan', 5, 'After years of back pain, Dr. Aravindasamy''s treatment has given me a new life. The physiotherapy support is also excellent.', 'Dr. Aravindasamy')
ON CONFLICT DO NOTHING;
