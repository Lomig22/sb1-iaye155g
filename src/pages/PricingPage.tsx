"use client";
import { motion, useInView } from "framer-motion";
import { CheckCircle, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useState } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const PricingPage = () => {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly"
  );

  // Price calculation helper
  const getPrice = (monthlyPrice: number) => {
    const roundPrice = (price: number) => Math.round(price / 5) * 5; // Rounds to nearest 5

    if (billingInterval === "yearly") {
      const yearlyPrice = monthlyPrice * 12;
      const discountedPrice = yearlyPrice * 0.9; // 10% discount
      return {
        displayedPrice: roundPrice(discountedPrice),
        originalPrice: roundPrice(yearlyPrice),
      };
    }

    return { displayedPrice: roundPrice(monthlyPrice), originalPrice: null };
  };

  const handleStripePayment = async (plan: string) => {
    try {
      // Get current user from Supabase
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Veuillez vous connecter pour continuer");
        return;
      }

      // Check for existing subscription
      const { data: existingSubscriptions, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id);

      if (subscriptionError) {
        console.error("Error checking subscriptions:", subscriptionError);
        alert(
          "Une erreur est survenue lors de la vérification de l'abonnement"
        );
        return;
      }

      if (existingSubscriptions && existingSubscriptions.length > 0) {
        alert("Vous avez déjà un abonnement actif.");
        return;
      }

      // Add new subscription to Supabase
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert([
          {
            user_id: user.id,
            status: "active",
          },
        ]);

      if (insertError) {
        console.error("Error creating subscription:", insertError);
        alert("Erreur lors de la création de l'abonnement");
        return;
      }

      // Proceed to Stripe payment
      let stripeUrl = "";
      switch (plan) {
        case "basic":
          stripeUrl = `https://buy.stripe.com/test_dR66s9cgGcRgcQU3cc?prefilled_email=${encodeURIComponent(
            user.email ?? ""
          )}`;
          break;
        case "pro":
          stripeUrl = `https://buy.stripe.com/test_dR66s9cgGcRgcQU3cc?prefilled_email=${encodeURIComponent(
            user.email ?? ""
          )}`;
          break;
        case "enterprise":
          stripeUrl = `https://buy.stripe.com/test_dR66s9cgGcRgcQU3cc?prefilled_email=${encodeURIComponent(
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
    >
      {/* Main Pricing Content */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div variants={fadeInUp} className="text-center mb-20">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Des tarifs adaptés à chaque entreprise
            </h1>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === "monthly"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Facturation mensuelle
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === "yearly"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Facturation annuelle
              </button>
            </div>
            {billingInterval === "yearly" && (
              <p className="mt-4 text-green-600 font-medium">
                Économisez 10% avec l'abonnement annuel !
              </p>
            )}
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Basic Plan */}
            <motion.div
              variants={fadeInScale}
              className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <h3 className="text-xl font-bold mb-2">Basic</h3>
              <p className="text-gray-600 mb-6">
                Parfait pour les startups et TPE
              </p>
              <div className="mb-6">
                {billingInterval === "yearly" && (
                  <span className="text-lg text-gray-500 line-through mr-2">
                    {getPrice(29).originalPrice}€
                  </span>
                )}
                <span className="text-4xl font-bold">
                  {getPrice(29).displayedPrice}€
                </span>
                <span className="text-lg font-normal text-gray-500">
                  /{billingInterval === "monthly" ? "mois" : "an"}
                  <sup className="text-sm ml-1 font-bold">
                    HT {billingInterval === "monthly" ? "" : "-10%"}
                  </sup>
                </span>
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
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              variants={fadeInScale}
              className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="bg-blue-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-2 rounded-full inline-block mb-2">
                  Populaire
                </div>
                {/* {billingInterval === "yearly" && (
                  <div className="bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider py-1 px-2 rounded-full">
                    -10%
                  </div>
                )} */}
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-gray-600 mb-6">Pour les PME en croissance</p>
              <div className="mb-6">
                {billingInterval === "yearly" && (
                  <span className="text-lg text-gray-500 line-through mr-2">
                    {getPrice(79).originalPrice}€
                  </span>
                )}
                <span className="text-4xl font-bold">
                  {getPrice(79).displayedPrice}€
                </span>
                <span className="text-lg font-normal text-gray-500">
                  /{billingInterval === "monthly" ? "mois" : "an"}
                  <sup className="text-sm ml-1 font-bold">
                    HT {billingInterval === "monthly" ? "" : "-10%"}
                  </sup>
                </span>
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
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              variants={fadeInScale}
              className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">
                Solution sur mesure pour les grandes entreprises
              </p>
              <div className="mb-6">
                {billingInterval === "yearly" && (
                  <span className="text-lg text-gray-500 line-through mr-2">
                    {getPrice(199).originalPrice}€
                  </span>
                )}
                <span className="text-4xl font-bold">
                  {getPrice(199).displayedPrice}€
                </span>
                <span className="text-lg font-normal text-gray-500">
                  /{billingInterval === "monthly" ? "mois" : "an"}
                  <sup className="text-sm ml-1 font-bold">
                    HT {billingInterval === "monthly" ? "" : "-10%"}
                  </sup>
                </span>
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
            </motion.div>
          </motion.div>

          {/* Enterprise Contact Section */}
          <motion.div
            className="mt-20 text-center"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <motion.h2
              className="text-3xl font-bold text-gray-900 mb-6"
              variants={fadeInLeft}
            >
              Besoin d'une solution personnalisée ?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Notre équipe peut créer un plan sur mesure adapté aux besoins
              spécifiques de votre entreprise.
            </motion.p>
            <motion.button
              onClick={() => handleStripePayment("enterprise")}
              className="bg-blue-600 text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors"
              variants={fadeInScale}
            >
              Contactez notre équipe commerciale
            </motion.button>
          </motion.div>
        </div>
      </main>

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <motion.h2
          className="text-3xl font-bold text-center mb-16"
          variants={fadeInLeft}
        >
          Questions fréquentes
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={staggerContainer}
        >
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
        </motion.div>
      </motion.div>
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
                La solution de gestion des relances qui optimise votre
                trésorerie.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button className="text-gray-500 hover:text-gray-700">
                    Fonctionnalités
                  </button>
                </li>
                <li>
                  <button className="text-gray-500 hover:text-gray-700">
                    Tarifs
                  </button>
                </li>
                <li>
                  <button className="text-gray-500 hover:text-gray-700">
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
                  <button className="text-gray-500 hover:text-gray-700">
                    Politique de confidentialité
                  </button>
                </li>
                <li>
                  <button className="text-gray-500 hover:text-gray-700">
                    Conditions d'utilisation
                  </button>
                </li>
                <li>
                  <button className="text-gray-500 hover:text-gray-700">
                    Mentions légales
                  </button>
                </li>
                <li>
                  <button className="text-gray-500 hover:text-gray-700">
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
    </motion.div>
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
