export const dateDiff = (date1: Date, date2: Date): number => {
	const diffTime = Math.abs(date2.getTime() - date1.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
