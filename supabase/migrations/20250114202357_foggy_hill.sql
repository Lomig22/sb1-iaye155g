/*
  # Configuration de l'authentification par e-mail
  
  Note: La configuration des templates d'e-mail doit être faite via le dashboard Supabase.
  Cette migration configure uniquement les paramètres de base de l'authentification.
*/

-- Configurer les paramètres de base de l'authentification
ALTER TABLE auth.users 
  ALTER COLUMN email_confirmed_at DROP NOT NULL;

-- Ajouter un index pour optimiser les requêtes sur l'email
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users (email);

-- Ajouter un index pour optimiser les requêtes sur la confirmation d'email
CREATE INDEX IF NOT EXISTS users_email_confirmed_idx ON auth.users (email_confirmed_at);