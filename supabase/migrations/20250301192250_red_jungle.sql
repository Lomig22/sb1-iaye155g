-- Add paid_amount column to receivables table
DO $$ 
BEGIN
  -- Add paid_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'receivables' 
    AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE receivables ADD COLUMN paid_amount decimal(10,2);
  END IF;
END $$;