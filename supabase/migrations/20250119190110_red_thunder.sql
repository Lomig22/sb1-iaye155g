/*
  # Ajout de colonnes à la table clients

  1. Modifications
    - Ajout des colonnes :
      - `postal_code` (text) : Code postal
      - `city` (text) : Ville
      - `country` (text) : Pays
      - `industry` (text) : Secteur d'activité
      - `website` (text) : Site internet
      - `needs_reminder` (boolean) : Indicateur de relance
*/

-- Ajout des nouvelles colonnes
DO $$ 
BEGIN
  -- Code postal
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'postal_code') THEN
    ALTER TABLE clients ADD COLUMN postal_code text;
  END IF;

  -- Ville
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'city') THEN
    ALTER TABLE clients ADD COLUMN city text;
  END IF;

  -- Pays
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'country') THEN
    ALTER TABLE clients ADD COLUMN country text DEFAULT 'France';
  END IF;

  -- Secteur d'activité
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'industry') THEN
    ALTER TABLE clients ADD COLUMN industry text;
  END IF;

  -- Site internet
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'website') THEN
    ALTER TABLE clients ADD COLUMN website text;
  END IF;

  -- Indicateur de relance
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'needs_reminder') THEN
    ALTER TABLE clients ADD COLUMN needs_reminder boolean DEFAULT false;
  END IF;
END $$;