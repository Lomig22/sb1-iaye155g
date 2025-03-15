import { supabase } from './supabase';
import { Receivable, Client } from '../types/database';
import { sendEmail } from './email';

interface EmailSettings {
	provider_type: string;
	smtp_username: string;
	smtp_password: string;
	smtp_server: string;
	smtp_port: number;
	smtp_encryption: string;
	email_signature?: string;
}

// Fonction pour récupérer les paramètres email de l'utilisateur
async function getEmailSettings(userId: string): Promise<EmailSettings | null> {
	try {
		const { data, error } = await supabase
			.from('email_settings')
			.select('*')
			.eq('user_id', userId)
			.maybeSingle();

		if (error) {
			if (error.code === 'PGRST116') {
				return null;
			}
			throw error;
		}
		return data;
	} catch (error) {
		console.error(
			'Erreur lors de la récupération des paramètres email:',
			error
		);
		return null;
	}
}

// Fonction pour formater le template avec les variables
function formatTemplate(
	template: string,
	variables: {
		company: string;
		amount: number;
		invoice_number: string;
		due_date: string;
		days_late: number;
	}
): string {
	return template
		.replace(/{company}/g, variables.company)
		.replace(
			/{amount}/g,
			new Intl.NumberFormat('fr-FR', {
				style: 'currency',
				currency: 'EUR',
			}).format(variables.amount)
		)
		.replace(/{invoice_number}/g, variables.invoice_number)
		.replace(
			/{due_date}/g,
			new Date(variables.due_date).toLocaleDateString('fr-FR')
		)
		.replace(/{days_late}/g, variables.days_late.toString());
}

// Fonction pour déterminer le niveau de relance approprié
function determineReminderLevel(
	daysLate: number,
	client: Client
): {
	level: 'first' | 'second' | 'third' | 'final' | null;
	template: string | null;
} {
	if (!client) return { level: null, template: null };

	if (
		daysLate >= (client.reminder_delay_final || 60) &&
		client.reminder_template_final
	) {
		return { level: 'final', template: client.reminder_template_final };
	}
	if (
		daysLate >= (client.reminder_delay_3 || 45) &&
		client.reminder_template_3
	) {
		return { level: 'third', template: client.reminder_template_3 };
	}
	if (
		daysLate >= (client.reminder_delay_2 || 30) &&
		client.reminder_template_2
	) {
		return { level: 'second', template: client.reminder_template_2 };
	}
	if (
		daysLate >= (client.reminder_delay_1 || 15) &&
		client.reminder_template_1
	) {
		return { level: 'first', template: client.reminder_template_1 };
	}
	return { level: 'first', template: client.reminder_template_1 || null };
}

// Fonction pour envoyer une relance manuelle
export async function sendManualReminder(
	receivableId: string
): Promise<boolean> {
	try {
		const { data: receivable, error: receivableError } = await supabase
			.from('receivables')
			.select('*, client:clients(*)')
			.eq('id', receivableId)
			.single();

		if (receivableError) throw receivableError;
		if (!receivable) return false;

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return false;

		const emailSettings = await getEmailSettings(user.id);
		if (!emailSettings) return false;

		const dueDate = new Date(receivable.due_date);
		const today = new Date();
		const daysLate = Math.floor(
			(today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		const { level, template } = determineReminderLevel(
			daysLate,
			receivable.client
		);
		if (!level || !template) return false;

		const emailContent = formatTemplate(template, {
			company: receivable.client.company_name,
			amount: receivable.amount,
			invoice_number: receivable.invoice_number,
			due_date: receivable.due_date,
			days_late: daysLate,
		});

		const emailSent = await sendEmail(
			emailSettings,
			receivable.client.email,
			`Relance facture ${receivable.invoice_number}`,
			emailContent
		);

		if (emailSent) {
			// Enregistrer la relance
			await supabase.from('reminders').insert({
				receivable_id: receivableId,
				reminder_type: level,
				reminder_date: new Date().toISOString(),
				email_sent: true,
				email_content: emailContent,
			});

			// Mettre à jour le statut de la créance
			await supabase
				.from('receivables')
				.update({
					status: 'reminded',
					updated_at: new Date().toISOString(),
				})
				.eq('id', receivableId);

			return true;
		}

		return false;
	} catch (error) {
		console.error("Erreur lors de l'envoi de la relance:", error);
		return false;
	}
}

// Fonction principale pour vérifier et envoyer les relances automatiques
export async function checkAndSendReminders(userId: string): Promise<void> {
	try {
		const emailSettings = await getEmailSettings(userId);
		if (!emailSettings) {
			console.log('Paramètres email non configurés');
			return;
		}

		const { data: receivables, error: receivablesError } = await supabase
			.from('receivables')
			.select(
				`
        *,
        client:clients(*)
      `
			)
			.eq('status', 'pending')
			.returns<(Receivable & { client: Client })[]>();

		if (receivablesError) throw receivablesError;
		if (!receivables || receivables.length === 0) return;

		for (const receivable of receivables) {
			const dueDate = new Date(receivable.due_date);
			const today = new Date();
			const daysLate = Math.floor(
				(today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
			);

			if (daysLate <= 0) continue;

			const { level, template } = determineReminderLevel(
				daysLate,
				receivable.client
			);
			if (!level || !template) continue;

			// Vérifier la dernière relance
			const { data: lastReminder } = await supabase
				.from('reminders')
				.select('*')
				.eq('receivable_id', receivable.id)
				.order('created_at', { ascending: false })
				.limit(1)
				.single();

			if (lastReminder) {
				const lastReminderDate = new Date(lastReminder.created_at);
				const daysSinceLastReminder = Math.floor(
					(today.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24)
				);
				if (daysSinceLastReminder < 7) continue;
			}

			const emailContent = formatTemplate(template, {
				company: receivable.client.company_name,
				amount: receivable.amount,
				invoice_number: receivable.invoice_number,
				due_date: receivable.due_date,
				days_late: daysLate,
			});

			const emailSent = await sendEmail(
				emailSettings,
				receivable.client.email,
				`Relance facture ${receivable.invoice_number}`,
				emailContent
			);

			if (emailSent) {
				await supabase.from('reminders').insert({
					receivable_id: receivable.id,
					reminder_type: level,
					reminder_date: new Date().toISOString(),
					email_sent: true,
					email_content: emailContent,
				});

				await supabase
					.from('receivables')
					.update({
						status: 'reminded',
						updated_at: new Date().toISOString(),
					})
					.eq('id', receivable.id);
			}
		}
	} catch (error) {
		console.error('Erreur lors de la vérification des relances:', error);
	}
}

// Fonction pour démarrer le service de relance automatique
export function startReminderService(userId: string): void {
	// Vérifier les relances toutes les heures
	const intervalId = setInterval(() => {
		checkAndSendReminders(userId).catch((error) => {
			console.error('Erreur dans le service de relance:', error);
		});
	}, 60 * 60 * 1000);

	// Nettoyer l'intervalle si le composant est démonté
	window.addEventListener('beforeunload', () => {
		clearInterval(intervalId);
	});

	// Exécuter une première fois au démarrage
	checkAndSendReminders(userId).catch((error) => {
		console.error(
			'Erreur lors du démarrage initial du service de relance:',
			error
		);
	});
}
