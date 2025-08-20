-- Migration: Add pricing fields to properties table
-- Date: 2025-08-20
-- Description: Add price_per_night and max_guests columns to properties table

-- Add new columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS price_per_night NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 1;

-- Update existing properties with default values if needed
UPDATE properties 
SET max_guests = 1 
WHERE max_guests IS NULL;

-- Optional: Remove price_per_night from rooms since we moved it to property level
-- (We'll keep it for now for flexibility)

-- Add a comment to track this migration
COMMENT ON COLUMN properties.price_per_night IS 'Property-level pricing for whole property rental';
COMMENT ON COLUMN properties.max_guests IS 'Maximum number of guests for the entire property';
