import React, { useEffect, useState } from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';
import { supabase, checkAuth } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { startReminderService } from './lib/reminderService';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import ClientList from './components/clients/ClientList';
import Layout from './components/Layout';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import ReceivablesList from './components/receivables/ReceivablesList';
import Settings from './components/settings/Settings';
import UnknownClientList from './components/unknownClients/UnknownClientList';

function App() {
	const [user, setUser] = useState<User | null>(null);
	const [showAuth, setShowAuth] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const initAuth = async () => {
			try {
				const session = await checkAuth();
				const currentUser = session?.user ?? null;
				setUser(currentUser);

				// Démarrer le service de relance si l'utilisateur est connecté
				if (currentUser) {
					startReminderService(currentUser.id);
				}
			} catch (error) {
				console.error("Erreur lors de l'initialisation de l'auth:", error);
			} finally {
				setIsLoading(false);
			}
		};

		initAuth();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			const currentUser = session?.user ?? null;
			setUser(currentUser);

			if (currentUser) {
				// Démarrer le service de relance lors de la connexion
				startReminderService(currentUser.id);
			}

			if (!currentUser) {
				setShowAuth(false);
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	if (isLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	// Check if URL contains recovery token
	const isResetPasswordPage = window.location.href.includes('type=recovery');

	if (isResetPasswordPage) {
		return <ResetPassword />;
	}

	if (!user && showAuth) {
		return <Auth onClose={() => setShowAuth(false)} />;
	}

	if (!user) {
		return <LandingPage onGetStarted={() => setShowAuth(true)} />;
	}

	return (
		<Router>
			<Routes>
				<Route element={<Layout />}>
					<Route path='/' element={<Dashboard />} />
					<Route path='/clients' element={<ClientList />} />
					<Route path='/receivables' element={<ReceivablesList />} />
					<Route path='/unknown_clients' element={<UnknownClientList />} />
					<Route path='/settings' element={<Settings />} />
					<Route path='*' element={<Navigate to='/' replace />} />
				</Route>
			</Routes>
		</Router>
	);
}

export default App;
