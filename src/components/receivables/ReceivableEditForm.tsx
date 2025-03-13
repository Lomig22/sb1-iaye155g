import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Client, Receivable } from '../../types/database';
import { X, Upload } from 'lucide-react';

interface ReceivableEditFormProps {
	onClose: () => void;
	onReceivableUpdated: (receivable: Receivable & { client: Client }) => void;
	receivable: Receivable & { client: Client };
}

export default function ReceivableEditForm({
	onClose,
	onReceivableUpdated,
	receivable,
}: ReceivableEditFormProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		invoice_number: receivable.invoice_number,
		amount: receivable.amount.toString(),
		paid_amount: receivable.paid_amount
			? receivable.paid_amount.toString()
			: '',
		document_date: receivable.document_date || '',
		due_date: receivable.due_date,
		installment_number: receivable.installment_number || '',
		status: receivable.status,
		invoice_pdf_url: receivable.invoice_pdf_url || '',
		notes: receivable.notes || '',
	});

	// Gestion de la touche Echap
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => {
			window.removeEventListener('keydown', handleEscape);
		};
	}, [onClose]);

	// Désactiver le défilement du body quand la modale est ouverte
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, []);

	// Fonction pour vérifier si un client a d'autres créances impayées
	const checkClientUnpaidReceivables = async (
		clientId: string,
		currentReceivableId: string
	): Promise<boolean> => {
		try {
			const { data, error } = await supabase
				.from('receivables')
				.select('id')
				.eq('client_id', clientId)
				.neq('id', currentReceivableId) // Exclure la créance actuelle
				.not('status', 'eq', 'paid') // Toutes les créances non payées
				.limit(1);

			if (error) throw error;

			// Si data est vide, le client n'a pas d'autres créances impayées
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const wasAlreadyPaid = receivable.status === 'paid';
			const willBePaid = formData.status === 'paid';

			// Mettre à jour la créance
			const { data, error } = await supabase
				.from('receivables')
				.update({
					...formData,
					amount: parseFloat(formData.amount),
					paid_amount: formData.paid_amount
						? parseFloat(formData.paid_amount)
						: null,
					document_date: formData.document_date || null,
					installment_number: formData.installment_number || null,
					updated_at: new Date().toISOString(),
				})
				.eq('id', receivable.id)
				.select('*, client:clients(*)')
				.single();

			if (error) throw error;

			// Si le statut passe à "payé" et n'était pas déjà payé
			if (willBePaid && !wasAlreadyPaid) {
				// Vérifier si le client a d'autres créances impayées
				const noOtherUnpaidReceivables = await checkClientUnpaidReceivables(
					receivable.client.id,
					receivable.id
				);

				// Si le client n'a plus de créances impayées, désactiver les relances
				if (noOtherUnpaidReceivables) {
					await updateClientReminderStatus(receivable.client.id, false);

					// Mettre à jour l'objet data pour refléter le changement
					if (data && data.client) {
						data.client.needs_reminder = false;
					}
				}
			}

			if (data) {
				// Mise à jour du parent avec les nouvelles données
				onReceivableUpdated({
					...data,
					client: data.client as Client,
				});
				onClose();
			}
		} catch (error) {
			console.error('Erreur lors de la modification de la créance:', error);
			setError('Impossible de modifier la créance');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-scroll'>
			<div className='min-h-screen py-8 px-4 flex items-center justify-center'>
				<div className='relative bg-white rounded-lg shadow-xl p-8 w-full max-w-xl mx-auto'>
					<button
						onClick={onClose}
						className='absolute top-4 right-4 text-gray-400 hover:text-gray-600'
					>
						<X className='h-6 w-6' />
					</button>

					<h2 className='text-2xl font-bold mb-2'>Modifier la créance</h2>
					<p className='text-gray-600 mb-6'>
						Client : {receivable.client.company_name}
					</p>

					{error && (
						<div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700'>
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Numéro de facture *
							</label>
							<input
								type='text'
								required
								value={formData.invoice_number}
								onChange={(e) =>
									setFormData({ ...formData, invoice_number: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Montant devise (€) *
							</label>
							<input
								type='number'
								required
								step='0.01'
								min='0'
								value={formData.amount}
								onChange={(e) =>
									setFormData({ ...formData, amount: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Montant Réglé devise (€)
							</label>
							<input
								type='number'
								step='0.01'
								min='0'
								value={formData.paid_amount}
								onChange={(e) =>
									setFormData({ ...formData, paid_amount: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Date pièce
							</label>
							<input
								type='date'
								value={formData.document_date}
								onChange={(e) =>
									setFormData({ ...formData, document_date: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Date d'échéance *
							</label>
							<input
								type='date'
								required
								value={formData.due_date}
								onChange={(e) =>
									setFormData({ ...formData, due_date: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Numéro échéance
							</label>
							<input
								type='text'
								value={formData.installment_number}
								onChange={(e) =>
									setFormData({
										...formData,
										installment_number: e.target.value,
									})
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Statut *
							</label>
							<select
								required
								value={formData.status}
								onChange={(e) =>
									setFormData({ ...formData, status: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							>
								<option value='pending'>En attente</option>
								<option value='reminded'>Relancé</option>
								<option value='paid'>Payé</option>
								<option value='legal'>Contentieux</option>
							</select>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Commentaire
							</label>
							<input
								type='text'
								value={formData.notes}
								onChange={(e) =>
									setFormData({ ...formData, notes: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								PDF de la facture
							</label>
							<div className='mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md'>
								<div className='space-y-1 text-center'>
									<Upload className='mx-auto h-12 w-12 text-gray-400' />
									<div className='flex text-sm text-gray-600'>
										<label
											htmlFor='file-upload'
											className='relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500'
										>
											<span>Télécharger un fichier</span>
											<input
												id='file-upload'
												name='file-upload'
												type='file'
												className='sr-only'
												accept='.pdf'
												onChange={(e) => {
													// Logique de téléchargement du fichier à implémenter
													console.log('File selected:', e.target.files?.[0]);
												}}
											/>
										</label>
									</div>
									<p className='text-xs text-gray-500'>PDF jusqu'à 10MB</p>
								</div>
							</div>
						</div>

						<div className='flex justify-end space-x-4'>
							<button
								type='button'
								onClick={onClose}
								className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
							>
								Annuler
							</button>
							<button
								type='submit'
								disabled={loading}
								className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
							>
								{loading ? 'Enregistrement...' : 'Mettre à jour'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
