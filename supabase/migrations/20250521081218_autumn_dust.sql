/*
  # Add discount price to programs table

  1. Changes
    - Add `discount_price` column to programs table
      - Nullable integer column for optional discount prices
      - When null, no discount is applied
      - When set, represents the discounted price in won
*/

ALTER TABLE programs ADD COLUMN IF NOT EXISTS discount_price integer;