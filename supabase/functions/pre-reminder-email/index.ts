// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
	// Go through the database receivables and fetch all records that are near the due date, let's say 1 day before
	// Send an email to the user with the reminder
	// Update the record with a reminder_sent_at timestamp

	const supabaseClient = createClient(
		Deno.env.get('SUPABASE_URL') ?? '',
		Deno.env.get('SUPABASE_ANON_KEY') ?? ''
	);

	// Get the session or user object
	// const authHeader = req.headers.get('Authorization')!;
	// const token = authHeader.replace('Bearer ', '');
	// const { data, error } = await supabaseClient.auth.getUser(token);

	// const user = data.user;
	// const { data, error } = fetchAllClientsToSendReminders();
	const { data, error } = await supabaseClient.from('receivables').select('*');
	if (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return new Response(JSON.stringify(data), {
		headers: { 'Content-Type': 'application/json' },
	});
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/pre-reminder-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
