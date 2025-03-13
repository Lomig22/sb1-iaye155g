import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Client } from '../../types/database';
import {
	Plus,
	Search,
	Edit,
	AlertCircle,
	Trash2,
	X,
	Upload,
	Check,
	Info,
} from 'lucide-react';
import ClientForm from './ClientForm';
import CSVImportModal from './CSVImportModal';

function ClientList() {
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [selectedClient, setSelectedClient] = useState<Client | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [importSuccess, setImportSuccess] = useState<string | null>(null);
	const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

	const fetchClients = async () => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Utilisateur non authentifié');

			const { data: clientsData, error } = await supabase
				.from('clients')
				.select('*')
				.eq('owner_id', user.id)
				.order('company_name');

			if (error) throw error;
			setClients(clientsData || []);
		} catch (error) {
			console.error('Erreur lors du chargement des clients:', error);
			setError('Impossible de charger la liste des clients');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchClients();
	}, []);

	useEffect(() => {
		if (importSuccess) {
			const timer = setTimeout(() => {
				setImportSuccess(null);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [importSuccess]);

	const handleDeleteClick = (client: Client) => {
		setClientToDelete(client);
		setShowDeleteConfirm(true);
	};

	const handleDeleteConfirm = async () => {
		if (!clientToDelete) return;

		try {
			setDeleting(true);
			setError(null);

			const { error } = await supabase
				.from('clients')
				.delete()
				.eq('id', clientToDelete.id);

			if (error) throw error;

			setClients(clients.filter((c) => c.id !== clientToDelete.id));
			setShowDeleteConfirm(false);
			setClientToDelete(null);
		} catch (error) {
			console.error('Erreur lors de la suppression du client:', error);
			setError('Impossible de supprimer le client');
		} finally {
			setDeleting(false);
		}
	};

	const handleImportSuccess = (importedCount: number) => {
		setImportSuccess(`${importedCount} client(s) importé(s) avec succès`);
		fetchClients();
		setShowImportModal(false);
	};

	const filteredClients = clients.filter((client) => {
		const searchLower = searchTerm.toLowerCase();
		return (
			client.email.toLowerCase().includes(searchLower) ||
			client.company_name.toLowerCase().includes(searchLower) ||
			(client.phone && client.phone.toLowerCase().includes(searchLower)) ||
			(client.city && client.city.toLowerCase().includes(searchLower))
		);
	});

	const handleMouseEnter = (clientId: string) => {
		setTooltipVisible(clientId);
	};

	const handleMouseLeave = () => {
		setTooltipVisible(null);
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('fr-FR');
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center h-96'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	return (
		<div className='p-6'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-2xl font-bold text-gray-900'>Clients</h1>
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
					placeholder='Rechercher par nom, email, téléphone...'
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
									Entreprise
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Code Client
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Email
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Téléphone
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Adresse
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Ville
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Code postal
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Pays
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Secteur
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Site web
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Créé le
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Mis à jour
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Relance
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Commentaire
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{filteredClients.map((client) => (
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
										{client.company_name}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.client_code}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.email}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{client.phone || '-'}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{client.address || '-'}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{client.city || '-'}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{client.postal_code || '-'}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{client.country || 'France'}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{client.industry || '-'}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{client.website ? (
											<a
												href={
													client.website.startsWith('http')
														? client.website
														: `https://${client.website}`
												}
												target='_blank'
												rel='noopener noreferrer'
												className='text-blue-600 hover:underline'
											>
												{client.website}
											</a>
										) : (
											'-'
										)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{formatDate(client.created_at)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{formatDate(client.updated_at)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='flex items-center'>
											<span
												className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
													client.needs_reminder
														? 'bg-red-100 text-red-800'
														: 'bg-green-100 text-green-800'
												}`}
											>
												{client.needs_reminder ? 'Oui' : 'Non'}
											</span>
											{client.needs_reminder && !client.reminder_template_1 && (
												<div className='relative ml-2'>
													<div
														className='text-yellow-500 cursor-help'
														onMouseEnter={() => handleMouseEnter(client.id)}
														onMouseLeave={handleMouseLeave}
													>
														<Info className='h-4 w-4' />
													</div>
													{tooltipVisible === client.id && (
														<div className='absolute z-10 w-64 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm -left-32 bottom-full mb-1'>
															Paramètres de relance non configurés. Veuillez
															configurer les modèles de relance pour ce client.
															<div
																className='tooltip-arrow'
																data-popper-arrow
															></div>
														</div>
													)}
												</div>
											)}
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{client.notes}
									</td>
								</tr>
							))}
							{filteredClients.length === 0 && (
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
						setClients(
							clients.map((c) =>
								c.id === updatedClient.id ? updatedClient : c
							)
						);
						setShowForm(false);
						setSelectedClient(null);
					}}
					client={selectedClient}
					mode={selectedClient ? 'edit' : 'create'}
				/>
			)}

			{showDeleteConfirm && clientToDelete && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-lg font-medium text-gray-900'>
								Confirmer la suppression
							</h3>
							<button
								onClick={() => {
									setShowDeleteConfirm(false);
									setClientToDelete(null);
								}}
								className='text-gray-400 hover:text-gray-500'
							>
								<X className='h-5 w-5' />
							</button>
						</div>

						<p className='text-sm text-gray-500 mb-4'>
							Êtes-vous sûr de vouloir supprimer le client "
							{clientToDelete.company_name}" ? Cette action supprimera également
							toutes les créances et relances associées.
						</p>

						<div className='flex justify-end space-x-4'>
							<button
								onClick={() => {
									setShowDeleteConfirm(false);
									setClientToDelete(null);
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
				<CSVImportModal
					onClose={() => setShowImportModal(false)}
					onImportSuccess={handleImportSuccess}
				/>
			)}
		</div>
	);
}

export default ClientList;
