/*
  # Mise à jour des paramètres email pour supporter différents fournisseurs SMTP

  1. Modifications
    - Renommage des colonnes spécifiques à OVH
    - Ajout d'une colonne pour le type de fournisseur
    - Ajout d'une colonne pour le chiffrement SMTP

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Renommer les colonnes existantes et ajouter les nouvelles
ALTER TABLE email_settings
  RENAME COLUMN ovh_email TO smtp_username;

ALTER TABLE email_settings
  RENAME COLUMN ovh_password TO smtp_password;

-- Ajout des nouvelles colonnes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_settings' 
    AND column_name = 'provider_type'
  ) THEN
    ALTER TABLE email_settings 
    ADD COLUMN provider_type text NOT NULL DEFAULT 'custom';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_settings' 
    AND column_name = 'smtp_encryption'
  ) THEN
    ALTER TABLE email_settings 
    ADD COLUMN smtp_encryption text NOT NULL DEFAULT 'tls';
  END IF;

  -- Mettre à jour les contraintes de validation
  ALTER TABLE email_settings
    DROP CONSTRAINT IF EXISTS valid_provider_type;
  
  ALTER TABLE email_settings
    ADD CONSTRAINT valid_provider_type 
    CHECK (provider_type IN ('ovh', 'gmail', 'custom'));

  ALTER TABLE email_settings
    DROP CONSTRAINT IF EXISTS valid_smtp_encryption;
  
  ALTER TABLE email_settings
    ADD CONSTRAINT valid_smtp_encryption 
    CHECK (smtp_encryption IN ('tls', 'ssl', 'none'));
END $$;