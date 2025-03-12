import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Client } from '../../types/database';
import { X } from 'lucide-react';

interface ClientFormProps {
	onClose: () => void;
	onClientAdded?: (client: Client) => void;
	onClientUpdated?: (client: Client) => void;
	client?: Client;
	mode?: 'create' | 'edit';
}

export default function ClientForm({
	onClose,
	onClientAdded,
	onClientUpdated,
	client,
	mode = 'create',
}: ClientFormProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		company_name: client?.company_name || '',
		email: client?.email || '',
		phone: client?.phone || '',
		address: client?.address || '',
		postal_code: client?.postal_code || '',
		city: client?.city || '',
		country: client?.country || 'France',
		industry: client?.industry || '',
		website: client?.website || '',
		needs_reminder: client?.needs_reminder || false,
		client_code: client?.client_code || '',
	});

	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				throw new Error('Utilisateur non authentifié');
			}

			if (mode === 'create') {
				const { data, error } = await supabase
					.from('clients')
					.insert([
						{
							...formData,
							owner_id: user.id,
						},
					])
					.select()
					.single();

				if (error) throw error;
				if (data && onClientAdded) {
					onClientAdded(data);
				}
			} else {
				const { data, error } = await supabase
					.from('clients')
					.update(formData)
					.eq('id', client?.id)
					.select()
					.single();

				if (error) throw error;
				if (data && onClientUpdated) {
					onClientUpdated(data);
				}
			}
			onClose();
		} catch (error) {
			console.error("Erreur lors de l'opération sur le client:", error);
			setError(
				`Une erreur est survenue lors de ${
					mode === 'create' ? "l'ajout" : 'la modification'
				} du client`
			);
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

					<h2 className='text-2xl font-bold mb-6'>
						{mode === 'create' ? 'Nouveau client' : 'Modifier le client'}
					</h2>

					{error && (
						<div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700'>
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Nom de l'entreprise *
							</label>
							<input
								type='text'
								required
								value={formData.company_name}
								onChange={(e) =>
									setFormData({ ...formData, company_name: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Client Code *
							</label>
							<input
								type='text'
								required
								value={formData.client_code}
								onChange={(e) =>
									setFormData({ ...formData, client_code: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Email *
							</label>
							<input
								type='email'
								required
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Téléphone
							</label>
							<input
								type='tel'
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Adresse
							</label>
							<textarea
								value={formData.address}
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
								rows={3}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Code postal
								</label>
								<input
									type='text'
									value={formData.postal_code}
									onChange={(e) =>
										setFormData({ ...formData, postal_code: e.target.value })
									}
									className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Ville
								</label>
								<input
									type='text'
									value={formData.city}
									onChange={(e) =>
										setFormData({ ...formData, city: e.target.value })
									}
									className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Pays
							</label>
							<input
								type='text'
								value={formData.country}
								onChange={(e) =>
									setFormData({ ...formData, country: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Secteur d'activité
							</label>
							<input
								type='text'
								value={formData.industry}
								onChange={(e) =>
									setFormData({ ...formData, industry: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Site internet
							</label>
							<input
								type='url'
								value={formData.website}
								onChange={(e) =>
									setFormData({ ...formData, website: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								placeholder='https://...'
							/>
						</div>

						<div className='flex items-center'>
							<input
								type='checkbox'
								id='needs_reminder'
								checked={formData.needs_reminder}
								onChange={(e) =>
									setFormData({ ...formData, needs_reminder: e.target.checked })
								}
								className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
							/>
							<label
								htmlFor='needs_reminder'
								className='ml-2 block text-sm text-gray-700'
							>
								Nécessite une relance
							</label>
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
								{loading
									? 'Enregistrement...'
									: mode === 'create'
									? 'Enregistrer'
									: 'Mettre à jour'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
