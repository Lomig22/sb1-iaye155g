/*
  # Ensure cascade deletion

  This migration ensures that cascade deletion is properly set up for all related tables.
  It verifies and fixes foreign key constraints, RLS policies, and creates necessary indexes.
*/

-- Use a different approach to verify and update constraints
DO $$ 
DECLARE
  constraint_exists boolean;
  constraint_has_cascade boolean;
BEGIN
  -- Check receivables constraint
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'receivables_client_id_fkey'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    SELECT pg_get_constraintdef(c.oid) LIKE '%ON DELETE CASCADE%'
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'receivables_client_id_fkey'
    INTO constraint_has_cascade;
    
    IF NOT constraint_has_cascade THEN
      ALTER TABLE receivables
      DROP CONSTRAINT receivables_client_id_fkey;
      
      ALTER TABLE receivables
      ADD CONSTRAINT receivables_client_id_fkey
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE CASCADE;
    END IF;
  ELSE
    ALTER TABLE receivables
    ADD CONSTRAINT receivables_client_id_fkey
      FOREIGN KEY (client_id)
      REFERENCES clients(id)
      ON DELETE CASCADE;
  END IF;
  
  -- Check reminders constraint
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'reminders_receivable_id_fkey'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    SELECT pg_get_constraintdef(c.oid) LIKE '%ON DELETE CASCADE%'
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'reminders_receivable_id_fkey'
    INTO constraint_has_cascade;
    
    IF NOT constraint_has_cascade THEN
      ALTER TABLE reminders
      DROP CONSTRAINT reminders_receivable_id_fkey;
      
      ALTER TABLE reminders
      ADD CONSTRAINT reminders_receivable_id_fkey
        FOREIGN KEY (receivable_id)
        REFERENCES receivables(id)
        ON DELETE CASCADE;
    END IF;
  ELSE
    ALTER TABLE reminders
    ADD CONSTRAINT reminders_receivable_id_fkey
      FOREIGN KEY (receivable_id)
      REFERENCES receivables(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Create or replace RLS policies
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