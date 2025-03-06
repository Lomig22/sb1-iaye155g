/*
  # Ajout de la politique de suppression de client

  1. Modifications
    - Ajout d'une politique de suppression pour les clients
    - Ajout d'une fonction de nettoyage des données associées
    - Mise à jour des contraintes de suppression en cascade

  2. Sécurité
    - Seul le propriétaire du client peut le supprimer
    - Suppression en cascade des créances et relances associées
*/

-- Mise à jour des contraintes de suppression en cascade
ALTER TABLE receivables
DROP CONSTRAINT IF EXISTS receivables_client_id_fkey,
ADD CONSTRAINT receivables_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES clients(id)
  ON DELETE CASCADE;

-- Fonction pour nettoyer les données associées
CREATE OR REPLACE FUNCTION clean_client_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Les créances et relances seront supprimées automatiquement grâce au ON DELETE CASCADE
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour le nettoyage des données
DROP TRIGGER IF EXISTS clean_client_data_trigger ON clients;
CREATE TRIGGER clean_client_data_trigger
  BEFORE DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION clean_client_data();

-- Politique de suppression pour les clients
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
CREATE POLICY "Users can delete their own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());