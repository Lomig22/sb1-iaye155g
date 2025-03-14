import React, { useState } from 'react';
import { Mail, User, Bell, Shield } from 'lucide-react';
import EmailSettings from './EmailSettings';
import ProfileSettings from './ProfileSettings';
import NotificationSettings from './NotificationSettings';
import SecuritySettings from './SecuritySettings';
import ReminderProfileSettings from './ReminderProfileSettings';

export default function Settings() {
	const [activeTab, setActiveTab] = useState('email');

	const tabs = [
		{
			id: 'email',
			name: 'Paramètres email',
			icon: Mail,
			component: EmailSettings,
		},
		{ id: 'profile', name: 'Profil', icon: User, component: ProfileSettings },
		{
			id: 'notifications',
			name: 'Notifications',
			icon: Bell,
			component: NotificationSettings,
		},
		{
			id: 'security',
			name: 'Sécurité',
			icon: Shield,
			component: SecuritySettings,
		},
		{
			id: 'reminder_profile',
			name: 'Profil de rappel',
			icon: User,
			component: ReminderProfileSettings,
		},
	];

	const ActiveComponent =
		tabs.find((tab) => tab.id === activeTab)?.component || EmailSettings;

	return (
		<div className='p-6'>
			<h1 className='text-2xl font-bold text-gray-900 mb-6'>Paramètres</h1>

			<div className='bg-white rounded-lg shadow'>
				<div className='border-b border-gray-200'>
					<nav className='flex space-x-4 px-4'>
						{tabs.map((tab) => {
							const Icon = tab.icon;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`py-4 px-6 inline-flex items-center border-b-2 ${
										activeTab === tab.id
											? 'border-blue-500 text-blue-600'
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									}`}
								>
									<Icon className='h-5 w-5 mr-2' />
									{tab.name}
								</button>
							);
						})}
					</nav>
				</div>

				<div className='p-6'>
					<ActiveComponent />
				</div>
			</div>
		</div>
	);
}
