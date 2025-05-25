/*
  # Fix programs registration constraints

  1. Changes
    - Add NOT NULL constraint to required fields
    - Add CHECK constraints for price validation
    - Add default values for optional fields
*/

ALTER TABLE programs
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN price SET NOT NULL,
  ALTER COLUMN duration SET NOT NULL,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT true,
  DROP CONSTRAINT IF EXISTS price_positive,
  DROP CONSTRAINT IF EXISTS valid_discount,
  ADD CONSTRAINT price_positive CHECK (price > 0),
  ADD CONSTRAINT valid_discount CHECK (
    discount_price IS NULL OR 
    (discount_price > 0 AND discount_price < price)
  );