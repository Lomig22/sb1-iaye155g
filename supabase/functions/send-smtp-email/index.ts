import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Types pour la requête
interface EmailSettings {
  provider_type: string;
  smtp_username: string;
  smtp_password: string;
  smtp_server: string;
  smtp_port: number;
  smtp_encryption: string;
  email_signature?: string;
}

interface EmailRequest {
  settings: EmailSettings;
  to: string;
  subject: string;
  html: string;
}

serve(async (req) => {
  try {
    // Activer CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    const { settings, to, subject, html } = await req.json() as EmailRequest;

    const client = new SmtpClient();

    const connectConfig = {
      hostname: settings.smtp_server,
      port: settings.smtp_port,
      username: settings.smtp_username,
      password: settings.smtp_password,
    };

    // Connexion selon le type de chiffrement
    if (settings.smtp_encryption === 'tls') {
      await client.connectTLS(connectConfig);
    } else if (settings.smtp_encryption === 'ssl') {
      await client.connect(connectConfig);
    } else {
      await client.connect({
        ...connectConfig,
        tls: false,
      });
    }

    await client.send({
      from: settings.smtp_username,
      to: to,
      subject: subject,
      content: html,
      html: html,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erreur lors de l'envoi de l'email",
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500 
      }
    );
  }
});