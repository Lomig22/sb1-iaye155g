import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Client, ReminderProfile } from '../../types/database';
import { Search, Edit, Trash2, X, Info } from 'lucide-react';
import ClientForm from './ClientForm';
import CSVImportModal, { CSVMapping } from './CSVImportModal';
import SortableColHead from '../Common/SortableColHead';
import {
	booleanCompare,
	dateCompare,
	stringCompare,
} from '../../lib/comparers';

type ClientListProps = {
	showForm: boolean;
	setShowForm: (show: boolean) => void;
	showImportModal: boolean;
	setShowImportModal: (show: boolean) => void;
	setError: (error: string | null) => void;
	setImportSuccess: (message: string | null) => void;
	importSuccess: string | null;
};

type SortColumnConfig = {
	key: keyof CSVMapping;
	sort: 'none' | 'asc' | 'desc';
};

function ClientList({
	showForm,
	setShowForm,
	showImportModal,
	setShowImportModal,
	setError,
	importSuccess,
	setImportSuccess,
}: ClientListProps) {
	const [clients, setClients] = useState<
		(Client & { reminderProfile?: ReminderProfile })[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedClient, setSelectedClient] = useState<Client | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
	const [sortConfig, setSortConfig] = useState<SortColumnConfig | null>({
		key: 'company_name',
		sort: 'asc',
	});

	const fetchClients = async () => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Utilisateur non authentifié');

			const { data: clientsData, error } = await supabase
				.from('clients')
				.select('*, reminderProfile:reminder_profile(*)')
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

	const formatEmail = (emails: string) => {
		const splitMail = emails.split(',');
		return splitMail.length > 1 ? `${splitMail[0]}...` : splitMail[0];
	};

	const handleSortOnClick = (key: keyof CSVMapping) => {
		if (sortConfig?.key === key) {
			setSortConfig({
				...sortConfig,
				sort: sortConfig.sort === 'asc' ? 'desc' : 'asc',
			});
		} else {
			setSortConfig({
				key,
				sort: 'asc',
			});
		}
	};

	const applySorting = (
		a: Client & { reminderProfile?: ReminderProfile },
		b: Client & { reminderProfile?: ReminderProfile }
	) => {
		if (!sortConfig) return 0;
		const { key, sort } = sortConfig;

		if (key === 'company_name') {
			return stringCompare(a.company_name, b.company_name, sort);
		}
		if (key === 'client_code') {
			return stringCompare(a.client_code, b.client_code, sort);
		}
		if (key === 'email') {
			return stringCompare(a.email, b.email, sort);
		}
		if (key === 'needs_reminder') {
			return booleanCompare(a.needs_reminder, b.needs_reminder, sort);
		}
		if (key === 'created_at') {
			return dateCompare(a.created_at, b.created_at, sort);
		}
		if (key === 'updated_at') {
			return dateCompare(a.updated_at, b.updated_at, sort);
		}

		return 0;
	};

	const filteredClients = clients
		.filter((client) => {
			const searchLower = searchTerm.toLowerCase();
			return (
				client.email.toLowerCase().includes(searchLower) ||
				client.company_name.toLowerCase().includes(searchLower) ||
				(client.phone && client.phone.toLowerCase().includes(searchLower)) ||
				(client.city && client.city.toLowerCase().includes(searchLower))
			);
		})
		.sort(applySorting);

	return (
		<>
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
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide'>
									<SortableColHead
										colKey='company_name'
										label='Entreprise'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='client_code'
										label='Code Client'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='email'
										label='Email'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
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
									<SortableColHead
										colKey='created_at'
										label='Créé le'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='updated_at'
										label='Mis à jour'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Profil de rappel
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='needs_reminder'
										label='Relance'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
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
										{formatEmail(client.email)}
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
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{client.reminderProfile?.name || '-'}
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
								c.id === updatedClient.id ? { ...c, ...updatedClient } : c
							)
						);
						setShowForm(false);
						setSelectedClient(null);
					}}
					client={selectedClient ?? undefined}
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
		</>
	);
}

export default ClientList;
