/*
  # Schéma de gestion des clients et créances

  1. Nouvelles Tables
    - `clients`
      - `id` (uuid, clé primaire)
      - `company_name` (nom de l'entreprise)
      - `siret` (numéro SIRET unique)
      - `email` (email de contact)
      - `phone` (téléphone)
      - `address` (adresse)
      - `created_at` (date de création)
      - `updated_at` (date de mise à jour)
      - `owner_id` (référence vers profiles.id)

    - `receivables` (créances)
      - `id` (uuid, clé primaire)
      - `client_id` (référence vers clients)
      - `invoice_number` (numéro de facture)
      - `amount` (montant)
      - `due_date` (date d'échéance)
      - `status` (statut: en attente, relancé, payé, etc.)
      - `invoice_pdf_url` (lien vers la facture PDF)
      - `created_at` (date de création)
      - `updated_at` (date de mise à jour)

    - `reminders` (relances)
      - `id` (uuid, clé primaire)
      - `receivable_id` (référence vers receivables)
      - `reminder_date` (date de la relance)
      - `reminder_type` (type de relance: première, deuxième, mise en demeure, etc.)
      - `email_sent` (boolean, si l'email a été envoyé)
      - `email_content` (contenu de l'email envoyé)
      - `created_at` (date de création)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour que les utilisateurs ne voient que leurs propres données
*/

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL,
    siret text UNIQUE NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    owner_id uuid REFERENCES profiles(id) NOT NULL
);

-- Table des créances
CREATE TABLE IF NOT EXISTS receivables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    invoice_number text NOT NULL,
    amount decimal(10,2) NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    invoice_pdf_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'reminded', 'paid', 'late', 'legal', 'Relance 1', 
    'Relance 2', 'Relance 3', 'Relance finale'))
);
-- Table des relances
CREATE TABLE IF NOT EXISTS reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    receivable_id uuid REFERENCES receivables(id) ON DELETE CASCADE NOT NULL,
    reminder_date timestamptz NOT NULL,
    reminder_type text NOT NULL,
    email_sent boolean DEFAULT false,
    email_content text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT valid_reminder_type CHECK (reminder_type IN ('first', 'second', 'third', 'final', 'legal', 'pre'))
);

-- Activation de RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Policies pour clients
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
    USING (owner_id = auth.uid());

-- Policies pour receivables
CREATE POLICY "Users can view their receivables"
    ON receivables FOR SELECT
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM clients WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert receivables for their clients"
    ON receivables FOR INSERT
    TO authenticated
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their receivables"
    ON receivables FOR UPDATE
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM clients WHERE owner_id = auth.uid()
        )
    );

-- Policies pour reminders
CREATE POLICY "Users can view their reminders"
    ON reminders FOR SELECT
    TO authenticated
    USING (
        receivable_id IN (
            SELECT r.id FROM receivables r
            JOIN clients c ON r.client_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert reminders for their receivables"
    ON reminders FOR INSERT
    TO authenticated
    WITH CHECK (
        receivable_id IN (
            SELECT r.id FROM receivables r
            JOIN clients c ON r.client_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

-- Fonction de mise à jour automatique du updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour la mise à jour automatique de updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receivables_updated_at
    BEFORE UPDATE ON receivables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();