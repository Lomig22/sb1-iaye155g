-- Fonction pour envoyer un email via SMTP
CREATE OR REPLACE FUNCTION send_smtp_email(
  p_to text,
  p_subject text,
  p_body text,
  p_smtp_settings jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result boolean;
BEGIN
  -- Appel à la fonction Edge via pg_net (extension Supabase)
  PERFORM net.http_post(
    url := current_setting('app.settings.edge_function_url') || '/send-smtp-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.edge_function_key')
    ),
    body := jsonb_build_object(
      'to', p_to,
      'subject', p_subject,
      'body', p_body,
      'smtp_settings', p_smtp_settings
    )
  );

  -- Si aucune exception n'est levée, on considère que l'envoi est réussi
  v_result := true;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur et retourne false en cas d'échec
    RAISE NOTICE 'Erreur lors de l''envoi de l''email: %', SQLERRM;
    RETURN false;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION send_smtp_email TO authenticated;