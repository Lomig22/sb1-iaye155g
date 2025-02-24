/*
  # Ajout de la table des paramètres de notification

  1. Nouvelle Table
    - `notification_settings`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers profiles, unique)
      - `email_notifications` (boolean)
      - `reminder_notifications` (boolean)
      - `payment_notifications` (boolean)
      - `daily_summary` (boolean)
      - `weekly_summary` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Activation de RLS
    - Politiques pour lecture/écriture par l'utilisateur propriétaire
*/

-- Création de la table des paramètres de notification
CREATE TABLE IF NOT EXISTS notification_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) NOT NULL,
    email_notifications boolean DEFAULT true,
    reminder_notifications boolean DEFAULT true,
    payment_notifications boolean DEFAULT true,
    daily_summary boolean DEFAULT false,
    weekly_summary boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Activation de RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies pour notification_settings
CREATE POLICY "Users can view their own notification settings"
    ON notification_settings FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification settings"
    ON notification_settings FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification settings"
    ON notification_settings FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Trigger pour la mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_settings_timestamp
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_settings_updated_at();

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Fonction pour créer automatiquement les paramètres de notification par défaut
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer les paramètres par défaut lors de la création d'un profil
CREATE TRIGGER on_profile_created
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_settings();

-- Créer les paramètres pour les profils existants
INSERT INTO notification_settings (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;