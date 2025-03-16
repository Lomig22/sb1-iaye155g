import {
	AlertCircle,
	Check,
	Edit,
	Plus,
	Search,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { UnknownClient } from '../../types/database';
import { supabase } from '../../lib/supabase';
import UnknownClientForm from './UnknownClientForm';
import CSVImport from './CSVImport';

const UnknownClientList = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [importSuccess, setImportSuccess] = useState<string | null>(null);
	const [showImportModal, setShowImportModal] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [clients, setClients] = useState<UnknownClient[]>([]);
	const [selectedClient, setSelectedClient] = useState<UnknownClient | null>(
		null
	);
	const [showForm, setShowForm] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const fetchClients = async () => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Utilisateur non authentifié');

			setUserId(user.id);

			const { data: clientsData, error } = await supabase
				.from('unknown_client')
				.select('*')
				.eq('owner_id', user.id)
				.order('name');

			if (error) throw error;
			setClients(clientsData || []);
		} catch (error) {
			console.error('Erreur lors du chargement des clients:', error);
			setError('Impossible de charger la liste des clients');
		} finally {
			setIsLoading(false);
		}
	};
	useEffect(() => {
		fetchClients();
	}, []);

	const handleDeleteClick = (client: UnknownClient) => {
		setSelectedClient(client);
		setShowDeleteConfirm(true);
	};

	const handleDeleteConfirm = async () => {
		try {
			if (!selectedClient) return;
			setDeleting(true);
			const { error } = await supabase
				.from('unknown_client')
				.delete()
				.eq('id', selectedClient.id);

			if (error) {
				console.error('Erreur lors de la suppression du client:', error);
				setError('Une erreur est survenue lors de la suppression du client');
			}
		} catch (error) {
			console.error('Erreur lors de la suppression du client:', error);
			setError('Une erreur est survenue lors de la suppression du client');
		} finally {
			setDeleting(false);
			setSelectedClient(null);
			setShowDeleteConfirm(false);
			fetchClients();
		}
	};

	const handleImportSuccess = () => {
		setImportSuccess('Importation réussie');
		setShowImportModal(false);
		fetchClients();
	};

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-96'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}
	return (
		<div className='p-6'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-2xl font-bold text-gray-900'>Clients inconnus</h1>
				<div className='flex gap-4'>
					<button
						onClick={() => setShowImportModal(true)}
						className='bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2'
					>
						<Upload className='h-5 w-5' />
						Importer CSV
					</button>

					<button
						onClick={() => setShowForm(true)}
						className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2'
					>
						<Plus className='h-5 w-5' />
						Nouveau client
					</button>
				</div>
			</div>

			{error && (
				<div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center'>
					<AlertCircle className='h-5 w-5 mr-2' />
					{error}
				</div>
			)}

			{importSuccess && (
				<div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center'>
					<Check className='h-5 w-5 mr-2' />
					{importSuccess}
				</div>
			)}

			<div className='relative mb-6'>
				<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
				<input
					type='text'
					placeholder='Rechercher par nom, code client...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className='pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
				/>
			</div>

			<div className='bg-white rounded-lg shadow overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Actions
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									nom
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									numéro de facture
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									code client
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{clients.map((client) => (
								<tr key={client.id} className='hover:bg-gray-50'>
									<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
										<div className='flex space-x-3'>
											<button
												onClick={() => {
													setSelectedClient(client);
													setShowForm(true);
												}}
												className='text-blue-600 hover:text-blue-800'
												title='Modifier'
											>
												<Edit className='h-5 w-5' />
											</button>
											<button
												onClick={() => handleDeleteClick(client)}
												className='text-red-600 hover:text-red-800'
												title='Supprimer'
											>
												<Trash2 className='h-5 w-5' />
											</button>
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.name}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.invoice_no}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.name}
									</td>
								</tr>
							))}
							{clients.length === 0 && (
								<tr>
									<td
										colSpan={13}
										className='px-6 py-4 text-center text-gray-500'
									>
										Aucun client trouvé
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{showForm && (
				<UnknownClientForm
					onClose={() => {
						setShowForm(false);
						setSelectedClient(null);
					}}
					onClientAdded={(client) => {
						setClients([client, ...clients]);
						setShowForm(false);
					}}
					onClientUpdated={(updatedClient) => {
						setClients(
							clients.map((c) =>
								c.id === updatedClient.id ? { ...c, ...updatedClient } : c
							)
						);
						setShowForm(false);
						setSelectedClient(null);
					}}
					client={selectedClient ?? undefined}
					mode={selectedClient ? 'edit' : 'create'}
					ownerId={userId ?? ''}
				/>
			)}

			{showDeleteConfirm && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-lg font-medium text-gray-900'>
								Confirmer la suppression
							</h3>
							<button
								onClick={() => {
									setShowDeleteConfirm(false);
									setSelectedClient(null);
								}}
								className='text-gray-400 hover:text-gray-500'
							>
								<X className='h-5 w-5' />
							</button>
						</div>

						<p className='text-sm text-gray-500 mb-4'>
							Êtes-vous sûr de vouloir supprimer le client "
							{selectedClient?.name}" ? Cette action supprimera également toutes
							les créances et relances associées.
						</p>

						<div className='flex justify-end space-x-4'>
							<button
								onClick={() => {
									setShowDeleteConfirm(false);
									setSelectedClient(null);
								}}
								className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md'
							>
								Annuler
							</button>
							<button
								onClick={handleDeleteConfirm}
								disabled={deleting}
								className='px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50'
							>
								{deleting ? 'Suppression...' : 'Supprimer'}
							</button>
						</div>
					</div>
				</div>
			)}

			{showImportModal && (
				<CSVImport
					userId={userId ?? ''}
					onClose={() => setShowImportModal(false)}
					onImportSuccess={handleImportSuccess}
					unknownClientData={clients}
				/>
			)}
		</div>
	);
};

export default UnknownClientList;
