import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertCircle, Save, HelpCircle, Send } from 'lucide-react';
import { sendEmail } from '../../lib/email';

const PROVIDER_PRESETS = {
  ovh: {
    smtp_server: 'ssl0.ovh.net',
    smtp_port: 587,
    smtp_encryption: 'tls'
  },
  gmail: {
    smtp_server: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_encryption: 'tls'
  },
  custom: {
    smtp_server: '',
    smtp_port: 587,
    smtp_encryption: 'tls'
  }
};

const DEFAULT_FORM_DATA = {
  provider_type: 'gmail',
  smtp_username: '',
  smtp_password: '',
  smtp_server: PROVIDER_PRESETS.gmail.smtp_server,
  smtp_port: PROVIDER_PRESETS.gmail.smtp_port,
  smtp_encryption: PROVIDER_PRESETS.gmail.smtp_encryption,
  email_signature: ''
};

export default function EmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non authentifié');
        setUserId(user.id);
        await loadEmailSettings(user.id);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setError('Impossible de charger les paramètres email');
      } finally {
        setLoading(false);
      }
    };

    initializeSettings();
  }, []);

  const loadEmailSettings = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          provider_type: data.provider_type || 'gmail',
          smtp_username: data.smtp_username || '',
          smtp_password: data.smtp_password || '',
          smtp_server: data.smtp_server || PROVIDER_PRESETS.gmail.smtp_server,
          smtp_port: data.smtp_port || PROVIDER_PRESETS.gmail.smtp_port,
          smtp_encryption: data.smtp_encryption || PROVIDER_PRESETS.gmail.smtp_encryption,
          email_signature: data.email_signature || ''
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      throw error;
    }
  };

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDER_PRESETS[provider as keyof typeof PROVIDER_PRESETS];
    setFormData(prev => ({
      ...prev,
      provider_type: provider,
      smtp_server: preset.smtp_server,
      smtp_port: preset.smtp_port,
      smtp_encryption: preset.smtp_encryption
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('Utilisateur non authentifié');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('email_settings')
        .upsert({
          user_id: userId,
          ...formData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      setSuccess(true);
      
      // Recharger les paramètres pour confirmer la mise à jour
      await loadEmailSettings(userId);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Impossible de sauvegarder les paramètres');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!formData.smtp_username || !formData.smtp_password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setTesting(true);
    setError(null);
    setTestSuccess(false);

    try {
      await sendEmail(
        formData,
        formData.smtp_username,
        'Test de configuration email PaymentFlow',
        `
          <h1>Test de configuration email</h1>
          <p>Si vous recevez cet email, votre configuration SMTP est correcte !</p>
          <p>Paramètres utilisés :</p>
          <ul>
            <li>Serveur SMTP : ${formData.smtp_server}</li>
            <li>Port : ${formData.smtp_port}</li>
            <li>Chiffrement : ${formData.smtp_encryption}</li>
          </ul>
        `
      );

      setTestSuccess(true);
    } catch (error: any) {
      console.error('Erreur lors du test d\'envoi:', error);
      setError(error.message || 'Impossible d\'envoyer l\'email de test. Vérifiez vos paramètres.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Paramètres email</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
          Paramètres sauvegardés avec succès
        </div>
      )}

      {testSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
          Email de test envoyé avec succès ! Vérifiez votre boîte de réception.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fournisseur SMTP
          </label>
          <select
            value={formData.provider_type}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="gmail">Gmail</option>
            <option value="ovh">OVH</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse email
          </label>
          <input
            type="email"
            required
            value={formData.smtp_username}
            onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {formData.provider_type === 'gmail' && (
            <p className="mt-1 text-sm text-gray-500 flex items-center">
              <HelpCircle className="h-4 w-4 mr-1" />
              Utilisez votre adresse Gmail
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe
          </label>
          <input
            type="password"
            required
            value={formData.smtp_password}
            onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {formData.provider_type === 'gmail' && (
            <p className="mt-1 text-sm text-gray-500 flex items-center">
              <HelpCircle className="h-4 w-4 mr-1" />
              Utilisez un mot de passe d'application généré dans les paramètres de sécurité Google
            </p>
          )}
        </div>

        {formData.provider_type === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serveur SMTP
              </label>
              <input
                type="text"
                required
                value={formData.smtp_server}
                onChange={(e) => setFormData({ ...formData, smtp_server: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port SMTP
              </label>
              <input
                type="number"
                required
                value={formData.smtp_port}
                onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chiffrement SMTP
              </label>
              <select
                value={formData.smtp_encryption}
                onChange={(e) => setFormData({ ...formData, smtp_encryption: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">Aucun</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signature email
          </label>
          <textarea
            rows={4}
            value={formData.email_signature}
            onChange={(e) => setFormData({ ...formData, email_signature: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Votre signature email..."
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testing || !formData.smtp_username || !formData.smtp_password}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Send className="h-5 w-5 mr-2" />
            {testing ? 'Envoi en cours...' : 'Tester l\'envoi'}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}