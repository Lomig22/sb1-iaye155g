import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Mail, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [lastResetAttempt, setLastResetAttempt] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate email
    if (!email.includes("@") || !email.includes(".")) {
      setMessage({ type: "error", text: "Veuillez saisir un email valide." });
      setLoading(false);
      return;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastAttempt = now - lastResetAttempt;
    if (timeSinceLastAttempt < 15000) {
      setMessage({
        type: "error",
        text: `Veuillez attendre ${Math.ceil(
          (15000 - timeSinceLastAttempt) / 1000
        )} secondes avant de réessayer.`,
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?type=recovery`,
      });

      if (error) {
        if (error.message.includes("rate_limit")) {
          throw new Error(
            "Pour des raisons de sécurité, veuillez attendre quelques secondes avant de réessayer."
          );
        }
        throw error;
      }

      setLastResetAttempt(now);
      setMessage({
        type: "success",
        text: "Un email de réinitialisation vous a été envoyé. Veuillez vérifier votre boîte de réception.",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.message || "Une erreur est survenue lors de l'envoi de l'email",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100/80 backdrop-blur-sm flex items-center justify-center p-4 fixed inset-0 z-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 relative">
        <h2 className="text-2xl font-bold text-center mb-8">
          Réinitialisation du mot de passe
        </h2>

        {message && (
          <div
            className={`p-4 rounded-md mb-6 ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="exemple@email.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Envoi en cours..." : "Envoyer les instructions"}
          </button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </form>

        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
