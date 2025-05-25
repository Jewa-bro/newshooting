/*
  # Create notices and programs tables

  1. New Tables
    - `notices`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `title` (text)
      - `content` (text)

    - `programs`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `name` (text)
      - `description` (text)
      - `price` (integer)
      - `duration` (text)
      - `type` (text)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage notices and programs
*/

-- Create notices table
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  content text NOT NULL
);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to read notices"
  ON notices
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage notices"
  ON notices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  duration text NOT NULL,
  type text NOT NULL,
  is_active boolean DEFAULT true
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to read active programs"
  ON programs
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow authenticated users to manage programs"
  ON programs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);