import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Client, ReminderProfile } from '../../types/database';
import { X, AlertCircle, Play, Pause } from 'lucide-react';

interface ReminderSettingsModalProps {
	client: Client;
	onClose: () => void;
	reminderProfiles: ReminderProfile[];
}

export default function ReminderSettingsModal({
	client,
	onClose,
	reminderProfiles,
}: ReminderSettingsModalProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [formData, setFormData] = useState({
		reminder_delay_1: client.reminder_delay_1 || 15,
		reminder_delay_2: client.reminder_delay_2 || 30,
		reminder_delay_3: client.reminder_delay_3 || 45,
		reminder_delay_final: client.reminder_delay_final || 60,
		reminder_template_1: client.reminder_template_1 || '',
		reminder_template_2: client.reminder_template_2 || '',
		reminder_template_3: client.reminder_template_3 || '',
		reminder_template_final: client.reminder_template_final || '',
		reminder_profile: client.reminder_profile || '',
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(false);

		try {
			// Validation des délais
			if (
				formData.reminder_delay_1 >= formData.reminder_delay_2 ||
				formData.reminder_delay_2 >= formData.reminder_delay_3 ||
				formData.reminder_delay_3 >= formData.reminder_delay_final
			) {
				throw new Error('Les délais doivent être strictement croissants');
			}

			const { error: updateError } = await supabase
				.from('clients')
				.update({
					reminder_delay_1: formData.reminder_delay_1,
					reminder_delay_2: formData.reminder_delay_2,
					reminder_delay_3: formData.reminder_delay_3,
					reminder_delay_final: formData.reminder_delay_final,
					reminder_template_1: formData.reminder_template_1.trim(),
					reminder_template_2: formData.reminder_template_2.trim(),
					reminder_template_3: formData.reminder_template_3.trim(),
					reminder_template_final: formData.reminder_template_final.trim(),
					reminder_profile: formData.reminder_profile,
				})
				.eq('id', client.id);

			if (updateError) throw updateError;

			setSuccess(true);
			// Attendre un peu avant de fermer pour montrer le message de succès
			setTimeout(() => {
				onClose();
			}, 1500);
		} catch (error) {
			console.error('Erreur lors de la mise à jour des paramètres:', error);
			setError(error.message || 'Impossible de mettre à jour les paramètres');
		} finally {
			setLoading(false);
		}
	};

	const handleProfileChange = (profileId: string) => {
		if (profileId === null || profileId === undefined) return;
		const selectedProfile = reminderProfiles.find(
			(profile) => profile.id === profileId
		);
		setFormData({
			...formData,
			reminder_profile: profileId,
			reminder_delay_1: selectedProfile?.delay1 || 15,
			reminder_delay_2: selectedProfile?.delay2 || 30,
			reminder_delay_3: selectedProfile?.delay3 || 45,
			reminder_delay_final: selectedProfile?.delay4 || 60,
		});
	};

	const getTemplateExample = (step: number) => {
		const examples = {
			1: `Cher client,\n\nNous n'avons pas encore reçu le paiement de la facture {invoice_number} d'un montant de {amount}, échue depuis {days_late} jours.\n\nMerci de régulariser la situation dans les plus brefs délais.`,
			2: `Cher client,\n\nMalgré notre première relance, la facture {invoice_number} d'un montant de {amount} reste impayée.\n\nNous vous prions de procéder au règlement sous 48h.`,
			3: `Cher client,\n\nLa facture {invoice_number} d'un montant de {amount} est toujours en attente de règlement malgré nos relances.\n\nSans paiement de votre part sous 72h, nous serons contraints d'engager une procédure de recouvrement.`,
			4: `Cher client,\n\nCeci est notre dernière relance concernant la facture {invoice_number} d'un montant de {amount}.\n\nSans règlement immédiat, nous transmettrons le dossier à notre service contentieux.`,
		};
		return examples[step] || '';
	};

	return (
		<div className='fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-scroll'>
			<div className='min-h-screen py-8 px-4 flex items-center justify-center'>
				<div className='relative bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl mx-auto'>
					<button
						onClick={onClose}
						className='absolute top-4 right-4 text-gray-400 hover:text-gray-600'
					>
						<X className='h-6 w-6' />
					</button>

					<h2 className='text-2xl font-bold mb-2'>Paramètres de relance</h2>
					<p className='text-gray-600 mb-6'>Client : {client.company_name}</p>

					{error && (
						<div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center'>
							<AlertCircle className='h-5 w-5 mr-2' />
							{error}
						</div>
					)}

					{success && (
						<div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700'>
							Paramètres sauvegardés avec succès
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-6'>
						<div className='grid grid-cols-2 gap-6'>
							<div className='col-span-2'>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Profil de rappel
								</label>
								<select
									required
									value={formData.reminder_profile}
									onChange={(e) => handleProfileChange(e.target.value)}
									className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									<option value=''>Sélectionner un profil de rappel</option>
									{reminderProfiles.map((profile) => (
										<option key={profile.id} value={profile.id}>
											{profile.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Délai première relance (jours)
								</label>
								<input
									type='number'
									min='1'
									value={formData.reminder_delay_1}
									onChange={(e) =>
										setFormData({
											...formData,
											reminder_delay_1: parseInt(e.target.value),
										})
									}
									className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Délai deuxième relance (jours)
								</label>
								<input
									type='number'
									min='1'
									value={formData.reminder_delay_2}
									onChange={(e) =>
										setFormData({
											...formData,
											reminder_delay_2: parseInt(e.target.value),
										})
									}
									className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Délai troisième relance (jours)
								</label>
								<input
									type='number'
									min='1'
									value={formData.reminder_delay_3}
									onChange={(e) =>
										setFormData({
											...formData,
											reminder_delay_3: parseInt(e.target.value),
										})
									}
									className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Délai relance finale (jours)
								</label>
								<input
									type='number'
									min='1'
									value={formData.reminder_delay_final}
									onChange={(e) =>
										setFormData({
											...formData,
											reminder_delay_final: parseInt(e.target.value),
										})
									}
									className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>
						</div>

						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Template première relance
								</label>
								<div className='relative'>
									<textarea
										rows={4}
										value={formData.reminder_template_1}
										onChange={(e) =>
											setFormData({
												...formData,
												reminder_template_1: e.target.value,
											})
										}
										className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										placeholder='Utilisez {company}, {amount}, {invoice_number}, {due_date}, {days_late} comme variables'
									/>
									<button
										type='button'
										onClick={() =>
											setFormData({
												...formData,
												reminder_template_1: getTemplateExample(1),
											})
										}
										className='absolute right-2 bottom-2 text-sm text-blue-600 hover:text-blue-800'
									>
										Utiliser un exemple
									</button>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Template deuxième relance
								</label>
								<div className='relative'>
									<textarea
										rows={4}
										value={formData.reminder_template_2}
										onChange={(e) =>
											setFormData({
												...formData,
												reminder_template_2: e.target.value,
											})
										}
										className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										placeholder='Utilisez {company}, {amount}, {invoice_number}, {due_date}, {days_late} comme variables'
									/>
									<button
										type='button'
										onClick={() =>
											setFormData({
												...formData,
												reminder_template_2: getTemplateExample(2),
											})
										}
										className='absolute right-2 bottom-2 text-sm text-blue-600 hover:text-blue-800'
									>
										Utiliser un exemple
									</button>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Template troisième relance
								</label>
								<div className='relative'>
									<textarea
										rows={4}
										value={formData.reminder_template_3}
										onChange={(e) =>
											setFormData({
												...formData,
												reminder_template_3: e.target.value,
											})
										}
										className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										placeholder='Utilisez {company}, {amount}, {invoice_number}, {due_date}, {days_late} comme variables'
									/>
									<button
										type='button'
										onClick={() =>
											setFormData({
												...formData,
												reminder_template_3: getTemplateExample(3),
											})
										}
										className='absolute right-2 bottom-2 text-sm text-blue-600 hover:text-blue-800'
									>
										Utiliser un exemple
									</button>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Template relance finale
								</label>
								<div className='relative'>
									<textarea
										rows={4}
										value={formData.reminder_template_final}
										onChange={(e) =>
											setFormData({
												...formData,
												reminder_template_final: e.target.value,
											})
										}
										className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										placeholder='Utilisez {company}, {amount}, {invoice_number}, {due_date}, {days_late} comme variables'
									/>
									<button
										type='button'
										onClick={() =>
											setFormData({
												...formData,
												reminder_template_final: getTemplateExample(4),
											})
										}
										className='absolute right-2 bottom-2 text-sm text-blue-600 hover:text-blue-800'
									>
										Utiliser un exemple
									</button>
								</div>
							</div>
						</div>

						<div className='flex justify-between space-x-4'>
							{/* <button
								type='button'
								// onClick={onClose}
								disabled={loading}
								className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
							> */}
							<div title='Stop sending automatic reminders'>
								{/* <Play
									className='cursor-pointer hover:fill-blue-400 stroke-blue-400'
									strokeWidth={2}
								/> */}
								<Pause
									className='cursor-pointer hover:fill-blue-400 stroke-blue-400'
									strokeWidth={2}
								/>
							</div>
							{/* </button> */}
							<div className='flex space-x-4'>
								<button
									type='button'
									onClick={onClose}
									disabled={loading}
									className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
								>
									Annuler
								</button>
								<button
									type='submit'
									disabled={loading}
									className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
								>
									{loading ? 'Enregistrement...' : 'Enregistrer'}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
