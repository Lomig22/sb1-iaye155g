/*
  # Correction des fonctions de service de relance

  1. Nouvelles fonctions
    - `process_reminder` : Traite une relance spécifique
    - `send_reminder_email` : Envoie un email de relance
    - `update_reminder_status` : Met à jour le statut d'une relance

  2. Sécurité
    - Toutes les fonctions sont SECURITY DEFINER
    - Accès limité aux utilisateurs authentifiés
*/

-- Fonction pour traiter une relance
CREATE OR REPLACE FUNCTION process_reminder(
  p_receivable_id uuid,
  p_template text,
  p_reminder_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receivable receivables%ROWTYPE;
  v_client clients%ROWTYPE;
  v_email_sent boolean;
BEGIN
  -- Récupérer les informations de la créance
  SELECT *
  INTO v_receivable
  FROM receivables
  WHERE id = p_receivable_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Récupérer les informations du client
  SELECT *
  INTO v_client
  FROM clients
  WHERE id = v_receivable.client_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Envoyer l'email
  v_email_sent := send_reminder_email(
    v_client.email,
    p_template,
    jsonb_build_object(
      'company', v_client.company_name,
      'amount', v_receivable.amount,
      'invoice_number', v_receivable.invoice_number,
      'due_date', v_receivable.due_date
    )
  );

  IF v_email_sent THEN
    -- Mettre à jour le statut
    PERFORM update_reminder_status(p_receivable_id, p_reminder_type);
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Fonction pour envoyer un email de relance
CREATE OR REPLACE FUNCTION send_reminder_email(
  p_to text,
  p_template text,
  p_variables jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Appel à la fonction Edge
  PERFORM net.http_post(
    url := current_setting('app.settings.edge_function_url') || '/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.edge_function_key')
    ),
    body := jsonb_build_object(
      'to', p_to,
      'template', p_template,
      'variables', p_variables
    )
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Fonction pour mettre à jour le statut d'une relance
CREATE OR REPLACE FUNCTION update_reminder_status(
  p_receivable_id uuid,
  p_reminder_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insérer la relance
  INSERT INTO reminders (
    receivable_id,
    reminder_type,
    reminder_date,
    email_sent
  ) VALUES (
    p_receivable_id,
    p_reminder_type,
    now(),
    true
  );

  -- Mettre à jour le statut de la créance
  UPDATE receivables
  SET status = 'reminded',
      updated_at = now()
  WHERE id = p_receivable_id;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION process_reminder TO authenticated;
GRANT EXECUTE ON FUNCTION send_reminder_email TO authenticated;
GRANT EXECUTE ON FUNCTION update_reminder_status TO authenticated;