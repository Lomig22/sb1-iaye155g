/*
  # Suppression de la colonne SIRET

  1. Changements
    - Suppression de la colonne SIRET de la table clients
    - Suppression de la contrainte d'unicité sur SIRET
*/

-- Suppression de la colonne SIRET
ALTER TABLE clients
DROP COLUMN IF EXISTS siret;

-- Suppression de l'index sur SIRET s'il existe
DROP INDEX IF EXISTS idx_clients_siret;