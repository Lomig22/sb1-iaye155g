/*
  # Ajout des paramètres de relance aux clients

  1. Nouvelles colonnes
    - Délais de relance (en jours)
      - reminder_delay_1: première relance
      - reminder_delay_2: deuxième relance
      - reminder_delay_3: troisième relance
      - reminder_delay_final: relance finale
    - Templates de relance
      - reminder_template_1: template première relance
      - reminder_template_2: template deuxième relance
      - reminder_template_3: template troisième relance
      - reminder_template_final: template relance finale

  2. Valeurs par défaut
    - Délais par défaut : 15, 30, 45, 60 jours
    - Templates vides par défaut
*/

-- Ajout des colonnes de délai de relance avec valeurs par défaut
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS reminder_delay_1 integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS reminder_delay_2 integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS reminder_delay_3 integer DEFAULT 45,
  ADD COLUMN IF NOT EXISTS reminder_delay_final integer DEFAULT 60;

-- Ajout des colonnes de template de relance
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS reminder_template_1 text,
  ADD COLUMN IF NOT EXISTS reminder_template_2 text,
  ADD COLUMN IF NOT EXISTS reminder_template_3 text,
  ADD COLUMN IF NOT EXISTS reminder_template_final text;

-- Ajout de contraintes de validation pour les délais
ALTER TABLE clients
  ADD CONSTRAINT reminder_delay_1_positive CHECK (reminder_delay_1 > 0),
  ADD CONSTRAINT reminder_delay_2_positive CHECK (reminder_delay_2 > 0),
  ADD CONSTRAINT reminder_delay_3_positive CHECK (reminder_delay_3 > 0),
  ADD CONSTRAINT reminder_delay_final_positive CHECK (reminder_delay_final > 0),
  ADD CONSTRAINT reminder_delays_order CHECK (
    reminder_delay_1 < reminder_delay_2 AND
    reminder_delay_2 < reminder_delay_3 AND
    reminder_delay_3 < reminder_delay_final
  );

-- Mise à jour des politiques RLS existantes pour inclure les nouveaux champs
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
CREATE POLICY "Users can update their own clients"
ON clients FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Index pour optimiser les requêtes sur les délais de relance
CREATE INDEX IF NOT EXISTS idx_clients_reminder_delays 
ON clients (reminder_delay_1, reminder_delay_2, reminder_delay_3, reminder_delay_final);