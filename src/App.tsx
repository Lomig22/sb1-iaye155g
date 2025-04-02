import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase, checkAuth } from "./lib/supabase";
import { User } from "@supabase/supabase-js";
import { startReminderService } from "./lib/reminderService";

import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import Layout from "./components/Layout";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import ReceivablesList from "./components/receivables/ReceivablesList";
import Settings from "./components/settings/Settings";
import ClientPage from "./components/clients/ClientPage";
import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPassword";
import PricingPage from "./pages/PricingPage";
import AppHeader from "./components/AppHeader";
import ContactPage from "./pages/ContactPage";
import PaymentSuccess from "./pages/PaymentSuccess";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await checkAuth();
        setUser(session?.user ?? null);
        if (session?.user) {
          startReminderService(session.user.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
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
        startReminderService(currentUser.id);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <AppHeader user={user} onContactClick={() => {}} />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage onGetStarted={() => {}} />} />
        <Route
          path="/signup"
          element={
            !user ? <SignupPage /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/" replace />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/pricing" element={<PricingPage />} />

        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* Auth-protected routes */}
        <Route
          path="/"
          element={user ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<ClientPage />} />
          <Route path="/receivables" element={<ReceivablesList />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Redirects */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
