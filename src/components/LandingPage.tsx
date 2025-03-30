import React, { useState } from "react";
import {
  BarChart2,
  Mail,
  Target,
  TrendingUp,
  X,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { sendContactForm } from "../lib/contactService";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
interface LandingPageProps {
  onGetStarted: () => void;
  user?: User; // Add this if you want to pass the user as a prop
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showLegalNotice, setShowLegalNotice] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactFormData, setContactFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    privacy: false,
  });

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactError(null);

    try {
      const success = await sendContactForm({
        name: contactFormData.name,
        email: contactFormData.email,
        subject: contactFormData.subject,
        message: contactFormData.message,
      });

      if (success) {
        setContactSubmitted(true);
        // Réinitialiser le formulaire
        setContactFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          privacy: false,
        });
      } else {
        setContactError(
          "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer plus tard."
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du formulaire:", error);
      setContactError(
        "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer plus tard."
      );
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleStripePayment = async (plan: string) => {
    try {
      // Get current user from Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        alert("Veuillez vous connecter pour continuer");
        return;
      }

      let stripeUrl = "";
      switch (plan) {
        case "basic":
          stripeUrl = `https://buy.stripe.com/9AQeXMeeggZDc4E145?prefilled_email=${encodeURIComponent(
            user.email ?? ""
          )}`;
          break;
        case "pro":
          stripeUrl = `https://buy.stripe.com/00g02Sc685gVfgQbIK?prefilled_email=${encodeURIComponent(
            user.email ?? ""
          )}`;
          break;
        case "enterprise":
          stripeUrl = `https://buy.stripe.com/5kA5nc5HK38N5Gg3cf?prefilled_email=${encodeURIComponent(
            user.email ?? ""
          )}`;
          break;
        default:
          return;
      }

      window.open(stripeUrl, "_blank");
    } catch (error) {
      console.error("Erreur de paiement:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Automatisez vos relances clients
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Automatisez et personnalisez vos relances commerciales pour
              convertir plus de prospects en clients fidèles.
            </p>
            <button
              onClick={onGetStarted}
              className="bg-blue-600 text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Essayer gratuitement
            </button>
          </div>
          {/* Features */}
          <div
            id="features"
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            {/* Add group class to each feature card */}
            <div className="text-center group">
              <div
                className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6 
      transition-transform duration-300 ease-in-out 
      group-hover:-translate-y-2 group-hover:shadow-md"
              >
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Ciblage précis</h3>
              <p className="text-gray-600">
                Identifiez les meilleurs moments pour relancer vos prospects
                B2B.
              </p>
            </div>

            <div className="text-center group">
              <div
                className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6 
      transition-transform duration-300 ease-in-out 
      group-hover:-translate-y-2 group-hover:shadow-md"
              >
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Personnalisation avancée
              </h3>
              <p className="text-gray-600">
                Créez des séquences de relance personnalisées et automatisées.
              </p>
            </div>

            <div className="text-center group">
              <div
                className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6 
      transition-transform duration-300 ease-in-out 
      group-hover:-translate-y-2 group-hover:shadow-md"
              >
                <BarChart2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Analyses détaillées
              </h3>
              <p className="text-gray-600">
                Suivez vos performances et optimisez vos campagnes de relance.
              </p>
            </div>
          </div>
          {/* Use Cases */}
          <div className="mt-32">
            <h2 className="text-3xl font-bold text-center mb-16">
              Comment PaymentFlow peut vous aider
            </h2>

            <div className="space-y-24">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">
                    Gestion des créances impayées
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Identifiez rapidement les factures en retard et lancez des
                    séquences de relance automatisées pour accélérer vos
                    encaissements.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <span>
                        Tableau de bord centralisé pour toutes vos créances
                      </span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <span>
                        Alertes automatiques pour les retards de paiement
                      </span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <span>Suivi détaillé de l'historique des relances</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2011&q=80"
                    alt="Gestion des créances"
                    className="rounded-lg shadow-md w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1 bg-gray-100 p-6 rounded-lg shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                    alt="Automatisation des relances"
                    className="rounded-lg shadow-md w-full"
                  />
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="text-2xl font-bold mb-4">
                    Automatisation des relances
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Configurez des modèles de relance personnalisés et laissez
                    PaymentFlow s'occuper de l'envoi au moment optimal.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <span>Modèles d'emails personnalisables</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <span>Séquences de relance multi-étapes</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <span>Planification intelligente des envois</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">
                    Analyse et reporting
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Obtenez des insights précieux sur vos performances de
                    recouvrement et identifiez les opportunités d'amélioration.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <span>Tableaux de bord analytiques en temps réel</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <span>Rapports détaillés sur les délais de paiement</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <span>Identification des clients à risque</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                    alt="Analyse et reporting"
                    className="rounded-lg shadow-md w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Pricing Section */}

          {/* Pricing Section */}
          <div id="pricing" className="mt-32">
            <h2 className="text-3xl font-bold text-center mb-16">
              Tarifs simples et transparents
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Basic Plan */}
              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:border-blue-500 transition-colors">
                <h3 className="text-xl font-bold mb-2">Basic</h3>
                <p className="text-gray-600 mb-6">
                  Pour les petites entreprises
                </p>
                <p className="text-4xl font-bold mb-6">
                  29€
                  <span className="text-lg font-normal text-gray-500">
                    /mois
                  </span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Jusqu'à 50 clients</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>3 modèles de relance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Rapports mensuels</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Support par email</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleStripePayment("basic")}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Souscrire
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500 transform scale-105 z-10">
                <div className="bg-blue-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-2 rounded-full inline-block mb-2">
                  Populaire
                </div>
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-gray-600 mb-6">
                  Pour les entreprises en croissance
                </p>
                <p className="text-4xl font-bold mb-6">
                  79€
                  <span className="text-lg font-normal text-gray-500">
                    /mois
                  </span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Jusqu'à 200 clients</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>10 modèles de relance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Rapports hebdomadaires</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Support prioritaire</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Intégration comptable</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleStripePayment("pro")}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Souscrire
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:border-blue-500 transition-colors">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-600 mb-6">
                  Pour les grandes entreprises
                </p>
                <p className="text-4xl font-bold mb-6">
                  199€
                  <span className="text-lg font-normal text-gray-500">
                    /mois
                  </span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Clients illimités</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Modèles illimités</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Rapports personnalisés</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Support dédié 24/7</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>API complète</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleStripePayment("enterprise")}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Contacter les ventes
                </button>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div id="testimonials" className="mt-32">
            <h2 className="text-3xl font-bold text-center mb-16">
              Ce que nos clients disent
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                <div className="flex items-center mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                    alt="Sophie Martin"
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold">Sophie Martin</h4>
                    <p className="text-gray-600 text-sm">
                      Directrice Financière, TechStart
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "PaymentFlow a transformé notre processus de recouvrement.
                  Nous avons réduit nos délais de paiement de 45 à 15 jours en
                  moyenne."
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                <div className="flex items-center mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                    alt="Thomas Dubois"
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold">Thomas Dubois</h4>
                    <p className="text-gray-600 text-sm">
                      CEO, Marketing Solutions
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "L'automatisation des relances nous a fait gagner un temps
                  précieux. Notre équipe peut désormais se concentrer sur des
                  tâches à plus forte valeur ajoutée."
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                <div className="flex items-center mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                    alt="Émilie Lefèvre"
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold">Émilie Lefèvre</h4>
                    <p className="text-gray-600 text-sm">
                      Responsable Comptabilité, GreenRetail
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Les rapports détaillés nous permettent d'identifier
                  rapidement les clients à risque et d'adapter notre stratégie
                  de recouvrement en conséquence."
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">
                  PaymentFlow
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                La solution de gestion des relances qui optimise votre
                trésorerie.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Fonctionnalités
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("pricing")}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Tarifs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("testimonials")}
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
          </div>

          <div className="pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© 2024 PaymentFlow. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Modal Privacy Policy */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Politique de confidentialité
              </h2>
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="prose prose-blue max-w-none">
              <h3>1. Collecte des informations</h3>
              <p>
                Nous collectons des informations lorsque vous vous inscrivez sur
                notre site, lorsque vous vous connectez à votre compte, faites
                un achat, participez à un concours, et/ou lorsque vous vous
                déconnectez. Les informations collectées incluent votre nom,
                votre adresse e-mail, numéro de téléphone, et/ou carte de
                crédit.
              </p>
              <p>
                En outre, nous recevons et enregistrons automatiquement des
                informations à partir de votre ordinateur et navigateur, y
                compris votre adresse IP, vos logiciels et votre matériel, et la
                page que vous demandez.
              </p>

              <h3>2. Utilisation des informations</h3>
              <p>
                Toutes les informations que nous recueillons auprès de vous
                peuvent être utilisées pour :
              </p>
              <ul>
                <li>
                  Personnaliser votre expérience et répondre à vos besoins
                  individuels
                </li>
                <li>Fournir un contenu publicitaire personnalisé</li>
                <li>Améliorer notre site Web</li>
                <li>
                  Améliorer le service client et vos besoins de prise en charge
                </li>
                <li>Vous contacter par e-mail</li>
                <li>Administrer un concours, une promotion, ou une enquête</li>
              </ul>

              <h3>3. Confidentialité du commerce en ligne</h3>
              <p>
                Nous sommes les seuls propriétaires des informations recueillies
                sur ce site. Vos informations personnelles ne seront pas
                vendues, échangées, transférées, ou données à une autre société
                pour n'importe quelle raison, sans votre consentement, en dehors
                de ce qui est nécessaire pour répondre à une demande et/ou une
                transaction.
              </p>

              <h3>4. Divulgation à des tiers</h3>
              <p>
                Nous ne vendons, n'échangeons et ne transférons pas vos
                informations personnelles identifiables à des tiers. Cela ne
                comprend pas les tierces parties de confiance qui nous aident à
                exploiter notre site Web ou à mener nos affaires, tant que ces
                parties conviennent de garder ces informations confidentielles.
              </p>

              <h3>5. Protection des informations</h3>
              <p>
                Nous mettons en œuvre une variété de mesures de sécurité pour
                préserver la sécurité de vos informations personnelles. Nous
                utilisons un cryptage à la pointe de la technologie pour
                protéger les informations sensibles transmises en ligne. Nous
                protégeons également vos informations hors ligne.
              </p>

              <h3>6. Consentement</h3>
              <p>
                En utilisant notre site, vous consentez à notre politique de
                confidentialité.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Terms */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Conditions d'utilisation
              </h2>
              <button
                onClick={() => setShowTerms(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="prose prose-blue max-w-none">
              <h3>1. Conditions</h3>
              <p>
                En accédant à ce site web, vous acceptez d'être lié par ces
                conditions d'utilisation, toutes les lois et réglementations
                applicables, et vous acceptez que vous êtes responsable du
                respect des lois locales applicables. Si vous n'acceptez pas
                l'une de ces conditions, il vous est interdit d'utiliser ou
                d'accéder à ce site.
              </p>

              <h3>2. Licence d'utilisation</h3>
              <p>
                L'autorisation est accordée de télécharger temporairement une
                copie des documents (informations ou logiciels) sur le site web
                de PaymentFlow pour un visionnage transitoire personnel et non
                commercial uniquement. Il s'agit de l'octroi d'une licence, et
                non d'un transfert de titre, et sous cette licence, vous ne
                pouvez pas :
              </p>
              <ul>
                <li>modifier ou copier les documents;</li>
                <li>
                  utiliser les documents à des fins commerciales ou pour une
                  présentation publique;
                </li>
                <li>
                  tenter de décompiler ou de désosser tout logiciel contenu sur
                  le site web de PaymentFlow;
                </li>
                <li>
                  supprimer tout droit d'auteur ou autres notations de propriété
                  des documents; ou
                </li>
                <li>
                  transférer les documents à une autre personne ou "miroir" les
                  documents sur un autre serveur.
                </li>
              </ul>

              <h3>3. Avis de non-responsabilité</h3>
              <p>
                Les documents sur le site web de PaymentFlow sont fournis "tels
                quels". PaymentFlow ne donne aucune garantie, expresse ou
                implicite, et décline et annule par la présente toutes les
                autres garanties, y compris, sans limitation, les garanties
                implicites ou les conditions de qualité marchande, d'adéquation
                à un usage particulier, ou de non-violation de la propriété
                intellectuelle ou autre violation des droits.
              </p>

              <h3>4. Limitations</h3>
              <p>
                En aucun cas, PaymentFlow ou ses fournisseurs ne seront
                responsables de tout dommage (y compris, sans limitation, les
                dommages pour perte de données ou de profit, ou en raison d'une
                interruption d'activité) découlant de l'utilisation ou de
                l'incapacité d'utiliser les matériaux sur le site web de
                PaymentFlow, même si PaymentFlow ou un représentant autorisé de
                PaymentFlow a été informé oralement ou par écrit de la
                possibilité de tels dommages.
              </p>

              <h3>5. Révisions et errata</h3>
              <p>
                Les documents apparaissant sur le site web de PaymentFlow
                peuvent inclure des erreurs techniques, typographiques ou
                photographiques. PaymentFlow ne garantit pas que l'un des
                documents sur son site web est exact, complet ou à jour.
                PaymentFlow peut apporter des modifications aux documents
                contenus sur son site web à tout moment sans préavis.
              </p>

              <h3>6. Liens</h3>
              <p>
                PaymentFlow n'a pas examiné tous les sites liés à son site web
                et n'est pas responsable du contenu de ces sites liés.
                L'inclusion de tout lien n'implique pas l'approbation par
                PaymentFlow du site. L'utilisation de tout site web lié est aux
                risques et périls de l'utilisateur.
              </p>

              <h3>7. Modifications des conditions d'utilisation</h3>
              <p>
                PaymentFlow peut réviser ces conditions d'utilisation de son
                site web à tout moment sans préavis. En utilisant ce site web,
                vous acceptez d'être lié par la version alors en vigueur de ces
                conditions d'utilisation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Legal Notice */}
      {showLegalNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Mentions légales
              </h2>
              <button
                onClick={() => setShowLegalNotice(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="prose prose-blue max-w-none">
              <h3>Propriété intellectuelle</h3>
              <p>
                L'ensemble du contenu du site PaymentFlow, incluant, de façon
                non limitative, les graphismes, images, textes, vidéos,
                animations, sons, logos, gifs et icônes ainsi que leur mise en
                forme sont la propriété exclusive de PaymentFlow SAS à
                l'exception des marques, logos ou contenus appartenant à
                d'autres sociétés partenaires ou auteurs.
              </p>
              <p>
                Toute reproduction, distribution, modification, adaptation,
                retransmission ou publication, même partielle, de ces différents
                éléments est strictement interdite sans l'accord exprès par
                écrit de PaymentFlow SAS.
              </p>

              <h3>Protection des données personnelles</h3>
              <p>
                Conformément au Règlement Général sur la Protection des Données
                (RGPD) et à la loi Informatique et Libertés, vous disposez d'un
                droit d'accès, de rectification, de suppression et d'opposition
                aux données personnelles vous concernant.
              </p>
              <p>
                Pour exercer ces droits, vous pouvez nous contacter à l'adresse
                email suivante : dpo@paymentflow.com ou par courrier à l'adresse
                du siège social indiquée ci-dessus.
              </p>

              <h3>Cookies</h3>
              <p>
                Notre site utilise des cookies pour améliorer l'expérience
                utilisateur. En naviguant sur notre site, vous acceptez
                l'utilisation de cookies conformément à notre politique de
                confidentialité.
              </p>

              <h3>Loi applicable et juridiction</h3>
              <p>
                Les présentes mentions légales sont régies par le droit
                français. En cas de litige, les tribunaux français seront seuls
                compétents.
              </p>

              <h3>Contact</h3>
              <p>
                Pour toute question relative aux présentes mentions légales ou
                pour toute demande concernant le site, vous pouvez nous
                contacter à l'adresse suivante : legal@paymentflow.com
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Contact */}
      {showContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Contactez-nous
              </h2>
              <button
                onClick={() => setShowContact(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {contactSubmitted ? (
              <div className="text-center py-8">
                <div className="bg-green-100 text-green-700 p-4 rounded-md mb-4 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  <span>Votre message a été envoyé avec succès !</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Nous vous répondrons dans les plus brefs délais.
                </p>
                <button
                  onClick={() => setShowContact(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                {contactError && (
                  <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
                    {contactError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom complet
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={contactFormData.name}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2  focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={contactFormData.email}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        email: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre@email.com"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sujet
                  </label>
                  <select
                    id="subject"
                    value={contactFormData.subject}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        subject: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="demo">Demande de démonstration</option>
                    <option value="pricing">Informations tarifaires</option>
                    <option value="support">Support technique</option>
                    <option value="partnership">Partenariat</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={contactFormData.message}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        message: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Comment pouvons-nous vous aider ?"
                    required
                  ></textarea>
                </div>

                <div className="flex items-start">
                  <input
                    id="privacy"
                    type="checkbox"
                    checked={contactFormData.privacy}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        privacy: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    required
                  />
                  <label
                    htmlFor="privacy"
                    className="ml-2 block text-sm text-gray-500"
                  >
                    J'accepte que mes données soient traitées conformément à la{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowContact(false);
                        setShowPrivacyPolicy(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      politique de confidentialité
                    </button>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {contactSubmitting ? "Envoi en cours..." : "Envoyer"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
