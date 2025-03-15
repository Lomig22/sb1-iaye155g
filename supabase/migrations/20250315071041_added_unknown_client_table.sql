CREATE TABLE IF NOT EXISTS unknown_client (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    invoice_no text NOT NULL,
    client_code text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE unknown_client ADD CONSTRAINT u_client_code UNIQUE (owner_id, client_code)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unknown_client_mapping text;