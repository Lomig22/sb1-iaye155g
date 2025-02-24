import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Client } from '../../types/database';
import { X, Upload } from 'lucide-react';

interface ReceivableFormProps {
  onClose: () => void;
  onReceivableAdded: (receivable: any) => void;
  preselectedClient?: Client;
}

export default function ReceivableForm({ onClose, onReceivableAdded, preselectedClient }: ReceivableFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client_id: preselectedClient?.id || '',
    invoice_number: '',
    amount: '',
    due_date: '',
    status: 'pending',
    invoice_pdf_url: ''
  });

  useEffect(() => {
    if (!preselectedClient) {
      fetchClients();
    } else {
      setClients([preselectedClient]);
    }
  }, [preselectedClient]);

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('owner_id', user.id)
        .order('company_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setError('Impossible de charger la liste des clients');
    }
  };

  const updateClientStatus = async (clientId: string) => {
    try {
      // Récupérer toutes les créances du client
      const { data: clientReceivables, error: receivablesError } = await supabase
        .from('receivables')
        .select('status, due_date')
        .eq('client_id', clientId);

      if (receivablesError) throw receivablesError;

      // Vérifier s'il y a des créances en retard
      const today = new Date();
      const hasOverdueReceivables = clientReceivables?.some(receivable => {
        const dueDate = new Date(receivable.due_date);
        return dueDate < today && receivable.status !== 'paid';
      });

      // Mettre à jour le statut de relance du client
      const { error: updateError } = await supabase
        .from('clients')
        .update({ 
          needs_reminder: hasOverdueReceivables,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (updateError) throw updateError;

      // Mettre à jour la liste des clients en local si nécessaire
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId 
            ? { ...client, needs_reminder: hasOverdueReceivables }
            : client
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut client:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Vérifier si la date d'échéance est dépassée
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      const isOverdue = dueDate < today;

      // Ajouter la nouvelle créance
      const { data, error } = await supabase
        .from('receivables')
        .insert([{
          ...formData,
          amount: parseFloat(formData.amount),
          status: isOverdue ? 'late' : 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('*, client:clients(*)')
        .single();

      if (error) throw error;
      
      if (data) {
        // Mettre à jour le statut du client
        await updateClientStatus(data.client_id);
        
        // Notifier le composant parent avec les données mises à jour
        onReceivableAdded(data);
        onClose();
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de la créance:', error);
      setError('Impossible d\'ajouter la créance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-scroll">
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-xl mx-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>

          <h2 className="text-2xl font-bold mb-6">Nouvelle créance</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!!preselectedClient}
              >
                <option value="">Sélectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de facture *
              </label>
              <input
                type="text"
                required
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (€) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'échéance *
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF de la facture
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Télécharger un fichier</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf"
                        onChange={(e) => {
                          // Logique de téléchargement du fichier à implémenter
                          console.log('File selected:', e.target.files?.[0]);
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PDF jusqu'à 10MB</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}