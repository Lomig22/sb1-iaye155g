export interface Client {
	id: string;
	company_name: string;
	email: string;
	phone?: string;
	address?: string;
	postal_code?: string;
	city?: string;
	country?: string;
	industry?: string;
	website?: string;
	needs_reminder: boolean;
	reminder_delay_1?: number;
	reminder_delay_2?: number;
	reminder_delay_3?: number;
	reminder_delay_final?: number;
	reminder_template_1?: string;
	reminder_template_2?: string;
	reminder_template_3?: string;
	reminder_template_final?: string;
	created_at: string;
	updated_at: string;
	owner_id: string;
	client_code: string;
}

export interface Receivable {
	id: string;
	client_id: string;
	management_number?: string; // Numéro dans gestion
	invoice_number: string;
	code?: string; // Code
	amount: number;
	paid_amount?: number; // Montant réglé
	document_date?: string; // Date pièce
	due_date: string;
	status: 'pending' | 'reminded' | 'paid' | 'late' | 'legal';
	invoice_pdf_url?: string;
	installment_number?: string; // Numéro échéance
	owner_id: string;
	created_at: string;
	updated_at: string;
}

export interface Reminder {
	id: string;
	receivable_id: string;
	reminder_date: string;
	reminder_type: 'first' | 'second' | 'third' | 'final' | 'legal';
	email_sent: boolean;
	email_content?: string;
	created_at: string;
}
