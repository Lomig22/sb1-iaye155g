/*
  # Correction de la table email_settings

  1. Nettoyage
    - Suppression des doublons en gardant l'entrée la plus récente
    - Ajout d'une contrainte unique sur user_id
  
  2. Modifications
    - Ajout d'index sur user_id
    - Mise à jour des politiques RLS
*/

-- Nettoyage des doublons
WITH duplicates AS (
  SELECT DISTINCT ON (user_id) id
  FROM email_settings
  ORDER BY user_id, updated_at DESC
)
DELETE FROM email_settings
WHERE id NOT IN (SELECT id FROM duplicates);

-- Ajout de la contrainte unique sur user_id
ALTER TABLE email_settings
DROP CONSTRAINT IF EXISTS email_settings_user_id_key;

ALTER TABLE email_settings
ADD CONSTRAINT email_settings_user_id_key UNIQUE (user_id);

-- Mise à jour des politiques RLS
DROP POLICY IF EXISTS "Users can view their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can insert their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can update their own email settings" ON email_settings;

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
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Optimisation avec index
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id 
ON email_settings(user_id);