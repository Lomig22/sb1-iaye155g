/*
  # Fix Receivables Schema and Cascade Deletion

  This migration:
  1. Adds missing columns to the receivables table
  2. Sets up proper cascade deletion for related tables
  3. Creates appropriate RLS policies for deletion operations
  4. Adds indexes for better performance
*/

-- Add missing columns to receivables table
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

-- Set up cascade deletion for related tables
DO $$ 
BEGIN
  -- Drop existing constraints if they exist
  ALTER TABLE receivables DROP CONSTRAINT IF EXISTS receivables_client_id_fkey;
  ALTER TABLE reminders DROP CONSTRAINT IF EXISTS reminders_receivable_id_fkey;
  
  -- Add constraints with CASCADE
  ALTER TABLE receivables
    ADD CONSTRAINT receivables_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE CASCADE;
    
  ALTER TABLE reminders
    ADD CONSTRAINT reminders_receivable_id_fkey
    FOREIGN KEY (receivable_id)
    REFERENCES receivables(id)
    ON DELETE CASCADE;
END $$;

-- Create or replace RLS policies for deletion
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
CREATE POLICY "Users can delete their own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their receivables" ON receivables;
CREATE POLICY "Users can delete their receivables"
  ON receivables
  FOR DELETE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their reminders" ON reminders;
CREATE POLICY "Users can delete their reminders"
  ON reminders
  FOR DELETE
  TO authenticated
  USING (
    receivable_id IN (
      SELECT r.id 
      FROM receivables r
      JOIN clients c ON r.client_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- Create indexes for efficient deletion operations
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_receivables_client_id ON receivables(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_receivable_id ON reminders(receivable_id);