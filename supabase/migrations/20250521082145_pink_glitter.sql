/*
  # Fix programs table constraints and defaults

  1. Changes
    - Add NOT NULL constraint to discount_price
    - Add CHECK constraint to ensure discount_price is less than price
    - Add CHECK constraint to ensure price is positive
*/

ALTER TABLE programs 
  ALTER COLUMN discount_price SET DEFAULT NULL,
  ADD CONSTRAINT price_positive CHECK (price > 0),
  ADD CONSTRAINT valid_discount CHECK (discount_price IS NULL OR (discount_price > 0 AND discount_price < price));