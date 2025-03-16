import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
	TrendingUp,
	Users,
	FileText,
	Settings,
	LogOut,
	X,
	Home,
	FileQuestion,
	CalendarCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthSessionMissingError } from '@supabase/supabase-js';

export default function Layout() {
	const location = useLocation();
	const navigate = useNavigate();
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
	const [logoutError, setLogoutError] = useState<string | null>(null);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		try {
			setIsLoggingOut(true);
			setLogoutError(null);

			// Déconnexion de Supabase
			const { error } = await supabase.auth.signOut();

			if (error) {
				if (
					error instanceof AuthSessionMissingError ||
					error.message.includes('session_not_found')
				) {
					// Si l'erreur indique que la session n'existe pas, on considère que l'utilisateur est déjà déconnecté
					window.location.href = '/';
					return;
				}
				throw error;
			}

			// Redirection forcée vers la racine
			window.location.href = '/';
		} catch (error) {
			console.error('Erreur lors de la déconnexion:', error);
			setLogoutError(
				'Une erreur est survenue lors de la déconnexion. Veuillez réessayer.'
			);
		} finally {
			setIsLoggingOut(false);
		}
	};

	const closeLogoutModal = () => {
		setShowLogoutConfirm(false);
		setLogoutError(null);
	};

	const navigation = [
		{ name: 'Tableau de bord', href: '/', icon: Home },
		{ name: 'Clients', href: '/clients', icon: Users },
		{ name: 'Clients inconnus', href: '/unknown_clients', icon: FileQuestion },
		{ name: 'Créances', href: '/receivables', icon: FileText },
		{ name: 'Paramètres', href: '/settings', icon: Settings },
		{ name: 'Relance', href: '/reminders', icon: CalendarCheck },
	];

	return (
		<div className='min-h-screen bg-gray-100'>
			{/* Sidebar */}
			<div className='fixed inset-y-0 left-0 w-64 bg-white shadow-lg'>
				<Link
					to='/'
					className='flex items-center h-16 px-4 border-b border-gray-200'
				>
					<TrendingUp className='h-8 w-8 text-blue-600' />
					<span className='ml-2 text-xl font-bold text-gray-900'>
						PaymentFlow
					</span>
				</Link>

				<nav className='mt-6 px-4 space-y-1'>
					{navigation.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								key={item.name}
								to={item.href}
								className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-md
                  ${
										location.pathname === item.href
											? 'bg-blue-50 text-blue-700'
											: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
									}
                `}
							>
								<Icon className='h-5 w-5 mr-3' />
								{item.name}
							</Link>
						);
					})}
				</nav>

				<div className='absolute bottom-0 w-full p-4 border-t border-gray-200'>
					<button
						onClick={() => setShowLogoutConfirm(true)}
						className='flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md'
					>
						<LogOut className='h-5 w-5 mr-3' />
						Déconnexion
					</button>
				</div>
			</div>

			{/* Main content */}
			<div className='pl-64'>
				<main className='py-6'>
					<Outlet />
				</main>
			</div>

			{/* Modal de confirmation de déconnexion */}
			{showLogoutConfirm && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 max-w-sm w-full mx-4'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-lg font-medium text-gray-900'>
								Confirmation
							</h3>
							<button
								onClick={closeLogoutModal}
								className='text-gray-400 hover:text-gray-500'
							>
								<X className='h-5 w-5' />
							</button>
						</div>
						{logoutError && (
							<div className='mb-4 p-3 bg-red-50 text-red-700 rounded-md'>
								{logoutError}
							</div>
						)}
						<p className='text-gray-600 mb-6'>
							Êtes-vous sûr de vouloir vous déconnecter ?
						</p>
						<div className='flex justify-end space-x-4'>
							<button
								onClick={closeLogoutModal}
								className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md'
							>
								Annuler
							</button>
							<button
								onClick={handleLogout}
								disabled={isLoggingOut}
								className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
