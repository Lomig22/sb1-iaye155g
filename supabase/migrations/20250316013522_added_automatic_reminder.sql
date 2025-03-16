ALTER TABLE receivables ADD COLUMN IF NOT EXISTS automatic_reminder boolean DEFAULT true;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS reminder_status text DEFAULT 'none';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pre_reminder_days number DEFAULT 1;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pre_reminder_template text;