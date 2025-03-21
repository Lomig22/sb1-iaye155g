import { Edit, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UnknownClient } from '../../types/database';
import { supabase } from '../../lib/supabase';
import UnknownClientForm from './UnknownClientForm';
import CSVImport, { CSVMapping } from './CSVImport';
import { dateCompare, numberCompare, stringCompare } from '../../lib/comparers';
import SortableColHead from '../Common/SortableColHead';

type UnknownClientListProps = {
	setError: (error: string | null) => void;
	setImportSuccess: (message: string | null) => void;
	showImportModal: boolean;
	setShowImportModal: (show: boolean) => void;
	showForm: boolean;
	setShowForm: (show: boolean) => void;
};

type SortColumnConfig = {
	key: keyof CSVMapping;
	sort: 'none' | 'asc' | 'desc';
};

const UnknownClientList = ({
	setError,
	setImportSuccess,
	showImportModal,
	setShowImportModal,
	showForm,
	setShowForm,
}: UnknownClientListProps) => {
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [clients, setClients] = useState<UnknownClient[]>([]);
	const [selectedClient, setSelectedClient] = useState<UnknownClient | null>(
		null
	);
	const [userId, setUserId] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [sortConfig, setSortConfig] = useState<SortColumnConfig | null>({
		key: 'name',
		sort: 'asc',
	});

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

	const applySorting = (a: UnknownClient, b: UnknownClient) => {
		if (!sortConfig) return 0;
		const { key, sort } = sortConfig;

		if (key === 'name') {
			return stringCompare(a.name, b.name, sort);
		}
		if (key === 'invoice_no') {
			return stringCompare(a.invoice_no, b.invoice_no, sort);
		}
		if (key === 'client_code') {
			return stringCompare(a.client_code, b.client_code, sort);
		}
		if (key === 'amount') {
			return numberCompare(
				parseFloat(a.amount ?? '0'),
				parseFloat(b.amount ?? '0'),
				sort
			);
		}
		if (key === 'paid_amount') {
			return numberCompare(
				parseFloat(a.paid_amount ?? '0'),
				parseFloat(b.paid_amount ?? '0'),
				sort
			);
		}
		if (key === 'status') {
			return stringCompare(a.status ?? '', b.status ?? '', sort);
		}
		if (key === 'date') {
			return dateCompare(a.date ?? '', b.date ?? '', sort);
		}
		if (key === 'document_date') {
			return dateCompare(a.document_date ?? '', b.document_date ?? '', sort);
		}
		if (key === 'due_date') {
			return dateCompare(a.due_date ?? '', b.due_date ?? '', sort);
		}

		return 0;
	};

	const filteredClients = clients
		.filter((client) => {
			const searchLower = searchTerm.toLowerCase();
			return (
				client.name.toLowerCase().includes(searchLower) ||
				client.invoice_no.toLowerCase().includes(searchLower) ||
				client.client_code.toString().includes(searchLower) ||
				client.amount?.toString().includes(searchLower)
			);
		})
		.sort(applySorting);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-96'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}
	return (
		<>
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
									<SortableColHead
										colKey='name'
										label='Nom'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='invoice_no'
										label='Numéro de facture'
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
										label='code client'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='amount'
										label='Montant'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='paid_amount'
										label='Montant payé'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='document_date'
										label='Date pièce'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='due_date'
										label="Date d'échéance"
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='status'
										label='status'
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
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='date'
										label='Date'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
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
										{client.name}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.invoice_no}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.client_code}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.amount}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.paid_amount}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.document_date}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.due_date}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.status}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.comment}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{client.date}
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
		</>
	);
};

export default UnknownClientList;
