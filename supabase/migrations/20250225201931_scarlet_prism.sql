/*
  # Ajout des colonnes au profil utilisateur

  1. Nouvelles colonnes
    - `name` : Nom complet de l'utilisateur
    - `company` : Nom de l'entreprise
    - `phone` : Numéro de téléphone

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Ajout des colonnes au profil utilisateur
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS phone text;

-- Mise à jour des politiques RLS existantes
DO $$ 
BEGIN
  -- Vérifier et mettre à jour la politique de sélection
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    DROP POLICY "Users can view own profile" ON profiles;
  END IF;

  CREATE POLICY "Users can view own profile" 
    ON profiles 
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = id);

  -- Vérifier et mettre à jour la politique de mise à jour
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    DROP POLICY "Users can update own profile" ON profiles;
  END IF;

  CREATE POLICY "Users can update own profile" 
    ON profiles 
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
END $$;