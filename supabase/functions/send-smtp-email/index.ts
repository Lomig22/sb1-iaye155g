import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import nodemailer from 'npm:nodemailer@6.10.0';

// Types pour la requête
interface EmailSettings {
	provider_type: string;
	smtp_username: string;
	smtp_password: string;
	smtp_server: string;
	smtp_port: number;
	smtp_encryption: string;
	email_signature?: string;
}

interface EmailRequest {
	settings: EmailSettings;
	to: string;
	subject: string;
	html: string;
}

serve(async (req) => {
	try {
		// Activer CORS
		if (req.method === 'OPTIONS') {
			return new Response('ok', {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Allow-Headers':
						'authorization, x-client-info, apikey, content-type',
				},
			});
		}

		const data = await req.json();
		const { settings, to, subject, html } = data.list[0] as EmailRequest;

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

		const transporter = nodemailer.createTransport({
			host: host,
			port: port,
			secure: true, // true for port 465, false for other ports
			auth: {
				user: user,
				pass: pass,
			},
		});

		await transporter.sendMail({
			from: Deno.env.get('EMAIL_USER') ?? '', // sender address
			to: to, // list of receivers
			subject: subject, // Subject line
			text: html, // plain text body
			html: html, // html body
		});

		// await client.send({
		// 	from: settings.smtp_username,
		// 	to: to,
		// 	subject: subject,
		// 	content: html,
		// 	html: html,
		// });

		return new Response(JSON.stringify({ success: true }), {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
			status: 200,
		});
	} catch (error) {
		console.error("Erreur lors de l'envoi de l'email:", error);

		return new Response(
			JSON.stringify({
				success: false,
				error: error.message || "Erreur lors de l'envoi de l'email",
			}),
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
				status: 500,
			}
		);
	}
});
