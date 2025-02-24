import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, X, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onClose?: () => void;
}

const validatePassword = (password: string) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-_]/.test(password);

  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasSpecialChar,
    errors: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasSpecialChar,
    }
  };
};

export default function Auth({ onClose }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [lastResetAttempt, setLastResetAttempt] = useState(0);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (onClose) {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleEscape);
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const validateForm = () => {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Veuillez saisir votre email.' });
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setMessage({ type: 'error', text: 'Veuillez saisir un email valide.' });
      return false;
    }

    if (!isResetPassword) {
      if (isSignUp) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          const errors = [];
          if (!passwordValidation.errors.minLength) errors.push('8 caractères minimum');
          if (!passwordValidation.errors.hasUpperCase) errors.push('une majuscule');
          if (!passwordValidation.errors.hasLowerCase) errors.push('une minuscule');
          if (!passwordValidation.errors.hasSpecialChar) errors.push('un caractère spécial');
          
          setMessage({ 
            type: 'error', 
            text: `Le mot de passe doit contenir : ${errors.join(', ')}`
          });
          return false;
        }

        if (password !== confirmPassword) {
          setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
          return false;
        }
      }
    }

    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const now = Date.now();
    const timeSinceLastAttempt = now - lastResetAttempt;
    if (timeSinceLastAttempt < 15000) {
      setMessage({
        type: 'error',
        text: `Veuillez attendre ${Math.ceil((15000 - timeSinceLastAttempt) / 1000)} secondes avant de réessayer.`
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#type=recovery`
      });

      if (error) {
        if (error.message.includes('rate_limit')) {
          throw new Error('Pour des raisons de sécurité, veuillez attendre quelques secondes avant de réessayer.');
        }
        throw error;
      }

      setLastResetAttempt(now);
      setMessage({
        type: 'success',
        text: 'Un email de réinitialisation de mot de passe vous a été envoyé. Veuillez vérifier votre boîte de réception.'
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        // Vérifier si l'utilisateur existe déjà
        if (data?.user?.identities?.length === 0) {
          setMessage({
            type: 'error',
            text: 'Cette adresse email est déjà utilisée.'
          });
          return;
        }
        
        setMessage({
          type: 'success',
          text: 'Un e-mail de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception.'
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email ou mot de passe incorrect.');
          }
          throw error;
        }
      }
    } catch (error: any) {
      if (error.message.includes('User already registered')) {
        setMessage({
          type: 'error',
          text: 'Cette adresse email est déjà utilisée.'
        });
      } else {
        setMessage({
          type: 'error',
          text: error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
    setIsResetPassword(false);
    setShowPasswordRequirements(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="min-h-screen bg-gray-100/80 backdrop-blur-sm flex items-center justify-center p-4 fixed inset-0 z-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
        
        <h2 className="text-2xl font-bold text-center mb-8">
          {isResetPassword 
            ? 'Réinitialiser le mot de passe'
            : (isSignUp ? 'Créer un compte' : 'Se connecter')}
        </h2>

        {message && (
          <div className={`p-4 rounded-md mb-6 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={isResetPassword ? handleResetPassword : handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage(null);
                }}
                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="exemple@email.com"
              />
            </div>
          </div>

          {!isResetPassword && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setMessage(null);
                      if (isSignUp) setShowPasswordRequirements(true);
                    }}
                    onFocus={() => {
                      if (isSignUp) setShowPasswordRequirements(true);
                    }}
                    className="pl-10 pr-12 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="••••••••"
                    minLength={isSignUp ? 8 : undefined}
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {isSignUp && showPasswordRequirements && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium text-gray-700 mb-1">Le mot de passe doit contenir :</p>
                    <ul className="space-y-1 text-gray-500">
                      <li className={password.length >= 8 ? 'text-green-600' : ''}>
                        • Au moins 8 caractères
                      </li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                        • Une lettre majuscule
                      </li>
                      <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                        • Une lettre minuscule
                      </li>
                      <li className={/[!@#$%^&*(),.?":{}|<>\-_]/.test(password) ? 'text-green-600' : ''}>
                        • Un caractère spécial (!@#$%^&amp;*(),.?&quot;:{}|&lt;&gt;-_)
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setMessage(null);
                      }}
                      className="pl-10 pr-12 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="••••••••"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onMouseDown={() => setShowConfirmPassword(true)}
                      onMouseUp={() => setShowConfirmPassword(false)}
                      onMouseLeave={() => setShowConfirmPassword(false)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement...' : (
              isResetPassword 
                ? 'Envoyer les instructions'
                : (isSignUp ? 'S\'inscrire' : 'Se connecter')
            )}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {!isResetPassword && (
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  resetForm();
                }}
                className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                {isSignUp ? 'Se connecter' : 'S\'inscrire'}
              </button>
            </p>
          )}

          {!isSignUp && !isResetPassword && (
            <p className="text-sm">
              <button
                onClick={() => setIsResetPassword(true)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Mot de passe oublié ?
              </button>
            </p>
          )}

          {isResetPassword && (
            <p className="text-sm">
              <button
                onClick={() => {
                  resetForm();
                  setIsSignUp(false);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Retour à la connexion
              </button>
            </p>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="mt-6 w-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour à l'accueil
          </button>
        )}
      </div>
    </div>
  );
}