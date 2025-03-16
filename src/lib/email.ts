interface EmailSettings {
	provider_type: string;
	smtp_username: string;
	smtp_password: string;
	smtp_server: string;
	smtp_port: number;
	smtp_encryption: string;
	email_signature?: string;
}

export const sendEmail = async (
	settings: EmailSettings,
	to: string,
	subject: string,
	htmlContent: string
): Promise<boolean> => {
	try {
		const auth_data = localStorage.getItem('paymentflow-auth');
		if (auth_data) {
			const access_token = JSON.parse(auth_data).access_token;
			const res = await fetch(
				'https://rsomeerndudkhyhpigmn.supabase.co/functions/v1/send-smtp-email',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${access_token}`,
					},
					body: JSON.stringify({
						list: [
							{
								settings,
								to,
								subject,
								html: `
			      <!DOCTYPE html>
			      <html>
			        <head>
			          <meta charset="utf-8">
			          <title>${subject}</title>
			        </head>
			        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
			          <div style="max-width: 600px; margin: 0 auto;">
			            ${htmlContent}
			            ${
										settings.email_signature
											? `
			              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
			                ${settings.email_signature}
			              </div>
			            `
											: ''
									}
			          </div>
			        </body>
			      </html>
			    `,
							},
						],
					}),
				}
			);
			const data = await res.json();
			const error = data?.failures;
			if (error) {
				console.error('Erreur Supabase Edge Function:', error);
				throw error;
			}

			if (!data?.success) {
				throw new Error(data?.error || "Échec de l'envoi de l'email");
			}

			return true;
		}
		return false;
	} catch (error) {
		console.error("Erreur lors de l'envoi de l'email:", error);
		throw error;
	}
};
