export const stringCompare = (
	a: string,
	b: string,
	operation: 'asc' | 'desc' | 'none'
) => {
	if (operation === 'none') return 0;
	const result = a.localeCompare(b);
	if (operation === 'asc') {
		return result;
	} else {
		return result * -1;
	}
};

export const numberCompare = (
	a: number,
	b: number,
	operation: 'asc' | 'desc' | 'none'
) => {
	if (operation === 'none') return 0;
	const result = a === b ? 0 : a > b ? 1 : -1;
	if (operation === 'asc') {
		return result;
	} else {
		return result * -1;
	}
};

export const dateCompare = (
	a: string,
	b: string,
	operation: 'asc' | 'desc' | 'none'
) => {
	if (operation === 'none') return 0;
	const dateA = new Date(a).getTime();
	const dateB = new Date(b).getTime();

	const result = dateA === dateB ? 0 : dateA > dateB ? 1 : -1;
	if (operation === 'asc') {
		return result;
	} else {
		return result * -1;
	}
};

export const booleanCompare = (
	a: boolean,
	b: boolean,
	operation: 'asc' | 'desc' | 'none'
) => {
	if (operation === 'none') return 0;
	if (a && !b) return operation === 'asc' ? -1 : 1;
	if (!a && b) return operation === 'asc' ? 1 : -1;
	return 0;
};
