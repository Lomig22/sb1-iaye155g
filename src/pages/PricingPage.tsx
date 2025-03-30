import { Link } from "react-router-dom";
import { CheckCircle, TrendingUp } from "lucide-react";
import AppHeader from "../components/AppHeader";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

const PricingPage = () => {
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
      {/* Main Pricing Content */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-20">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Des tarifs adaptés à chaque entreprise
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choisissez le plan qui correspond le mieux à vos besoins de
              relance et de gestion des créances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:border-blue-500 transition-colors">
              <h3 className="text-xl font-bold mb-2">Basic</h3>
              <p className="text-gray-600 mb-6">
                Parfait pour les startups et TPE
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">29€</span>
                <span className="text-lg text-gray-500">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <FeatureItem text="Jusqu'à 50 clients" />
                <FeatureItem text="3 modèles de relance" />
                <FeatureItem text="Rapports mensuels" />
                <FeatureItem text="Support par email" />
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
              <p className="text-gray-600 mb-6">Pour les PME en croissance</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">79€</span>
                <span className="text-lg text-gray-500">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <FeatureItem text="Jusqu'à 200 clients" />
                <FeatureItem text="10 modèles de relance" />
                <FeatureItem text="Rapports hebdomadaires" />
                <FeatureItem text="Support prioritaire" />
                <FeatureItem text="Intégration comptable" />
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
                Solution sur mesure pour les grandes entreprises
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">199€</span>
                <span className="text-lg text-gray-500">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <FeatureItem text="Clients illimités" />
                <FeatureItem text="Modèles illimités" />
                <FeatureItem text="Rapports personnalisés" />
                <FeatureItem text="Support dédié 24/7" />
                <FeatureItem text="API complète" />
              </ul>
              <button
                onClick={() => handleStripePayment("enterprise")}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Contacter les ventes
              </button>
            </div>
          </div>

          {/* Enterprise Contact Section */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Besoin d'une solution personnalisée ?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Notre équipe peut créer un plan sur mesure adapté aux besoins
              spécifiques de votre entreprise.
            </p>
            <button
              onClick={() => handleStripePayment("enterprise")}
              className="bg-blue-600 text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Contactez notre équipe commerciale
            </button>
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">
          Questions fréquentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FAQItem
            question="Puis-je changer de plan ultérieurement ?"
            answer="Oui, vous pouvez mettre à jour ou rétrograder votre plan à tout moment depuis votre tableau de bord."
          />
          <FAQItem
            question="Y a-t-il des frais de résiliation ?"
            answer="Aucun frais de résiliation - vous pouvez annuler votre abonnement à tout moment."
          />
          <FAQItem
            question="Quels moyens de paiement acceptez-vous ?"
            answer="Nous acceptons toutes les cartes de crédit principales via Stripe, ainsi que les virements bancaires."
          />
          <FAQItem
            question="Proposez-vous une période d'essai ?"
            answer="Oui, nous offrons un essai gratuit de 14 jours sans engagement."
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        {/* Keep the same footer as landing page */}
      </footer>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-start">
    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
    <span>{text}</span>
  </li>
);

const FAQItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold mb-2">{question}</h3>
    <p className="text-gray-600">{answer}</p>
  </div>
);

export default PricingPage;
