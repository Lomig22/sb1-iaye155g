import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Receivable, Client } from '../../types/database';
import { FileText, Mail, AlertCircle, Clock, CheckCircle, X, Edit, AlertTriangle, Upload, Plus, Search } from 'lucide-react';
import ReceivableForm from './ReceivableForm';
import ReceivableEditForm from './ReceivableEditForm';
import ReminderSettingsModal from './ReminderSettingsModal';
import { sendManualReminder } from '../../lib/reminderService';

export default function ReceivablesList() {
  const [receivables, setReceivables] = useState<(Receivable & { client: Client })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState<(Receivable & { client: Client }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReceivables = async () => {
    try {
      const { data, error } = await supabase
        .from('receivables')
        .select(`
          *,
          client:clients(*)
        `)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setReceivables(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des créances:', error);
      setError('Impossible de charger les créances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('Aucun fichier sélectionné');
      return;
    }

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
        
        const columnMapping: { [key: string]: string } = {
          // Numéro de facture
          'facture': 'invoice_number',
          'numéro de facture': 'invoice_number',
          'n° facture': 'invoice_number',
          'n°facture': 'invoice_number',
          'num facture': 'invoice_number',
          'invoice': 'invoice_number',
          'invoice number': 'invoice_number',
          'invoice_number': 'invoice_number',
          'numero facture': 'invoice_number',
          'numéro': 'invoice_number',
          'ref': 'invoice_number',
          'référence': 'invoice_number',
          'reference': 'invoice_number',

          // Numéro dans gestion
          'n° gestion': 'management_number',
          'n°gestion': 'management_number',
          'num gestion': 'management_number',
          'numéro gestion': 'management_number',
          'numero gestion': 'management_number',
          'ref gestion': 'management_number',
          'référence gestion': 'management_number',
          'reference gestion': 'management_number',
          'management number': 'management_number',
          'management_number': 'management_number',
          'internal ref': 'management_number',
          'internal reference': 'management_number',

          // Code
          'code': 'code',
          'code facture': 'code',
          'code client': 'code',
          'code référence': 'code',
          'code reference': 'code',
          'invoice code': 'code',
          'ref code': 'code',

          // Montant
          'montant': 'amount',
          'montant ht': 'amount',
          'montant ttc': 'amount',
          'prix': 'amount',
          'total': 'amount',
          'amount': 'amount',
          'price': 'amount',
          'total amount': 'amount',
          'somme': 'amount',

          // Montant réglé
          'montant réglé': 'paid_amount',
          'montant regle': 'paid_amount',
          'montant payé': 'paid_amount',
          'montant paye': 'paid_amount',
          'réglé': 'paid_amount',
          'regle': 'paid_amount',
          'payé': 'paid_amount',
          'paye': 'paid_amount',
          'paid': 'paid_amount',
          'paid_amount': 'paid_amount',
          'payment': 'paid_amount',

          // Date d'échéance
          'date d\'échéance': 'due_date',
          'date d\'echeance': 'due_date',
          'date échéance': 'due_date',
          'date echeance': 'due_date',
          'échéance': 'due_date',
          'echeance': 'due_date',
          'due date': 'due_date',
          'due_date': 'due_date',
          'deadline': 'due_date',
          'date limite': 'due_date',
          'date butoir': 'due_date',

          // Statut
          'statut': 'status',
          'état': 'status',
          'etat': 'status',
          'status': 'status',
          'state': 'status',

          // Client
          'client': 'client_id',
          'client_id': 'client_id',
          'nom client': 'client_id',
          'nom du client': 'client_id',
          'raison sociale': 'client_id',
          'société': 'client_id',
          'societe': 'client_id',
          'entreprise': 'client_id',
          'customer': 'client_id',
          'customer name': 'client_id',
          'company': 'client_id',
          'company name': 'client_id',
          'nom (client)': 'client_id',

          // Numéro d'échéance
          'n° échéance': 'installment_number',
          'n°échéance': 'installment_number',
          'num échéance': 'installment_number',
          'numéro échéance': 'installment_number',
          'numero echeance': 'installment_number',
          'installment': 'installment_number',
          'installment number': 'installment_number',
          'installment_number': 'installment_number',
          'payment number': 'installment_number',
          'n° paiement': 'installment_number'
        };

        const mappedHeaders = headers.map(header => columnMapping[header] || header);
        
        const requiredHeaders = ['invoice_number', 'amount', 'due_date', 'client_id'];
        const missingHeaders = requiredHeaders.filter(required => 
          !mappedHeaders.includes(required) && 
          !headers.some(h => columnMapping[h] === required)
        );
        
        if (missingHeaders.length > 0) {
          setImportError(`Colonnes obligatoires manquantes : ${missingHeaders.join(', ')}`);
          return;
        }

        const allData = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(value => value.trim());
            const receivableData: { [key: string]: any } = {};

            headers.forEach((header, index) => {
              const mappedHeader = columnMapping[header] || header;
              let value = values[index] || '';
              
              if (requiredHeaders.includes(mappedHeader) && !value) {
                throw new Error(`La valeur pour ${mappedHeader} ne peut pas être vide`);
              }

              if (mappedHeader === 'amount' || mappedHeader === 'paid_amount') {
                value = parseFloat(value.replace(/[^\d.-]/g, ''));
                if (isNaN(value)) {
                  throw new Error('Montant invalide');
                }
              }

              if (mappedHeader === 'due_date') {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                  throw new Error('Date d\'échéance invalide');
                }
                value = date.toISOString().split('T')[0];
              }

              if (mappedHeader === 'status') {
                value = value.toLowerCase();
                if (!['pending', 'reminded', 'paid', 'late', 'legal'].includes(value)) {
                  value = 'pending';
                }
              }

              receivableData[mappedHeader] = value;
            });

            return receivableData;
          });

        setCsvPreview(allData);
        setShowImportModal(true);
        setImportError(null);
      } catch (error: any) {
        console.error('Erreur lors de la lecture du fichier CSV:', error);
        setImportError(error.message || 'Erreur lors de la lecture du fichier CSV');
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

      // Insérer les nouvelles créances
      const { error: insertError } = await supabase
        .from('receivables')
        .insert(
          csvPreview.map(receivable => ({
            ...receivable,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        );

      if (insertError) throw insertError;

      await fetchReceivables();
      setShowImportModal(false);
      setCsvPreview([]);
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setImportError('Erreur lors de l\'importation des données');
    } finally {
      setImporting(false);
    }
  };

  const handleSendReminder = async (receivable: Receivable & { client: Client }) => {
    try {
      const success = await sendManualReminder(receivable.id);
      if (success) {
        await fetchReceivables();
      } else {
        setError('Impossible d\'envoyer la relance');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la relance:', error);
      setError('Erreur lors de l\'envoi de la relance');
    }
  };

  const filteredReceivables = receivables.filter(receivable => {
    const searchLower = searchTerm.toLowerCase();
    return (
      receivable.invoice_number.toLowerCase().includes(searchLower) ||
      receivable.client.company_name.toLowerCase().includes(searchLower) ||
      receivable.client.email.toLowerCase().includes(searchLower) ||
      receivable.amount.toString().includes(searchTerm) ||
      receivable.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'reminded':
        return 'bg-yellow-100 text-yellow-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      case 'legal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'reminded':
        return 'Relancé';
      case 'late':
        return 'En retard';
      case 'legal':
        return 'Contentieux';
      default:
        return 'En attente';
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Créances</h1>
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
            Nouvelle créance
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
          placeholder="Rechercher par numéro de facture, client, montant..."
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
                  N° dans gestion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant réglé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                  Date d'échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mis à jour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° échéance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceivables.map((receivable) => (
                <tr key={receivable.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedReceivable(receivable)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {receivable.status !== 'paid' && (
                        <button
                          onClick={() => handleSendReminder(receivable)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Envoyer une relance"
                        >
                          <Mail className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedClient(receivable.client);
                          setShowSettings(true);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                        title="Paramètres de relance"
                      >
                        <Clock className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {receivable.management_number || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {receivable.invoice_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {receivable.code || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {receivable.client.company_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {receivable.client.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(receivable.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receivable.paid_amount !== undefined ? 
                      new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(receivable.paid_amount)
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-yellow-50">
                    {new Date(receivable.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(receivable.status)}`}>
                      {getStatusText(receivable.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(receivable.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(receivable.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {receivable.installment_number || '-'}
                  </td>
                </tr>
              ))}
              {filteredReceivables.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-4 text-center text-gray-500">
                    Aucune créance trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ReceivableForm
          onClose={() => setShowForm(false)}
          onReceivableAdded={(receivable) => {
            setReceivables([receivable, ...receivables]);
            setShowForm(false);
          }}
        />
      )}

      {selectedReceivable && (
        <ReceivableEditForm
          onClose={() => setSelectedReceivable(null)}
          onReceivableUpdated={(updatedReceivable) => {
            setReceivables(receivables.map(r => 
              r.id === updatedReceivable.id ? updatedReceivable : r
            ));
            setSelectedReceivable(null);
          }}
          receivable={selectedReceivable}
        />
      )}

      {showSettings && selectedClient && (
        <ReminderSettingsModal
          client={selectedClient}
          onClose={() => {
            setShowSettings(false);
            setSelectedClient(null);
          }}
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
                Aperçu des données à importer :
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