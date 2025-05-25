/*
  # Create applications table and setup security

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

  2. Security
    - Enable RLS on applications table
    - Add policies for authenticated users to manage applications
*/

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