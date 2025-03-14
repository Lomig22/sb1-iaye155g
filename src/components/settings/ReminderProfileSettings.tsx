import React, { useEffect, useState } from 'react';
import { ReminderProfile } from '../../types/database';
import { AlertCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ReminderProfileSettings = () => {
	const [userId, setUserId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<boolean>(false);
	const [saving, setSaving] = useState(false);
	const [formData, setFormData] = useState({
		profile1: {
			id: undefined,
			delay1: 0,
			delay2: 0,
			delay3: 0,
			delay4: 0,
		},
		profile2: {
			id: undefined,
			delay1: 0,
			delay2: 0,
			delay3: 0,
			delay4: 0,
		},
		profile3: {
			id: undefined,
			delay1: 0,
			delay2: 0,
			delay3: 0,
			delay4: 0,
		},
	});
	// const [reminderProfiles, setReminderProfiles] = useState<ReminderProfile[]>()

	const fetchAndSetProfiles = async () => {
		setSaving(true);
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) throw new Error('Utilisateur non authentifié');

		const { data, error } = await supabase
			.from('reminder_profile')
			.select('*')
			.eq('owner_id', user.id);

		if (error) {
			setError(error.message);
		}

		setUserId(user.id);
		if (data === null) return;

		const firstProfile = data.find(
			(profile: ReminderProfile) => profile.name === 'Default'
		);
		const secondProfile = data.find(
			(profile: ReminderProfile) => profile.name === 'Oubli du client'
		);
		const thirdProfile = data.find(
			(profile: ReminderProfile) =>
				profile.name === 'Retard systématique des clients'
		);
		console.log(firstProfile);
		setFormData({
			profile1: {
				id: firstProfile?.id,
				delay1: firstProfile?.delay1 ?? 0,
				delay2: firstProfile?.delay2 ?? 0,
				delay3: firstProfile?.delay3 ?? 0,
				delay4: firstProfile?.delay4 ?? 0,
			},
			profile2: {
				id: secondProfile?.id,
				delay1: secondProfile?.delay1 ?? 0,
				delay2: secondProfile?.delay2 ?? 0,
				delay3: secondProfile?.delay3 ?? 0,
				delay4: secondProfile?.delay4 ?? 0,
			},
			profile3: {
				id: thirdProfile?.id,
				delay1: thirdProfile?.delay1 ?? 0,
				delay2: thirdProfile?.delay2 ?? 0,
				delay3: thirdProfile?.delay3 ?? 0,
				delay4: thirdProfile?.delay4 ?? 0,
			},
		});
		setSaving(false);
	};

	useEffect(() => {
		fetchAndSetProfiles();
	}, []);

	const handleInputOnBlur = (
		profile: 'profile1' | 'profile2' | 'profile3',
		delay: string,
		value: number
	) => {
		setFormData({
			...formData,
			[profile]: {
				...formData[profile],
				[delay]: value,
			},
		});
	};
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		if (userId === null) return;
		if (formData.profile1.id === undefined) {
			// Then this is a new profile
			const prepareData: ReminderProfile[] = [
				{
					name: 'Default',
					delay1: formData.profile1.delay1,
					delay2: formData.profile1.delay2,
					delay3: formData.profile1.delay3,
					delay4: formData.profile1.delay4,
					owner_id: userId,
					public: false,
				},
				{
					name: 'Oubli du client',
					delay1: formData.profile2.delay1,
					delay2: formData.profile2.delay2,
					delay3: formData.profile2.delay3,
					delay4: formData.profile2.delay4,
					owner_id: userId,
					public: false,
				},
				{
					name: 'Retard systématique des clients',
					delay1: formData.profile3.delay1,
					delay2: formData.profile3.delay2,
					delay3: formData.profile3.delay3,
					delay4: formData.profile3.delay4,
					owner_id: userId,
					public: false,
				},
			];
			const { error } = await supabase
				.from('reminder_profile')
				.insert(prepareData);
			if (error) {
				setError(error.message);
			}
		} else {
			const prepareData: ReminderProfile[] = [
				{
					id: formData.profile1.id,
					name: 'Default',
					delay1: formData.profile1.delay1,
					delay2: formData.profile1.delay2,
					delay3: formData.profile1.delay3,
					delay4: formData.profile1.delay4,
					owner_id: userId,
					public: false,
				},
				{
					id: formData.profile2.id,
					name: 'Oubli du client',
					delay1: formData.profile2.delay1,
					delay2: formData.profile2.delay2,
					delay3: formData.profile2.delay3,
					delay4: formData.profile2.delay4,
					owner_id: userId,
					public: false,
				},
				{
					id: formData.profile3.id,
					name: 'Retard systématique des clients',
					delay1: formData.profile3.delay1,
					delay2: formData.profile3.delay2,
					delay3: formData.profile3.delay3,
					delay4: formData.profile3.delay4,
					owner_id: userId,
					public: false,
				},
			];
			const { error: error1 } = await supabase
				.from('reminder_profile')
				.update(prepareData[0])
				.eq('id', prepareData[0].id);

			const { error: error2 } = await supabase
				.from('reminder_profile')
				.update(prepareData[1])
				.eq('id', prepareData[1].id);

			const { error: error3 } = await supabase
				.from('reminder_profile')
				.update(prepareData[2])
				.eq('id', prepareData[2].id);
			if (error1) {
				setError(error1?.message);
				return;
			}
			if (error2) {
				setError(error2?.message);
				return;
			}
			if (error3) {
				setError(error3?.message);
				return;
			}
			setSuccess(true);
		}
		setSaving(false);
	};
	return (
		<div className=''>
			<h2 className='text-xl font-bold mb-6'>Profil utilisateur</h2>

			{error && (
				<div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center'>
					<AlertCircle className='h-5 w-5 mr-2' />
					{error}
				</div>
			)}
			{success && (
				<div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700'>
					profil de rappel mis à jour avec succès
				</div>
			)}

			<form onSubmit={handleSubmit} className='space-y-6'>
				<div className='grid grid-cols-5 gap-2 items-center '>
					<label className='text-sm'>Profil de rappel</label>
					<label className='text-sm'>Délai première relance (jours)</label>
					<label className='text-sm'>Délai deuxième relance (jours)</label>
					<label className='text-sm'>Délai troisième relance (jours)</label>
					<label className='text-sm'>Délai relance finale (jours)</label>
					<label>Default</label>
					<input
						type='number'
						disabled={saving}
						value={formData.profile1.delay1}
						onChange={(e) =>
							handleInputOnBlur('profile1', 'delay1', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<input
						type='number'
						disabled={saving}
						value={formData.profile1.delay2}
						onChange={(e) =>
							handleInputOnBlur('profile1', 'delay2', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<input
						type='number'
						disabled={saving}
						value={formData.profile1.delay3}
						onChange={(e) =>
							handleInputOnBlur('profile1', 'delay3', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<input
						type='number'
						disabled={saving}
						value={formData.profile1.delay4}
						onChange={(e) =>
							handleInputOnBlur('profile1', 'delay4', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<label>Oubli du client</label>
					<input
						type='number'
						disabled={saving}
						value={formData.profile2.delay1}
						onChange={(e) =>
							handleInputOnBlur('profile2', 'delay1', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<input
						type='number'
						disabled={saving}
						value={formData.profile2.delay2}
						onChange={(e) =>
							handleInputOnBlur('profile2', 'delay2', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<input
						type='number'
						disabled={saving}
						value={formData.profile2.delay3}
						onChange={(e) =>
							handleInputOnBlur('profile2', 'delay3', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<input
						type='number'
						disabled={saving}
						value={formData.profile2.delay4}
						onChange={(e) =>
							handleInputOnBlur('profile2', 'delay4', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<label>Retard systématique des clients</label>
					<input
						type='number'
						disabled={saving}
						value={formData.profile3.delay1}
						onChange={(e) =>
							handleInputOnBlur('profile3', 'delay1', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<input
						type='number'
						disabled={saving}
						value={formData.profile3.delay2}
						onChange={(e) =>
							handleInputOnBlur('profile3', 'delay2', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<input
						type='number'
						disabled={saving}
						value={formData.profile3.delay3}
						onChange={(e) =>
							handleInputOnBlur('profile3', 'delay3', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
					<input
						type='number'
						disabled={saving}
						value={formData.profile3.delay4}
						onChange={(e) =>
							handleInputOnBlur('profile3', 'delay4', parseInt(e.target.value))
						}
						className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
				</div>
				<div className='flex justify-end'>
					<button
						type='submit'
						disabled={saving}
						className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
					>
						<Save className='h-5 w-5 mr-2' />
						{saving ? 'Enregistrement...' : 'Enregistrer'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default ReminderProfileSettings;
