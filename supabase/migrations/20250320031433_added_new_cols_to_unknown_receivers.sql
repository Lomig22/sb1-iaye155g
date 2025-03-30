ALTER TABLE unknown_client ADD COLUMN IF NOT EXISTS amount decimal(10,2) NOT NULL DEFAULT 0;
ALTER TABLE unknown_client ADD COLUMN IF NOT EXISTS paid_amount decimal(10,2) NOT NULL DEFAULT 0;
ALTER TABLE unknown_client ADD COLUMN IF NOT EXISTS document_date date;
ALTER TABLE unknown_client ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE unknown_client ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE unknown_client ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE unknown_client ADD COLUMN IF NOT EXISTS date date;
