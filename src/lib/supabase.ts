import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Création du client avec des options de persistance explicites
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Persister la session dans le localStorage
    storageKey: "paymentflow-auth", // Clé unique pour notre application
    storage: window.localStorage, // Utiliser le localStorage pour la persistance
    autoRefreshToken: true, // Rafraîchir automatiquement le token
    detectSessionInUrl: true, // Détecter la session dans l'URL pour le flow d'auth
    flowType: "pkce",
  },
});

// Fonction utilitaire pour vérifier si l'utilisateur est connecté
export const checkAuth = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error("Erreur lors de la vérification de la session:", error);
    return null;
  }
};
