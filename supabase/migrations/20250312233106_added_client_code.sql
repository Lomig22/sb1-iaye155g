ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_code text;
ALTER TABLE clients ADD CONSTRAINT client_code_unq UNIQUE (owner_id);;