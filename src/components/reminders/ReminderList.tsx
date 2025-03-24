import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Client, Receivable, Reminder } from '../../types/database';
import { AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReminderList = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [records, setRecords] = useState<
		(Reminder & { receivable: Receivable & { client: Client } })[]
	>([]);
	const fetchRecords = async () => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Utilisateur non authentifié');

			const { data: clientsData, error } = await supabase
				.from('reminders')
				.select('*, receivable:receivables(*, client:clients(*))')
				.order('reminder_date', { ascending: false });

			// .eq('owner_id', user.id)
			// .order('name');

			if (error) throw error;
			setRecords(clientsData || []);
		} catch (error) {
			console.error('Erreur lors du chargement des clients:', error);
			setError('Impossible de charger la liste des clients');
		} finally {
			setIsLoading(false);
		}
	};
	useEffect(() => {
		fetchRecords();
	}, []);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-96'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	return (
		<div className='p-6'>
			<div className='flex gap-4 items-center mb-6'>
				<h1 className='text-2xl font-bold text-gray-900'>Relance</h1>
				<Link to='/receivables' className='flex items-center h-16 px-4'>
					<button className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2'>
						<FileText className='h-5 w-5' />
						Créances
					</button>
				</Link>
			</div>

			{error && (
				<div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center'>
					<AlertCircle className='h-5 w-5 mr-2' />
					{error}
				</div>
			)}

			{/* <div className='relative mb-6'>
				<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
				<input
					type='text'
					placeholder='Rechercher par nom, code client...'
					// value={searchTerm}
					// onChange={(e) => setSearchTerm(e.target.value)}
					className='pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
				/>
			</div> */}

			<div className='bg-white rounded-lg shadow overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Date
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									nom
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									code client
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									numéro de facture
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									type de Relance
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{records.map((record) => (
								<tr key={record.id} className='hover:bg-gray-50'>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{new Date(record.reminder_date).toLocaleString('fr-FR')}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{record.receivable?.client?.company_name}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{record.receivable?.client?.client_code}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{record.receivable?.invoice_number}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{record.reminder_type}
									</td>
								</tr>
							))}
							{records.length === 0 && (
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
		</div>
	);
};

export default ReminderList;
