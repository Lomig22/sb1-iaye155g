import { X, CheckCircle } from "lucide-react";
import { useState } from "react";

interface ContactModalProps {
  onClose: () => void;
}

const ContactModal = ({ onClose }: ContactModalProps) => {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactError(null);

    try {
      const response = await fetch("https://formspree.io/f/mqapyeby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: contactFormData.name,
          email: contactFormData.email,
          subject: contactFormData.subject,
          message: contactFormData.message,
          _gotcha: "",
        }),
      });

      if (response.ok) {
        setContactSubmitted(true);
        setContactFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          privacy: false,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setContactError(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again."
      );
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close contact form"
        >
          <X className="h-6 w-6" />
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Contactez notre équipe
        </h1>

        {contactSubmitted ? (
          <div className="text-center py-8">
            <div className="bg-green-100 text-green-700 p-4 rounded-md mb-4 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 mr-2" />
              <span>Votre message a été envoyé avec succès !</span>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setContactSubmitted(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Nouveau message
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-6">
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
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            <input
              type="text"
              name="_gotcha"
              style={{ display: "none" }}
              tabIndex={-1}
            />

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

        {/* Privacy Policy Modal */}
        {showPrivacyPolicy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Politique de confidentialité
              </h2>
              {/* Add your privacy policy content here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
