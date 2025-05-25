/*
  # Create admin tables

  1. New Tables
    - `applications`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone)
      - `program` (text)
      - `name` (text)
      - `birthdate` (date)
      - `gender` (text)
      - `phone` (text)
      - `status` (text)
    - `notices`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone)
      - `title` (text)
      - `content` (text)
    - `programs`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone)
      - `name` (text)
      - `description` (text)
      - `price` (integer)
      - `discount_price` (integer)
      - `duration` (text)
      - `type` (text)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage all tables
*/

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  program text NOT NULL,
  name text NOT NULL,
  birthdate date NOT NULL,
  gender text NOT NULL,
  phone text NOT NULL,
  status text DEFAULT 'pending'
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update applications"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (true);

-- Notices table
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  content text NOT NULL
);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read notices"
  ON notices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert notices"
  ON notices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete notices"
  ON notices
  FOR DELETE
  TO authenticated
  USING (true);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  discount_price integer,
  duration text NOT NULL,
  type text NOT NULL,
  is_active boolean DEFAULT true
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read programs"
  ON programs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert programs"
  ON programs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update programs"
  ON programs
  FOR UPDATE
  TO authenticated
  USING (true);