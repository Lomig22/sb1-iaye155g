/*
  # Ajout des politiques de sécurité RLS

  1. Sécurité
    - Ajout de politiques RLS pour la table `clients`
      - Lecture : l'utilisateur ne peut voir que ses propres clients
      - Insertion : l'utilisateur ne peut ajouter que des clients liés à son compte
      - Mise à jour : l'utilisateur ne peut modifier que ses propres clients
      - Suppression : l'utilisateur ne peut supprimer que ses propres clients
*/

-- Suppression des anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

-- Création des nouvelles politiques
CREATE POLICY "Users can view their own clients"
ON clients FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own clients"
ON clients FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own clients"
ON clients FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own clients"
ON clients FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Vérification que RLS est activé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'clients'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;