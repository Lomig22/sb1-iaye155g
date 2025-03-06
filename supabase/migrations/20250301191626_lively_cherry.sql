DO $$ 
BEGIN
  -- Add installment_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'receivables' 
    AND column_name = 'installment_number'
  ) THEN
    ALTER TABLE receivables ADD COLUMN installment_number text;
  END IF;
END $$;