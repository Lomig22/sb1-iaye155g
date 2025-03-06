import { supabase } from './supabase';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const sendContactForm = async (formData: ContactFormData): Promise<boolean> => {
  try {
    // Utiliser l'API Resend directement au lieu de la fonction Edge
    const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.error('Clé API Resend non configurée');
      return false;
    }

    // Construire le contenu de l'email
    const emailContent = `
      <h1>Nouveau message de contact depuis PaymentFlow</h1>
      <p><strong>Nom:</strong> ${formData.name}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Sujet:</strong> ${formData.subject}</p>
      <h2>Message:</h2>
      <p>${formData.message.replace(/\n/g, '<br>')}</p>
    `;

    // Envoyer l'email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `Contact Form <onboarding@resend.dev>`,
        to: 'milog.guegue@gmail.com',
        subject: `[PaymentFlow] Nouveau message de contact: ${formData.subject}`,
        html: emailContent,
        reply_to: formData.email
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Erreur Resend:', data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception lors de l\'envoi du formulaire de contact:', error);
    return false;
  }
};