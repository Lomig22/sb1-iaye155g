import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  recipientEmail: string;
  siteName: string;
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

    const { name, email, subject, message, recipientEmail, siteName } = await req.json() as ContactFormRequest;

    // Vérifier que tous les champs requis sont présents
    if (!name || !email || !subject || !message || !recipientEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Tous les champs sont requis"
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          status: 400 
        }
      );
    }

    // Récupérer les variables d'environnement pour l'envoi d'email
    const RESEND_API_KEY = Deno.env.get("VITE_RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      throw new Error("La clé API Resend n'est pas configurée");
    }

    // Construire le contenu de l'email
    const emailContent = `
      <h1>Nouveau message de contact depuis ${siteName}</h1>
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Sujet:</strong> ${subject}</p>
      <h2>Message:</h2>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    // Envoyer l'email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `Contact Form <contact@paymentflow.com>`,
        to: recipientEmail,
        subject: `[${siteName}] Nouveau message de contact: ${subject}`,
        html: emailContent,
        reply_to: email
      })
    });

    const resData = await res.json();

    if (!res.ok) {
      throw new Error(`Erreur Resend: ${JSON.stringify(resData)}`);
    }

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