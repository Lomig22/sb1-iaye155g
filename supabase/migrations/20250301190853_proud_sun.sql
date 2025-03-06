/*
  # Add document_date column to receivables table

  1. Changes
    - Add document_date column to receivables table if it doesn't exist
*/

DO $$ 
BEGIN
  -- Add document_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'receivables' 
    AND column_name = 'document_date'
  ) THEN
    ALTER TABLE receivables ADD COLUMN document_date date;
  END IF;
END $$;