import Papa from 'papaparse';
import { useState } from 'react';

type ImportCsvProps = {
	handleSave: (data: any) => Promise<void>;
	tableCols: string[];
};

const arraysMatch = (a?: string[], b?: string[]) => {
	if (a === undefined || b === undefined) return false;
	a.length === b.length && a.every((val, i) => val === b[i]);
};

export const useImportCsv = ({ handleSave, tableCols }: ImportCsvProps) => {
	const [error, setError] = useState<string | null>(null);
	const [isParsing, setIsParsing] = useState<boolean>(false);

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		try {
			setIsParsing(true);
			const file = event?.target?.files?.[0]; // Get the selected file
			if (!file) return;

			const content = await file.text();

			Papa.parse(content, {
				header: true, // Treat first row as header
				skipEmptyLines: true,

				complete: (result) => {
					if (!arraysMatch(result.meta.fields, tableCols)) {
						throw new Error('Invalid CSV format');
					}
					// console.log(result.data);
					// setData(result.data);
					handleSave(result.data);
				},
			});
			setIsParsing(false);
		} catch (error: unknown) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError('An error occured');
			}
		} finally {
			setIsParsing(false);
		}
	};
	// Should include save function as a init parameter, should send the data format as well, (col headers)
	// Expose functions to parse the data
	// This should validate and give errors if the data is not correct
	// Should save the data in the backend when the parsing is don
	// Should refresh when the saving is done.

	return { handleFileUpload, error, isParsing };
};
