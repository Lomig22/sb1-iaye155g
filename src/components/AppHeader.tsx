import { useRef, useState } from "react";
import { PopupWidget } from "react-calendly";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Menu, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import ContactModal from "../pages/ContactModal";

interface AppHeaderProps {
  onContactClick: () => void;
  user: User | null;
}

export default function AppHeader({ user }: AppHeaderProps) {
  const navigate = useNavigate();
  const calendlyRef = useRef<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        navigate("/");
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Link */}
        <Link to="/" className="flex items-center space-x-2">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">PaymentFlow</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          <button
            onClick={() => scrollToSection("features")}
            className="text-gray-600 hover:text-gray-900"
          >
            Fonctionnalités
          </button>
          <button
            onClick={() => scrollToSection("testimonials")}
            className="text-gray-600 hover:text-gray-900"
          >
            Témoignages
          </button>
          <Link to="/pricing" className="text-gray-600 hover:text-gray-900">
            Tarifs
          </Link>
          <button
            onClick={() => setShowContactModal(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            Contact
          </button>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Déconnexion
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-blue-600 px-4 py-2 rounded-md underline hover:bg-blue-50 transition-colors"
              >
                Connexion
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button
              onClick={() => scrollToSection("features")}
              className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Témoignages
            </button>
            <Link
              to="/pricing"
              className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Tarifs
            </Link>
            <button
              onClick={() => setShowContactModal(true)}
              className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Contact
            </button>
            {user ? (
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
              >
                Déconnexion
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block w-full text-left px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                >
                  Connexion
                </Link>
                <Link
                  to="/signup"
                  className="block w-full text-left px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Calendly Button - Adjusted for mobile */}
      <div className="fixed bottom-4 bottom-20 right-4 z-[60] md:bottom-20">
        <button
          onClick={() =>
            (window as any).Calendly.initPopupWidget({
              url: "https://calendly.com/paymentfloww/30min",
            })
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-all text-sm md:text-base md:px-6 md:py-3"
        >
          planifier une réunion
        </button>
      </div>

      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </header>
  );
}
