import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const validatePassword = (password: string) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasSpecialChar,
    errors: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasSpecialChar,
    },
  };
};

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isValidLink, setIsValidLink] = useState(true);

  useEffect(() => {
    const handleAuthentication = async () => {
      const code = searchParams.get("code");
      const type = searchParams.get("type");

      // Only handle password reset flow
      if (type === "recovery" && code) {
        try {
          const { error } = await supabase.auth.exchangeAuthCodeForSession({
            code,
          });

          if (error) {
            setIsValidLink(false);
            setMessage({
              type: "error",
              text: "Lien de réinitialisation invalide ou expiré",
            });
          }
        } catch (error) {
          setIsValidLink(false);
          setMessage({
            type: "error",
            text: "Lien de réinitialisation invalide ou expiré",
          });
        }
      } else {
        setIsValidLink(false);
      }
    };

    handleAuthentication();
  }, [navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const errors = [];
      if (!passwordValidation.errors.minLength)
        errors.push("8 caractères minimum");
      if (!passwordValidation.errors.hasUpperCase) errors.push("une majuscule");
      if (!passwordValidation.errors.hasLowerCase) errors.push("une minuscule");
      if (!passwordValidation.errors.hasSpecialChar)
        errors.push("un caractère spécial");

      setMessage({
        type: "error",
        text: `Le mot de passe doit contenir : ${errors.join(", ")}`,
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Les mots de passe ne correspondent pas.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Mot de passe mis à jour avec succès! Vous pouvez maintenant vous connecter.",
      });

      // Clear session after successful password reset
      await supabase.auth.signOut();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erreur lors de la mise à jour du mot de passe",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
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
              <div className="flex items-center">
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage(null);
                    setShowPasswordRequirements(true);
                  }}
                  onFocus={() => setShowPasswordRequirements(true)}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
              {showPasswordRequirements && (
                <div className="mt-2 text-sm">
                  <p className="font-medium text-gray-700 mb-1">
                    Le mot de passe doit contenir :
                  </p>
                  <ul className="space-y-1 text-gray-500">
                    <li
                      className={password.length >= 8 ? "text-green-600" : ""}
                    >
                      • Au moins 8 caractères
                    </li>
                    <li
                      className={/[A-Z]/.test(password) ? "text-green-600" : ""}
                    >
                      • Une lettre majuscule
                    </li>
                    <li
                      className={/[a-z]/.test(password) ? "text-green-600" : ""}
                    >
                      • Une lettre minuscule
                    </li>
                    <li
                      className={
                        /[!@#$%^&*(),.?":{}|<>]/.test(password)
                          ? "text-green-600"
                          : ""
                      }
                    >
                      • Un caractère spécial (!@#$%^&amp;*(),.?&quot;:{}
                      |&lt;&gt;)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setMessage(null);
                  }}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </button>
          </form>

          {message?.type === "success" && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Retour à la page de connexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
