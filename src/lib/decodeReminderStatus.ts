export const decodeReminderStatus = (
	status: 'pre' | 'first' | 'second' | 'third' | 'final' | string
): string => {
	if (status === 'pre') return 'Pré-relance';
	if (status === 'first') return 'Relance 1';
	if (status === 'second') return 'Relance 2';
	if (status === 'third') return 'Relance 3';
	return 'Relance finale';
};
// This function takes a status string and returns a human-readable string.
