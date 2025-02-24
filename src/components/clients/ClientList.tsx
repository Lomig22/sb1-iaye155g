import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Client, Receivable } from '../../types/database';
import { Plus, Search, Upload, X, Edit, AlertCircle } from 'lucide-react';
import ClientForm from './ClientForm';
import ReceivableForm from '../receivables/ReceivableForm';

function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showReceivableForm, setShowReceivableForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour vérifier les créances en retard d'un client
  const checkClientReceivables = async (clientId: string) => {
    try {
      // Récupérer toutes les créances non payées
      const { data: receivables, error } = await supabase
        .from('receivables')
        .select('*')
        .eq('client_id', clientId)
        .not('status', 'eq', 'paid');

      if (error) throw error;

      if (!receivables || receivables.length === 0) {
        return false;
      }

      const today = new Date();
      // Un client nécessite une relance si une créance est en retard ou déjà en cours de relance
      return receivables.some(receivable => {
        const dueDate = new Date(receivable.due_date);
        return dueDate < today || ['reminded', 'late'].includes(receivable.status);
      });
    } catch (error) {
      console.error('Erreur lors de la vérification des créances:', error);
      throw error;
    }
  };

  // Fonction pour mettre à jour le statut de relance d'un client
  const updateClientReminderStatus = async (clientId: string) => {
    try {
      const needsReminder = await checkClientReceivables(clientId);
      
      const { error } = await supabase
        .from('clients')
        .update({ 
          needs_reminder: needsReminder,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      // Mettre à jour l'état local immédiatement
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId 
            ? { ...client, needs_reminder: needsReminder }
            : client
        )
      );

      return needsReminder;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de relance:', error);
      throw error;
    }
  };

  // Fonction pour charger et vérifier tous les clients
  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Récupérer tous les clients
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('owner_id', user.id)
        .order('company_name');

      if (error) throw error;

      // Vérifier les créances pour chaque client de manière séquentielle
      const updatedClients = [];
      for (const client of clientsData || []) {
        try {
          const needsReminder = await checkClientReceivables(client.id);
          // Si le statut a changé, mettre à jour dans la base de données
          if (needsReminder !== client.needs_reminder) {
            await supabase
              .from('clients')
              .update({ 
                needs_reminder: needsReminder,
                updated_at: new Date().toISOString()
              })
              .eq('id', client.id);
          }
          updatedClients.push({ ...client, needs_reminder: needsReminder });
        } catch (err) {
          console.error(`Erreur pour le client ${client.id}:`, err);
          updatedClients.push(client);
        }
      }

      setClients(updatedClients);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setError('Impossible de charger la liste des clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    // Mettre en place un écouteur pour les changements de créances
    const receivablesSubscription = supabase
      .channel('receivables-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'receivables' },
        async (payload) => {
          if (payload.new) {
            const receivable = payload.new as Receivable;
            try {
              // Mettre à jour immédiatement le statut du client concerné
              await updateClientReminderStatus(receivable.client_id);
            } catch (err) {
              console.error('Erreur lors de la mise à jour du statut:', err);
              // Recharger tous les clients en cas d'erreur
              await fetchClients();
            }
          }
        }
      )
      .subscribe();

    // Mettre en place un écouteur pour les changements de clients
    const clientsSubscription = supabase
      .channel('clients-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        async () => {
          // Recharger tous les clients pour s'assurer de la synchronisation
          await fetchClients();
        }
      )
      .subscribe();

    // Nettoyage des souscriptions
    return () => {
      receivablesSubscription.unsubscribe();
      clientsSubscription.unsubscribe();
    };
  }, []);

  const handleReminderClick = async (client: Client) => {
    if (!client.needs_reminder) {
      setSelectedClient(client);
      setShowReceivableForm(true);
    }
  };

  const handleReceivableAdded = async (receivable: any) => {
    try {
      // Mettre à jour immédiatement le statut du client
      await updateClientReminderStatus(receivable.client_id);
    } catch (err) {
      console.error('Erreur lors de la mise à jour après ajout:', err);
      // Recharger tous les clients en cas d'erreur
      await fetchClients();
    }
    setShowReceivableForm(false);
    setSelectedClient(null);
  };

  const columnMapping: { [key: string]: string } = {
    'email': 'email',
    'telephone': 'phone',
    'téléphone': 'phone',
    'adresse': 'address',
    'ville': 'city',
    'code postal': 'postal_code',
    'code_postal': 'postal_code',
    'pays': 'country',
    'secteur': 'industry',
    'site web': 'website',
    'site_web': 'website',
    'entreprise': 'company_name',
    'société': 'company_name',
    'societe': 'company_name',
    'nom': 'company_name',
    'raison sociale': 'company_name',
    'raison_sociale': 'company_name'
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setImportError('Veuillez sélectionner un fichier CSV');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
        
        const mappedHeaders = headers.map(header => columnMapping[header] || header);
        
        const requiredFields = ['email', 'company_name'];
        const missingFields = requiredFields.filter(field => !mappedHeaders.includes(field));
        
        if (missingFields.length > 0) {
          setImportError(`Champs obligatoires manquants : ${missingFields.join(', ')}`);
          return;
        }

        const preview = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(value => value.trim());
            const client: { [key: string]: string } = {};
            headers.forEach((header, index) => {
              const mappedHeader = columnMapping[header] || header;
              if (mappedHeader) {
                client[mappedHeader] = values[index] || '';
              }
            });
            return client;
          });

        setCsvPreview(preview);
        setShowImportModal(true);
        setImportError(null);
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier CSV:', error);
        setImportError('Erreur lors de la lecture du fichier CSV');
      }
    };

    reader.onerror = () => {
      setImportError('Erreur lors de la lecture du fichier');
    };

    reader.readAsText(file);
  };

  const processImport = async () => {
    try {
      setImporting(true);
      setImportError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Créer les clients avec needs_reminder à true par défaut
      const { data: newClients, error: insertError } = await supabase
        .from('clients')
        .insert(
          csvPreview.map(client => ({
            email: client.email,
            company_name: client.company_name,
            phone: client.phone || null,
            address: client.address || null,
            postal_code: client.postal_code || null,
            city: client.city || null,
            country: client.country || 'France',
            industry: client.industry || null,
            website: client.website || null,
            owner_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            needs_reminder: true // Définir à true par défaut
          }))
        )
        .select();

      if (insertError) throw insertError;

      // Pour chaque nouveau client, créer une créance en retard
      for (const client of newClients || []) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() - 1); // Date d'échéance à hier

        await supabase
          .from('receivables')
          .insert({
            client_id: client.id,
            invoice_number: `AUTO-${Math.random().toString(36).substr(2, 9)}`,
            amount: 0, // Montant fictif
            due_date: dueDate.toISOString().split('T')[0],
            status: 'late',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      // Mettre à jour l'état local avec les nouveaux clients
      setClients(prevClients => [...(newClients || []), ...prevClients]);
      setShowImportModal(false);
      setCsvPreview([]);
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setImportError('Erreur lors de l\'importation des données');
    } finally {
      setImporting(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.email.toLowerCase().includes(searchLower) ||
      client.company_name.toLowerCase().includes(searchLower) ||
      (client.phone && client.phone.toLowerCase().includes(searchLower)) ||
      (client.city && client.city.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="h-5 w-5" />
              Importer CSV
            </label>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nouveau client
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Rechercher par nom, email, téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ville
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code postal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pays
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Secteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site web
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mis à jour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.city || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.postal_code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.country || 'France'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.industry || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.website ? (
                      <a 
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Voir le site
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleReminderClick(client)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${
                        client.needs_reminder 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {client.needs_reminder ? 'Oui' : 'Non'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-4 text-center text-gray-500">
                    Aucun client trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ClientForm
          onClose={() => {
            setShowForm(false);
            setSelectedClient(null);
          }}
          onClientAdded={(client) => {
            setClients([client, ...clients]);
            setShowForm(false);
          }}
          onClientUpdated={(updatedClient) => {
            setClients(clients.map(c => 
              c.id === updatedClient.id ? updatedClient : c
            ));
            setShowForm(false);
            setSelectedClient(null);
          }}
          client={selectedClient}
          mode={selectedClient ? 'edit' : 'create'}
        />
      )}

      {showReceivableForm && selectedClient && (
        <ReceivableForm
          onClose={() => {
            setShowReceivableForm(false);
            setSelectedClient(null);
          }}
          onReceivableAdded={handleReceivableAdded}
          preselectedClient={selectedClient}
        />
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Prévisualisation de l'import
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setCsvPreview([]);
                  setImportError(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {importError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {importError}
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {csvPreview.length} client(s) à importer
              </p>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(csvPreview[0] || {}).map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {csvPreview.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setCsvPreview([]);
                  setImportError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                Annuler
              </button>
              <button
                onClick={processImport}
                disabled={importing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {importing ? 'Importation...' : 'Confirmer l\'import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientList;