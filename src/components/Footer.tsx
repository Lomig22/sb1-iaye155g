import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import {
  BarChart2,
  Mail,
  Target,
  TrendingUp,
  X,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

const Footer = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const navigate = useNavigate();
  const calendlyRef = useRef<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showLegalNotice, setShowLegalNotice] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const showContactModalRef = useRef(showContactModal);
  const isMobileMenuOpenRef = useRef(isMobileMenuOpen);

  useEffect(() => {
    showContactModalRef.current = showContactModal;
  }, [showContactModal]);

  useEffect(() => {
    isMobileMenuOpenRef.current = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  // Add ESC key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Close contact modal first if open
        if (showContactModalRef.current) {
          setShowContactModal(false);
        }
        // Then close mobile menu if open
        else if (isMobileMenuOpenRef.current) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const fadeInScale = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6 },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  // New fadeInLeft animation variant
  const fadeInLeft = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const handleNavToSection = (id: string) => {
    if (window.location.pathname === "/") {
      scrollToSection(id);
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <motion.footer
      className="bg-gray-50 border-t border-gray-200 py-12"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }} // Trigger only when fully in view
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8"
          variants={fadeInLeft}
        >
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                PaymentFlow
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              La solution de gestion des relances qui optimise votre trésorerie.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => handleNavToSection("features")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Fonctionnalités
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavToSection("pricing")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Tarifs
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavToSection("testimonials")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Témoignages
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Ressources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button className="text-gray-500 hover:text-gray-700">
                  Blog
                </button>
              </li>
              <li>
                <button className="text-gray-500 hover:text-gray-700">
                  Guides
                </button>
              </li>
              <li>
                <button className="text-gray-500 hover:text-gray-700">
                  Support
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Politique de confidentialité
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowTerms(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Conditions d'utilisation
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowLegalNotice(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Mentions légales
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowContact(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Contactez-nous
                </button>
              </li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          className="pt-8 border-t border-gray-200 text-center text-sm text-gray-500"
          variants={fadeInLeft}
        >
          <p>© 2024 PaymentFlow. Tous droits réservés.</p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
