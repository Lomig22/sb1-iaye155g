/*
  # Mise à jour de la table clients

  1. Modifications
    - Ajout de contraintes NOT NULL sur les colonnes existantes
    - Ajout d'index pour optimiser les recherches

  2. Sécurité
    - Mise à jour des politiques RLS pour garantir que seul le propriétaire peut modifier ses données
*/

-- Ajout de contraintes NOT NULL sur les colonnes existantes
ALTER TABLE clients 
  ALTER COLUMN company_name SET NOT NULL,
  ALTER COLUMN siret SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN owner_id SET NOT NULL;

-- Ajout d'index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients (company_name);
CREATE INDEX IF NOT EXISTS idx_clients_siret ON clients (siret);
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients (owner_id);

-- Mise à jour des politiques RLS
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
CREATE POLICY "Users can update their own clients"
ON clients FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Ajout d'un trigger pour la mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_client_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_timestamp ON clients;
CREATE TRIGGER update_clients_timestamp
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_client_updated_at();