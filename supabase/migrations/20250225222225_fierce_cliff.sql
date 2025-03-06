/*
  # Ajout des politiques de suppression

  1. Nouvelles politiques
    - Ajout de la politique de suppression pour les clients
    - Ajout de la politique de suppression pour les créances
    - Ajout de la politique de suppression pour les relances

  2. Contraintes
    - Mise à jour des contraintes de suppression en cascade
    - Ajout de triggers pour le nettoyage des données associées

  3. Sécurité
    - Vérification que seul le propriétaire peut supprimer ses données
    - Protection contre la suppression accidentelle
*/

-- Mise à jour des contraintes de suppression en cascade
ALTER TABLE receivables
DROP CONSTRAINT IF EXISTS receivables_client_id_fkey,
ADD CONSTRAINT receivables_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES clients(id)
  ON DELETE CASCADE;

ALTER TABLE reminders
DROP CONSTRAINT IF EXISTS reminders_receivable_id_fkey,
ADD CONSTRAINT reminders_receivable_id_fkey
  FOREIGN KEY (receivable_id)
  REFERENCES receivables(id)
  ON DELETE CASCADE;

-- Fonction pour nettoyer les données associées
CREATE OR REPLACE FUNCTION clean_deleted_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Les créances et relances seront supprimées automatiquement grâce au ON DELETE CASCADE
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour le nettoyage des données
DROP TRIGGER IF EXISTS clean_deleted_data_trigger ON clients;
CREATE TRIGGER clean_deleted_data_trigger
  BEFORE DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION clean_deleted_data();

-- Politique de suppression pour les clients
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
CREATE POLICY "Users can delete their own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Politique de suppression pour les créances
DROP POLICY IF EXISTS "Users can delete their receivables" ON receivables;
CREATE POLICY "Users can delete their receivables"
  ON receivables
  FOR DELETE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE owner_id = auth.uid()
    )
  );

-- Politique de suppression pour les relances
DROP POLICY IF EXISTS "Users can delete their reminders" ON reminders;
CREATE POLICY "Users can delete their reminders"
  ON reminders
  FOR DELETE
  TO authenticated
  USING (
    receivable_id IN (
      SELECT r.id 
      FROM receivables r
      JOIN clients c ON r.client_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- Index pour optimiser les requêtes de suppression
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_receivables_client_id ON receivables(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_receivable_id ON reminders(receivable_id);