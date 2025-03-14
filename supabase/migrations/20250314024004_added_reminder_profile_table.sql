CREATE TABLE IF NOT EXISTS reminder_profile (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    public boolean DEFAULT false, 
    delay1 integer DEFAULT 0,
    delay2 integer DEFAULT 0,
    delay3 integer DEFAULT 0,
    delay4 integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS reminder_profiles uuid;
ALTER TABLE clients ADD CONSTRAINT IF NOT EXISTS fk_reminder_profiles FOREIGN KEY (reminder_profiles) REFERENCES reminder_profile(id);