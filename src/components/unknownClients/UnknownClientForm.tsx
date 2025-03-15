import { X } from 'lucide-react';
import { useState } from 'react';
import { UnknownClient } from '../../types/database';
import { supabase } from '../../lib/supabase';

type UnknownClientFormProps = {
	onClose: () => void;
	onClientAdded?: (client: UnknownClient) => void;
	onClientUpdated?: (client: UnknownClient) => void;
	client?: UnknownClient;
	mode?: 'create' | 'edit';
	ownerId: string;
};

const UnknownClientForm = ({
	onClose,
	onClientAdded,
	onClientUpdated,
	client,
	mode = 'create',
	ownerId,
}: UnknownClientFormProps) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState<UnknownClient>({
		owner_id: client?.owner_id ?? ownerId,
		name: client?.name ?? '',
		invoice_no: client?.invoice_no ?? '',
		client_code: client?.client_code ?? '',
	});

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		try {
			e.preventDefault();
			setError(null);
			setLoading(true);
			if (mode === 'create') {
				const { data: createdClient, error } = await supabase
					.from('unknown_client')
					.insert(formData)
					.select();

				if (error) {
					throw error;
				}
				if (createdClient) {
					onClientAdded?.(createdClient[0]);
				}
			} else if (mode === 'edit') {
				const { data: updatedClient, error } = await supabase
					.from('unknown_client')
					.update(formData)
					.eq('id', client?.id)
					.select();

				if (error) {
					throw error;
				}
				if (updatedClient) {
					onClientUpdated?.(updatedClient[0]);
				}
			}
		} catch (error) {
			console.error('Erreur lors de la soumission du formulaire:', error);
			setError(
				'Une erreur est survenue lors de la soumission du formulaire. Veuillez réessayer.'
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
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Code Client *
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
								Numéro de facture
							</label>
							<input
								type='text'
								value={formData.invoice_no}
								onChange={(e) =>
									setFormData({ ...formData, invoice_no: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
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
};

export default UnknownClientForm;
