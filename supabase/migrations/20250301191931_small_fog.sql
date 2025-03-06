/*
  # Add management fields to receivables

  This migration adds management_number and code columns to the receivables table
  to support additional tracking and identification of receivables.
*/

DO $$ 
BEGIN
  -- Add management_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'receivables' 
    AND column_name = 'management_number'
  ) THEN
    ALTER TABLE receivables ADD COLUMN management_number text;
  END IF;

  -- Add code column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'receivables' 
    AND column_name = 'code'
  ) THEN
    ALTER TABLE receivables ADD COLUMN code text;
  END IF;
END $$;