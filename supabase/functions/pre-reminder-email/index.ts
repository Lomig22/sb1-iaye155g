// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.10.0';

const sendDueEmails = async (transporter: any, receivables: any) => {
	// Get the correct email template, and the subject from the db
	for (const receivable of receivables) {
		if (receivable.email === undefined) return;
		await transporter.sendMail({
			from: Deno.env.get('EMAIL_USER') ?? '', // sender address
			to: receivable.email, // list of receivers
			subject: 'Hello ✔', // Subject line
			text: 'Hello world?', // plain text body
			html: '<b>Hello world?</b>', // html body
		});
	}
	// Return details of records that emails were sent to
};

const sendFirstReminders = async (transporter: any, receivables: any) => {
	// Return details of records that emails were sent to
};

const secondReminders = async (transporter: any, receivables: any) => {
	// Return details of records that emails were sent to
};

const thirdReminders = async (transporter: any, receivables: any) => {
	// Return details of records that emails were sent to
};

const finalReminders = async (transporter: any, receivables: any) => {
	// Return details of records that emails were sent to
};

const setupMailTransporter = () => {
	const host = Deno.env.get('EMAIL_HOST');
	const port = Deno.env.get('EMAIL_PORT');
	const user = Deno.env.get('EMAIL_USER');
	const pass = Deno.env.get('EMAIL_PASS');

	if (
		host === undefined ||
		port === undefined ||
		user === undefined ||
		pass === undefined
	) {
		throw new Error(
			'Email configuration is missing, Please contact the administrator'
		);
	}

	return nodemailer.createTransport({
		host: host,
		port: port,
		secure: true, // true for port 465, false for other ports
		auth: {
			user: user,
			pass: pass,
		},
	});
};

Deno.serve(async (req) => {
	// Go through the database receivables and fetch all records that are near the due date, let's say 1 day before
	// Send an email to the user with the reminder
	// Update the record with a reminder_sent_at timestamp
	try {
		const supabaseClient = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
		);

		const transporter = setupMailTransporter();

		// Send reminders to users who are closer to due date
		// Send reminders to clients who are due a reminder according to their reminder profile and have enabled reminders
		// After every reminder update the reminder history table with information about the reminder sent

		// const { data, error } = fetchAllClientsToSendReminders();
		const { data, error } = await supabaseClient
			.from('receivables')
			.select('*')();

		const dueReceivables = data.filter((receivable: any) => {
			const dueDate = new Date(receivable.due_date);
			const today = new Date();
			const diffTime = dueDate.getTime() - today.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays === 1;
		});

		if (error) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		await sendDueEmails(transporter, dueReceivables);

		return new Response(
			JSON.stringify({
				message: 'job ran successfully',
			}),
			{
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/pre-reminder-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
