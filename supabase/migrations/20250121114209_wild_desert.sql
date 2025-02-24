/*
  # Ajout des paramètres de relance et configuration email

  1. Nouvelles Tables
    - `email_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence vers profiles)
      - `ovh_email` (text)
      - `ovh_password` (text)
      - `smtp_server` (text)
      - `smtp_port` (integer)
      - `email_signature` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modifications de Tables Existantes
    - Table `clients`
      - Ajout `reminder_delay_1` (integer) - Délai première relance en jours
      - Ajout `reminder_delay_2` (integer) - Délai deuxième relance en jours
      - Ajout `reminder_delay_3` (integer) - Délai troisième relance en jours
      - Ajout `reminder_delay_final` (integer) - Délai relance finale en jours
      - Ajout `reminder_template_1` (text) - Template premier email
      - Ajout `reminder_template_2` (text) - Template deuxième email
      - Ajout `reminder_template_3` (text) - Template troisième email
      - Ajout `reminder_template_final` (text) - Template email final

  3. Sécurité
    - Enable RLS sur email_settings
    - Policies pour la gestion des paramètres email
*/

-- Création de la table des paramètres email
CREATE TABLE IF NOT EXISTS email_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) NOT NULL,
    ovh_email text NOT NULL,
    ovh_password text NOT NULL,
    smtp_server text NOT NULL DEFAULT 'ssl0.ovh.net',
    smtp_port integer NOT NULL DEFAULT 587,
    email_signature text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ajout des colonnes de délai de relance aux clients
DO $$ 
BEGIN
    -- Délais de relance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'reminder_delay_1') THEN
        ALTER TABLE clients ADD COLUMN reminder_delay_1 integer DEFAULT 15;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'reminder_delay_2') THEN
        ALTER TABLE clients ADD COLUMN reminder_delay_2 integer DEFAULT 30;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'reminder_delay_3') THEN
        ALTER TABLE clients ADD COLUMN reminder_delay_3 integer DEFAULT 45;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'reminder_delay_final') THEN
        ALTER TABLE clients ADD COLUMN reminder_delay_final integer DEFAULT 60;
    END IF;

    -- Templates d'email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'reminder_template_1') THEN
        ALTER TABLE clients ADD COLUMN reminder_template_1 text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'reminder_template_2') THEN
        ALTER TABLE clients ADD COLUMN reminder_template_2 text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'reminder_template_3') THEN
        ALTER TABLE clients ADD COLUMN reminder_template_3 text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'reminder_template_final') THEN
        ALTER TABLE clients ADD COLUMN reminder_template_final text;
    END IF;
END $$;

-- Activation de RLS pour email_settings
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Policies pour email_settings
CREATE POLICY "Users can view their own email settings"
    ON email_settings FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own email settings"
    ON email_settings FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own email settings"
    ON email_settings FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Trigger pour la mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_settings_timestamp
    BEFORE UPDATE ON email_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_email_settings_updated_at();

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_reminder_delays ON clients(reminder_delay_1, reminder_delay_2, reminder_delay_3, reminder_delay_final);