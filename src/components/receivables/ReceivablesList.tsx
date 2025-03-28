import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
	Receivable,
	Client,
	ReminderProfile,
	Reminder,
} from '../../types/database';
import {
	Plus,
	Mail,
	AlertCircle,
	Clock,
	Edit,
	Search,
	Trash2,
	Upload,
	X,
	Check as CheckIcon,
	Info,
	ListRestart,
	File,
	Pause,
} from 'lucide-react';
import ReceivableForm from './ReceivableForm';
import ReceivableEditForm from './ReceivableEditForm';
import ReminderSettingsModal from './ReminderSettingsModal';
import { sendManualReminder } from '../../lib/reminderService';
import CSVImportModal, { CSVMapping } from './CSVImportModal';
import ReminderHistory from './ReminderHistory';
import { Link } from 'react-router-dom';
import { dateCompare, numberCompare, stringCompare } from '../../lib/comparers';
import SortableColHead from '../Common/SortableColHead';
import { dateDiff } from '../../lib/dateDiff';

type SortColumnConfig = {
	key: keyof CSVMapping | 'client' | 'email' | 'delay in days';
	sort: 'none' | 'asc' | 'desc';
};

function ReceivablesList() {
	const [receivables, setReceivables] = useState<
		(Receivable & { client: Client })[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [selectedReceivable, setSelectedReceivable] = useState<
		(Receivable & { client: Client }) | null
	>(null);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedClient, setSelectedClient] = useState<Client | null>(null);
	const [showSettings, setShowSettings] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [importSuccess, setImportSuccess] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [receivableToDelete, setReceivableToDelete] = useState<
		(Receivable & { client: Client }) | null
	>(null);
	const [deleting, setDeleting] = useState(false);
	const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
	const [showReminderHistory, setShowReminderHistory] = useState(false);
	const [reminderHistroy, setReminderHistory] = useState<Reminder[]>([]);
	const [showEditForm, setShowEditForm] = useState(false);
	const [reminderProfiles, setReminderProfiles] = useState<ReminderProfile[]>(
		[]
	);
	const [sortConfig, setSortConfig] = useState<SortColumnConfig | null>({
		key: 'client',
		sort: 'asc',
	});
	const [showConfirmSendReminder, setShowConfirmReminder] = useState(false);
	const [sending, setSending] = useState(false);

	const fetchReceivables = async () => {
		try {
			const { data, error } = await supabase
				.from('receivables')
				.select(`*,client:clients(*)`)
				.order('due_date', { ascending: false });

			// Fetch profiles
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Utilisateur non authentifié');

			const { data: reminderPorfile } = await supabase
				.from('reminder_profile')
				.select()
				.eq('owner_id', user.id);
			setReminderProfiles(reminderPorfile || []);

			if (error) throw error;
			setReceivables(data || []);

			const { data: reminderHistroyData, error: reminderHistroyError } =
				await supabase
					.from('reminders')
					.select('*')
					.order('reminder_date', { ascending: false });

			if (reminderHistroyError) throw reminderHistroyError;
			setReminderHistory(reminderHistroyData || []);
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

	useEffect(() => {
		if (importSuccess) {
			const timer = setTimeout(() => {
				setImportSuccess(null);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [importSuccess]);

	// Fonction pour vérifier si un client a des créances impayées
	const checkClientUnpaidReceivables = async (
		clientId: string
	): Promise<boolean> => {
		try {
			const { data, error } = await supabase
				.from('receivables')
				.select('id')
				.eq('client_id', clientId)
				.not('status', 'eq', 'paid') // Toutes les créances non payées
				.limit(1);

			if (error) throw error;

			// Si data est vide, le client n'a pas de créances impayées
			return data && data.length === 0;
		} catch (error) {
			console.error('Erreur lors de la vérification des créances:', error);
			return false;
		}
	};

	// Fonction pour mettre à jour le statut de relance du client
	const updateClientReminderStatus = async (
		clientId: string,
		needsReminder: boolean
	): Promise<void> => {
		try {
			const { error } = await supabase
				.from('clients')
				.update({ needs_reminder: needsReminder })
				.eq('id', clientId);

			if (error) throw error;
		} catch (error) {
			console.error(
				'Erreur lors de la mise à jour du statut de relance:',
				error
			);
		}
	};

	const handleDeleteClick = (receivable: Receivable & { client: Client }) => {
		setReceivableToDelete(receivable);
		setShowDeleteConfirm(true);
	};

	const handleDeleteConfirm = async () => {
		if (!receivableToDelete) return;

		try {
			setDeleting(true);
			setError(null);

			const clientId = receivableToDelete.client_id;

			const { error } = await supabase
				.from('receivables')
				.delete()
				.eq('id', receivableToDelete.id);

			if (error) throw error;

			// Mettre à jour la liste des créances
			setReceivables(receivables.filter((r) => r.id !== receivableToDelete.id));
			setShowDeleteConfirm(false);
			setReceivableToDelete(null);

			// Vérifier si le client a encore des créances impayées
			const noUnpaidReceivables = await checkClientUnpaidReceivables(clientId);

			// Si le client n'a plus de créances impayées, désactiver les relances
			if (noUnpaidReceivables) {
				await updateClientReminderStatus(clientId, false);

				// Mettre à jour l'état local pour refléter le changement
				setReceivables((prevReceivables) =>
					prevReceivables.map((r) => {
						if (r.client_id === clientId) {
							return {
								...r,
								client: {
									...r.client,
									needs_reminder: false,
								},
							};
						}
						return r;
					})
				);
			}
		} catch (error) {
			console.error('Erreur lors de la suppression:', error);
			setError('Impossible de supprimer la créance');
		} finally {
			setDeleting(false);
		}
	};

	const handleSendReminder = async () =>
		// receivable: Receivable & { client: Client }
		{
			try {
				setError(null);
				if (selectedReceivable == null) return;
				setSending(true);
				const success = await sendManualReminder(selectedReceivable.id);

				if (success) {
					await fetchReceivables();
				} else {
					setError(
						"Impossible d'envoyer la relance. Vérifiez les paramètres email et les templates."
					);
				}
				setSending(false);
				setShowConfirmReminder(false);
				setSelectedClient(null);
			} catch (error: any) {
				console.error('Error sending reminder:', error);
				setError(error.message || "Erreur lors de l'envoi de la relance");
				setSending(false);
				setShowConfirmReminder(false);
				setSelectedClient(null);
			}
		};

	const handleImportSuccess = (importedCount: number) => {
		setImportSuccess(`${importedCount} créance(s) importée(s) avec succès`);
		fetchReceivables();
		setShowImportModal(false);
	};

	const handleMouseEnter = (receivableId: string) => {
		setTooltipVisible(receivableId);
	};

	const handleMouseLeave = () => {
		setTooltipVisible(null);
	};

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('fr-FR');
	};

	const handleOnClose = () => {
		setSelectedReceivable(null);
		setShowReminderHistory(false);
	};

	const handleSortOnClick = (key: keyof CSVMapping | 'Delay in Days') => {
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
		a: Receivable & { client: Client },
		b: Receivable & { client: Client }
	) => {
		if (!sortConfig) return 0;
		const { key, sort } = sortConfig;
		if (key === 'client') {
			return stringCompare(a.client.company_name, b.client.company_name, sort);
		}
		if (key === 'client_code') {
			return stringCompare(a.client.client_code, b.client.client_code, sort);
		}
		if (key === 'email') {
			return stringCompare(a.email ?? '', b.email ?? '', sort);
		}
		if (key === 'invoice_number') {
			return stringCompare(a.invoice_number, b.invoice_number, sort);
		}
		if (key === 'amount') {
			return numberCompare(a.amount, b.amount, sort);
		}
		if (key === 'paid_amount') {
			return numberCompare(a.paid_amount ?? 0, b.paid_amount ?? 0, sort);
		}
		if (key === 'status') {
			return stringCompare(a.status ?? '', b.status ?? '', sort);
		}
		if (key === 'document_date') {
			return dateCompare(a.document_date ?? '', b.document_date ?? '', sort);
		}
		if (key === 'due_date') {
			return dateCompare(a.due_date ?? '', b.due_date ?? '', sort);
		}
		if (key === 'installment_number') {
			return stringCompare(
				a.installment_number ?? '',
				b.installment_number ?? '',
				sort
			);
		}
		if (key === 'Delay in Days') {
			return numberCompare(
				dateDiff(new Date(a.due_date), new Date()),
				dateDiff(new Date(b.due_date), new Date()),
				sort
			);
		}

		return 0;
	};

	const filteredReceivables = receivables
		.filter((receivable) => {
			const searchLower = searchTerm.toLowerCase();
			return (
				receivable.client.company_name.toLowerCase().includes(searchLower) ||
				receivable.invoice_number.toLowerCase().includes(searchLower) ||
				receivable.amount.toString().includes(searchLower)
			);
		})
		.sort(applySorting);

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
				<div className='flex gap-4 items-center'>
					<h1 className='text-2xl font-bold text-gray-900'>Créances</h1>
					<Link to='/reminders' className='flex items-center h-16 px-4'>
						<button className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2'>
							<Clock className='h-5 w-5' />
							{/* <Upload className='h-5 w-5' /> */}
							Historique des relances
						</button>
					</Link>
				</div>
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
						Nouvelle créance
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
					<CheckIcon className='h-5 w-5 mr-2' />
					{importSuccess}
				</div>
			)}

			<div className='relative mb-6'>
				<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
				<input
					type='text'
					placeholder='Rechercher...'
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
										colKey='client'
										label='Client'
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
									<SortableColHead
										colKey='invoice_number'
										label='Facture'
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
										label='Montant devise'
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
										label='Montant Réglé devise'
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
										label='Échéance'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='Delay in Days'
										label='Délai en jours'
										onClick={(col: string) =>
											handleSortOnClick(col as keyof CSVMapping)
										}
										selectedColKey={sortConfig?.key ?? ''}
										sort={sortConfig?.sort ?? 'none'}
									/>
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									<SortableColHead
										colKey='installment_number'
										label='Numéro échéance'
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
										label='Statut'
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
									Invoice
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{filteredReceivables.map((receivable) => (
								<tr key={receivable.id} className='hover:bg-gray-50'>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='flex space-x-3'>
											<button
												onClick={() => {
													setShowEditForm(true);
													setSelectedReceivable(receivable);
												}}
												className='text-blue-600 hover:text-blue-800'
												title='Modifier'
											>
												<Edit className='h-5 w-5' />
											</button>
											{receivable.status !== 'paid' && (
												<>
													<button
														onClick={() => {
															setSelectedReceivable(receivable);
															setShowConfirmReminder(true);
														}}
														className='text-yellow-600 hover:text-yellow-800'
														title='Envoyer une relance'
													>
														<Mail className='h-5 w-5' />
													</button>
													{!receivable.client.reminder_template_1 &&
														receivable.client.needs_reminder && (
															<div className='relative'>
																<div
																	className='text-yellow-500 cursor-help'
																	onMouseEnter={() =>
																		handleMouseEnter(receivable.id)
																	}
																	onMouseLeave={handleMouseLeave}
																>
																	<Info className='h-5 w-5' />
																</div>
																{tooltipVisible === receivable.id && (
																	<div className='absolute z-10 w-64 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm -left-32 bottom-full mb-1'>
																		Paramètres de relance non configurés.
																		Cliquez sur l'icône d'horloge pour
																		configurer les modèles de relance.
																	</div>
																)}
															</div>
														)}
												</>
											)}
											<button
												onClick={() => {
													setSelectedClient(receivable.client);
													setSelectedReceivable(receivable);
													setShowSettings(true);
												}}
												className='text-gray-600 hover:text-gray-800'
												title='Paramètres de relance'
											>
												<Clock className='h-5 w-5' />
											</button>
											<button
												onClick={() => {
													setSelectedReceivable(receivable);
													setShowReminderHistory(true);
												}}
											>
												<ListRestart className='h-5 w-5' />
											</button>
											<button
												onClick={() => handleDeleteClick(receivable)}
												className='text-red-600 hover:text-red-800'
												title='Supprimer'
											>
												<Trash2 className='h-5 w-5' />
											</button>
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{receivable.client.company_name}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{receivable.client.client_code}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{receivable.email}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{receivable.invoice_number}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{new Intl.NumberFormat('fr-FR', {
											style: 'currency',
											currency: 'EUR',
										}).format(receivable.amount)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{receivable.paid_amount
											? new Intl.NumberFormat('fr-FR', {
													style: 'currency',
													currency: 'EUR',
											  }).format(receivable.paid_amount)
											: '-'}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{formatDate(receivable.document_date)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{new Date(receivable.due_date).toLocaleDateString('fr-FR')}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{dateDiff(new Date(receivable.due_date), new Date())}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{receivable.installment_number || '-'}
									</td>
									<td className='px-6 py-4 whitespace-nowrap flex gap-1 items-center'>
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
												receivable.status === 'paid'
													? 'bg-green-100 text-green-800'
													: receivable.status === 'late'
													? 'bg-red-100 text-red-800'
													: receivable.status === 'reminded' ||
													  receivable.status === 'Relance 1' ||
													  receivable.status === 'Relance 2' ||
													  receivable.status === 'Relance 3' ||
													  receivable.status === 'Relance finale' ||
													  receivable.status === 'Relance préventive'
													? 'bg-yellow-100 text-yellow-800'
													: receivable.status === 'legal'
													? 'bg-purple-100 text-purple-800'
													: 'bg-gray-100 text-gray-800'
											}`}
										>
											{receivable.status === 'paid' && 'Payé'}
											{receivable.status === 'late' && 'En retard'}
											{receivable.status === 'reminded' && 'Relancé'}
											{receivable.status === 'pending' && 'En attente'}
											{receivable.status === 'legal' && 'Contentieux'}
											{receivable.status === 'Relance 1' && 'Relance 1'}
											{receivable.status === 'Relance 2' && 'Relance 2'}
											{receivable.status === 'Relance 3' && 'Relance 3'}
											{receivable.status === 'Relance finale' &&
												'Relance finale'}
											{receivable.status === 'Relance préventive' &&
												'Relance préventive'}
										</span>
										{!receivable.automatic_reminder && (
											<span
												title='Automati Reminders disabled'
												className='text-yellow-500 cursor-help'
											>
												<Pause className='h-4 w-4' />
											</span>
										)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{receivable.notes || '-'}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{receivable.invoice_pdf_url ? (
											<a
												href={receivable.invoice_pdf_url}
												target='_blank'
												rel='noopenner noreferrer'
												className='grid'
											>
												<button
													className='text-gray-600 hover:text-gray-800'
													title='View Invoice'
												>
													<File className='h-5 w-5' />
												</button>
											</a>
										) : (
											'-'
										)}
									</td>
								</tr>
							))}
							{filteredReceivables.length === 0 && (
								<tr>
									<td
										colSpan={9}
										className='px-6 py-4 text-center text-gray-500'
									>
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

			{selectedReceivable && showEditForm && (
				<ReceivableEditForm
					receivable={selectedReceivable}
					onClose={() => {
						setShowEditForm(false);
						setSelectedReceivable(null);
					}}
					onReceivableUpdated={(updatedReceivable) => {
						setReceivables(
							receivables.map((r) =>
								r.id === updatedReceivable.id ? updatedReceivable : r
							)
						);
						setSelectedReceivable(null);
					}}
				/>
			)}

			{showSettings && selectedClient && selectedReceivable && (
				<ReminderSettingsModal
					client={selectedClient}
					onClose={() => {
						setShowSettings(false);
						setSelectedClient(null);
						setSelectedReceivable(null);
						// Rafraîchir les données pour mettre à jour l'affichage des icônes d'avertissement
						fetchReceivables();
					}}
					reminderProfiles={reminderProfiles}
					receivable={selectedReceivable}
				/>
			)}

			{showImportModal && (
				<CSVImportModal
					onClose={() => setShowImportModal(false)}
					onImportSuccess={handleImportSuccess}
					receivables={receivables}
				/>
			)}
			{showConfirmSendReminder && selectedReceivable && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-lg font-medium text-gray-900'>
								Confirmation d'envoi
							</h3>
							<button
								onClick={() => {
									setShowConfirmReminder(false);
									setSelectedReceivable(null);
								}}
								className='text-gray-400 hover:text-gray-500'
							>
								<X className='h-5 w-5' />
							</button>
						</div>

						<p className='text-sm text-gray-500 mb-4'>
							Êtes-vous sûr de vouloir envoyer la relance manuelle ?
						</p>

						<div className='flex justify-end space-x-4'>
							<button
								onClick={() => {
									setShowConfirmReminder(false);
									setSelectedReceivable(null);
								}}
								className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md'
								disabled={sending}
							>
								Annuler
							</button>
							<button
								onClick={handleSendReminder}
								disabled={sending}
								className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50'
							>
								{sending ? 'Envoi...' : 'Envoyer la relance"'}
							</button>
						</div>
					</div>
				</div>
			)}

			{showDeleteConfirm && receivableToDelete && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-lg font-medium text-gray-900'>
								Confirmer la suppression
							</h3>
							<button
								onClick={() => {
									setShowDeleteConfirm(false);
									setReceivableToDelete(null);
								}}
								className='text-gray-400 hover:text-gray-500'
							>
								<X className='h-5 w-5' />
							</button>
						</div>

						<p className='text-sm text-gray-500 mb-4'>
							Êtes-vous sûr de vouloir supprimer la créance "
							{receivableToDelete.invoice_number}" pour le client "
							{receivableToDelete.client.company_name}" ? Cette action est
							irréversible.
						</p>

						<div className='flex justify-end space-x-4'>
							<button
								onClick={() => {
									setShowDeleteConfirm(false);
									setReceivableToDelete(null);
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
			{showReminderHistory && selectedReceivable && (
				<ReminderHistory
					receivableId={selectedReceivable?.id}
					reminders={reminderHistroy}
					onClose={handleOnClose}
				/>
			)}
		</div>
	);
}

export default ReceivablesList;
