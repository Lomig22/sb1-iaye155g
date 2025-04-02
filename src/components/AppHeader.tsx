import { useRef } from "react";
import { PopupWidget } from "react-calendly";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

interface AppHeaderProps {
  onContactClick: () => void;
  user: User | null;
}

export default function AppHeader({ user }: AppHeaderProps) {
  const navigate = useNavigate();
  const calendlyRef = useRef<any>(null);

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
          <Link to="/contact" className="text-gray-600 hover:text-gray-900">
            Contact
          </Link>
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
          <PopupWidget
            ref={calendlyRef}
            url="https://calendly.com/paymentfloww/30min"
            rootElement={document.getElementById("root")!}
            text="planifier une réunion"
            color="#2563eb"
          />
        </div>
      </nav>
    </header>
  );
}
