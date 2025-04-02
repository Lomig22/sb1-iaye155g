import { useRef, useState } from "react";
import { PopupWidget } from "react-calendly";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";
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
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
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
          <div className="hidden md:flex space-x-8">
            <button
              onClick={() => setShowContactModal(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              Contact
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                className=" text-blue-600 px-4 py-2 rounded-md underline hover:bg-blue-50 transition-colors"
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
      </nav>
      <div className="fixed bottom-20 right-4 z-[60]">
        {" "}
        {/* Increased from bottom-8 to bottom-12 */}
        <button
          onClick={() =>
            (window as any).Calendly.initPopupWidget({
              url: "https://calendly.com/paymentfloww/30min",
            })
          }
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
          // Changed to rounded-2xl for more rounding
          style={{
            background: "#2563eb",
            color: "#ffffff",
          }}
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
