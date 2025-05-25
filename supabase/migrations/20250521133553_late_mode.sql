/*
  # Create businesses table

  1. New Tables
    - `businesses`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `name` (text)
      - `description` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `max_participants` (integer)
      - `status` (text)

  2. Security
    - Enable RLS on businesses table
    - Add policies for authenticated users to manage businesses
*/

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  max_participants integer NOT NULL CHECK (max_participants > 0),
  status text NOT NULL CHECK (status IN ('draft', 'recruiting', 'closed', 'completed')) DEFAULT 'draft'
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete businesses"
  ON businesses
  FOR DELETE
  TO authenticated
  USING (true);