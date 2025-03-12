-- Add owner_id column to receivables table
DO $$ 
BEGIN
  -- Add owner_od column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'receivables' 
    AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE receivables ADD COLUMN owner_id uuid REFERENCES profiles(id) NOT NULL;
    ALTER TABLE receivables ADD CONSTRAINT receivables_owner_invoice_uniq UNIQUE (invoice_number, owner_id);
  END IF;

END $$;