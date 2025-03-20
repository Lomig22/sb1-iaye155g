import Papa from 'papaparse';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UnknownClient } from '../../types/database';
import { AlertCircle, Info, Loader2, Upload, X } from 'lucide-react';

type CSVImportProps = {
	onClose: () => void;
	onImportSuccess: (importedCount: number) => void;
	userId: string;
	unknownClientData: UnknownClient[];
};

interface CSVMapping {
	name: string;
	client_code: string;
	invoice_no: string;
	amount: string;
	paid_amount: string;
	due_date: string;
	document_date: string;
	status: string;
	date: string;
}

interface MappingField {
	field: keyof CSVMapping;
	label: string;
	required: boolean;
}

const formatDate = (dateStr: string): string | null => {
	if (!dateStr) return null;

	// Nettoyer la chaîne de date
	dateStr = dateStr.trim();

	// Essayer différents formats de date
	let date: Date | null = null;

	// Format DD/MM/YYYY ou DD/MM/YY
	if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(dateStr)) {
		const parts = dateStr.split(/[\/\-\.]/);
		// Si l'année est sur 2 chiffres, ajouter 20 devant (pour 20xx)
		const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
		date = new Date(
			`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
		);
	}
	// Format YYYY-MM-DD
	else if (/^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/.test(dateStr)) {
		date = new Date(dateStr);
	}
	// Format MM/DD/YYYY (US)
	else if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(dateStr)) {
		const parts = dateStr.split(/[\/\-\.]/);
		// Essayer d'abord comme MM/DD/YYYY
		date = new Date(
			`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
		);
	}

	if (date && !isNaN(date.getTime())) {
		return date.toISOString().split('T')[0];
	}

	return '';
};

const CSVImport = ({
	onClose,
	onImportSuccess,
	userId,
	unknownClientData,
}: CSVImportProps) => {
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<any[]>([]);
	const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
	const [, setImporting] = useState(false);
	const [importedCount, setImportedCount] = useState(0);
	const [step, setStep] = useState<
		'upload' | 'preview' | 'importing' | 'mapping'
	>('upload');
	const [mapping, setMapping] = useState<Record<string, keyof CSVMapping>>({});
	const [preview, setPreview] = useState<UnknownClient[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [savingSchema, setSavingSchema] = useState(false);
	const mappingFields: MappingField[] = [
		{ field: 'name', label: "Nom de l'entreprise", required: true },
		{ field: 'client_code', label: 'Code Client', required: true },
		{ field: 'invoice_no', label: 'Numéro de facture', required: true },
		{ field: 'amount', label: 'Montant', required: false },
		{ field: 'paid_amount', label: 'Montant réglé', required: false },
		{ field: 'due_date', label: "Date d'échéance", required: false },
		{ field: 'document_date', label: 'Date pièce', required: false },
		{ field: 'status', label: 'Statut', required: false },
		{ field: 'date', label: 'Date', required: false },
	];

	// Désactiver le défilement du body quand la modale est ouverte
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, []);

	const handleMapping = async (header: string[]) => {
		const autoMapping: Record<string, keyof CSVMapping> = {};
		const { data: savedMapping } = await supabase
			.from('profiles')
			.select('unknown_client_mapping')
			.eq('id', userId);
		if (
			savedMapping !== null &&
			savedMapping[0].unknown_client_mapping !== undefined &&
			savedMapping[0].unknown_client_mapping !== null
		) {
			const decodedMapping = JSON.parse(savedMapping[0].unknown_client_mapping);
			Object.entries(decodedMapping).forEach(([key, value]) => {
				autoMapping[key] = value as keyof CSVMapping;
			});
		} else {
			// columnMapping
			for (const col of header) {
				// const mappedColumn = columnMapping[col.trim().toLowerCase()];
				// if (mappedColumn !== undefined && mappedColumn !== null) {
				// 	autoMapping[col.trim().toLowerCase()] =
				// 		mappedColumn as keyof CSVMapping;
				// }
				autoMapping[col.trim().toLowerCase()] = col
					.trim()
					.toLowerCase() as keyof CSVMapping;
			}
		}
		setMapping(autoMapping);
		setStep('mapping');
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];
		if (!selectedFile) return;

		setFile(selectedFile);
		setError(null);

		Papa.parse(selectedFile, {
			complete: (result) => {
				if (result.data.length > 0) {
					const headers = result.data[0] as string[];
					// Shanaka (Start)
					const cleanedHeaders = headers.map((h) => {
						return h.toLowerCase().trim();
					});
					setCsvHeaders(cleanedHeaders);

					const rows = result.data.slice(1) as string[][];
					setData(rows);
					handleMapping(cleanedHeaders);
				}
			},
			header: false,
			skipEmptyLines: true,
			error: (error) => {
				setError(`Erreur lors de l'analyse du fichier: ${error.message}`);
			},
		});
	};

	const generatePreview = async () => {
		try {
			// First check if the required fields are present
			// SCV header has the header from the csv
			// Mapping has the csv -> to db mapping

			// Trouver les indices des colonnes
			const clientIndex = csvHeaders.findIndex((h) => mapping[h] === 'name');
			const invoiceIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'invoice_no'
			);
			const clientCodeIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'client_code'
			);
			const amountIndex = csvHeaders.findIndex((h) => mapping[h] === 'amount');
			const paidAmountIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'paid_amount'
			);
			const dueDateIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'due_date'
			);
			const documentDateIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'document_date'
			);
			const statusIndex = csvHeaders.findIndex((h) => mapping[h] === 'status');
			const dateIndex = csvHeaders.findIndex((h) => mapping[h] === 'date');

			if (clientIndex === -1 || invoiceIndex === -1 || clientCodeIndex === -1) {
				setError('Colonnes obligatoires manquantes dans le fichier CSV');
				return;
			}

			// Réinitialiser les nouveaux clients
			const previewData: UnknownClient[] = data
				.slice(0, 5)
				.map((row, index) => {
					// Récupérer les valeurs des colonnes
					const clientName = row[clientIndex] || '';
					const invoiceNumber = row[invoiceIndex] || '';
					const clientCode = row[clientCodeIndex] || '';
					const amount = row[amountIndex] || '0';
					const paidAmount = row[paidAmountIndex] || '0';
					const dueDate = formatDate(row[dueDateIndex] || '');
					const documentDate = formatDate(row[documentDateIndex] || '');
					const status = row[statusIndex] || '';
					const date = formatDate(row[dateIndex] || '');

					//shanaka (Finish)
					// Si le client n'est pas trouvé, créer un nouveau client temporaire

					return {
						id: `preview-${index}`,
						name: clientName,
						invoice_no: invoiceNumber,
						client_code: clientCode,
						owner_id: userId,
						amount: amount,
						paid_amount: paidAmount,
						due_date: dueDate,
						document_date: documentDate,
						status: status,
						date: date,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					} as UnknownClient;
				});
			setPreview(previewData);
			setStep('preview');
		} catch (error) {
			console.error("Erreur lors de la génération de l'aperçu:", error);
			setError("Impossible de générer l'aperçu");
		}
	};

	const importReceivables = async () => {
		setImporting(true);
		setStep('importing');
		setError(null);
		setImportedCount(0);

		try {
			// Trouver les indices des colonnes
			//Shanaka (Start)
			// Replaced the const header , with csvHeader from the state
			const clientIndex = csvHeaders.findIndex((h) => mapping[h] === 'name');
			const invoiceIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'invoice_no'
			);
			const clientCodeIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'client_code'
			);
			const amountIndex = csvHeaders.findIndex((h) => mapping[h] === 'amount');
			const paidAmountIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'paid_amount'
			);
			const dueDateIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'due_date'
			);
			const documentDateIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'document_date'
			);
			const statusIndex = csvHeaders.findIndex((h) => mapping[h] === 'status');
			const dateIndex = csvHeaders.findIndex((h) => mapping[h] === 'date');
			// Préparer les créances à importer
			const receivablesToImport = [];

			for (const row of data) {
				try {
					// Récupérer les valeurs des colonnes
					//Shanaka(Start)
					// Trimmed clientName
					const clientName = row[clientIndex].trim() || '';
					//Shanaka(Finish)
					const invoiceNumber = row[invoiceIndex] || '';
					const clientCode = row[clientCodeIndex] || '0';
					const amount = row[amountIndex] || '0';
					const paidAmount = row[paidAmountIndex] || '0';
					const dueDate = formatDate(row[dueDateIndex] || '');
					const documentDate = formatDate(row[documentDateIndex] || '');
					const status = row[statusIndex] || '';
					const date = formatDate(row[dateIndex] || '');

					// Vérifier que les données sont valides avant d'ajouter à la liste
					if (
						clientName !== null &&
						clientName !== undefined &&
						invoiceNumber !== null &&
						invoiceNumber !== undefined
					) {
						receivablesToImport.push({
							name: clientName,
							invoice_no: invoiceNumber,
							client_code: clientCode,
							owner_id: userId,
							amount: amount,
							paid_amount: paidAmount,
							due_date: dueDate,
							document_date: documentDate,
							status: status,
							date: date,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
						});
					}
				} catch (err) {
					console.error("Erreur lors du traitement d'une ligne:", err);
					// Continuer avec la ligne suivante
				}
			}

			// Importer les créances par lots de 20 pour éviter les problèmes de performance
			const batchSize = 20;
			let successCount = 0;
			let insertError = false;
			for (let i = 0; i < receivablesToImport.length; i += batchSize) {
				const batch = receivablesToImport.slice(i, i + batchSize);

				if (batch.length === 0) continue;

				try {
					const { data, error } = await supabase
						.from('unknown_client')
						.upsert(batch, {
							//Shanaka(Start)
							// Removed the extra on conflict statement
							onConflict: 'owner_id, client_code',
							//Shanaka(Finish)
							ignoreDuplicates: false,
						});

					if (error) {
						console.error("Erreur lors de l'import du lot:", error);
						// Continue with next batch instead of throwing
						insertError = true;
					} else {
						successCount += batch.length;
					}

					setImportedCount(successCount);
				} catch (err) {
					console.error("Exception lors de l'import du lot:", err);
					// Continue with next batch
					insertError = true;
				}
			}

			if (insertError) {
				throw new Error("Aucune créance n'a pu être importée");
			}
			// Delete lines that were not in the csv
			const prevItems = new Set(
				receivablesToImport.map(
					(item) => `${item.owner_id}-${item.client_code}`
				)
			);

			const missingReceivables = unknownClientData.filter(
				(item) => !prevItems.has(`${item.owner_id}-${item.client_code}`)
			);

			if (missingReceivables.length > 0) {
				try {
					await supabase
						.from('unknown_client')
						.delete()
						.in(
							'id',
							missingReceivables.map((item) => item.id)
						);
				} catch (err) {
					console.error(
						'Erreur lors de la suppression des créances manquantes:',
						err
					);
				}
			}

			if (successCount > 0) {
				onImportSuccess(successCount);
			} else {
				throw new Error("Aucune créance n'a pu être importée");
			}
		} catch (error: any) {
			console.error("Erreur lors de l'import des créances:", error);
			setError(error.message || "Erreur lors de l'import des créances");
			setStep('preview'); // Return to preview step on error
		} finally {
			setImporting(false);
		}
	};

	const resetForm = () => {
		setFile(null);
		setData([]);
		setStep('upload');
		setError(null);
		setPreview([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const saveMapping = async () => {
		try {
			setSavingSchema(true);
			await supabase
				.from('profiles')
				.update({ unknown_client_mapping: JSON.stringify(mapping) })
				.eq('id', userId);
			setSavingSchema(false);
		} catch (err) {
			console.error(
				'Erreur lors de la suppression des créances manquantes:',
				err
			);
			setSavingSchema(false);
		}
	};
	const handleMappingChange = (
		header: string,
		field: keyof CSVMapping | ''
	) => {
		if (field === '') {
			const newMapping = { ...mapping };
			delete newMapping[header];
			setMapping(newMapping);
		} else {
			setMapping({ ...mapping, [header]: field });
		}
	};
	return (
		<div className='fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto'>
			<div className='min-h-screen py-8 px-4 flex items-center justify-center'>
				<div className='relative bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl mx-auto'>
					<button
						onClick={onClose}
						className='absolute top-4 right-4 text-gray-400 hover:text-gray-600'
					>
						<X className='h-6 w-6' />
					</button>

					<h2 className='text-2xl font-bold mb-6'>
						Importer des clients inconnus à partir d'un CSV
					</h2>

					{error && (
						<div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center'>
							<AlertCircle className='h-5 w-5 mr-2 flex-shrink-0' />
							<span>{error}</span>
						</div>
					)}

					{step === 'upload' && (
						<div className='space-y-6'>
							<div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center'>
								<Upload className='mx-auto h-12 w-12 text-gray-400 mb-4' />
								<p className='text-gray-600 mb-4'>
									Glissez-déposez votre fichier CSV ici ou cliquez pour
									sélectionner un fichier
								</p>
								<input
									type='file'
									accept='.csv'
									onChange={handleFileUpload}
									className='hidden'
									ref={fileInputRef}
								/>
								<button
									onClick={() => fileInputRef.current?.click()}
									className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
								>
									Sélectionner un fichier
								</button>
							</div>

							<div className='bg-blue-50 p-4 rounded-md'>
								<div className='flex items-start'>
									<Info className='h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0' />
									<div>
										<p className='text-blue-800 font-medium mb-2'>
											Format attendu
										</p>
										<p className='text-blue-700 text-sm'>
											Le fichier CSV doit contenir une ligne d'en-tête avec les
											noms des colonnes suivantes:
										</p>
										<p className='text-blue-700 text-sm mt-2'>
											* Les colonnes marquées d'un astérisque sont obligatoires.
										</p>
										<p className='text-blue-700 text-sm mt-2'>
											<strong>Note:</strong> Si un client n'existe pas dans
											votre liste, il sera automatiquement créé lors de
											l'import.
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
					{step === 'mapping' && (
						<div className='space-y-6'>
							<div className='flex justify-between items-center'>
								<p className='text-gray-600'>
									Fichier : <span className='font-medium'>{file?.name}</span>
								</p>
								<button
									onClick={resetForm}
									className='text-blue-600 hover:text-blue-800 text-sm'
								>
									Changer de fichier
								</button>
							</div>
							<div className='bg-gray-50 p-4 rounded-md mb-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									{csvHeaders.map((header, index) => (
										<div key={index} className='flex items-center space-x-2'>
											<div
												className='w-1/2 font-medium truncate'
												title={header}
											>
												{header}
											</div>
											<select
												value={mapping[header] || ''}
												onChange={(e) =>
													handleMappingChange(
														header,
														e.target.value as keyof CSVMapping | ''
													)
												}
												disabled={savingSchema}
												className='w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
											>
												<option value=''>Ne pas importer</option>
												{mappingFields.map((field) => (
													<option
														key={field.field}
														value={field.field}
														disabled={
															Object.values(mapping).includes(field.field) &&
															mapping[header] !== field.field
														}
													>
														{field.label}
														{field.required ? ' *' : ''}
													</option>
												))}
											</select>
										</div>
									))}
								</div>
							</div>

							<div className='flex justify-between space-x-4'>
								<div className='flex gap-4'>
									<button
										onClick={saveMapping}
										className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex'
										disabled={savingSchema}
									>
										{savingSchema && <Loader2 className='animate-spin' />}
										Sauvegarder
									</button>
									<button
										onClick={() => setMapping({})}
										className='px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 transition-colors flex'
										disabled={savingSchema}
									>
										Réinitialiser
									</button>
								</div>
								<div className='flex gap-4'>
									<button
										onClick={resetForm}
										disabled={savingSchema}
										className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
									>
										Annuler
									</button>
									<button
										onClick={generatePreview}
										disabled={savingSchema}
										className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
									>
										Aperçu
									</button>
								</div>
							</div>
						</div>
					)}

					{step === 'preview' && (
						<div className='space-y-6'>
							<div className='flex justify-between items-center'>
								<p className='text-gray-600'>
									Aperçu des 5 premières créances (sur {data.length})
								</p>
								<button
									onClick={resetForm}
									className='text-blue-600 hover:text-blue-800 text-sm'
								>
									Changer de fichier
								</button>
							</div>
							<div className='overflow-x-auto'>
								<table className='min-w-full divide-y divide-gray-200'>
									<thead className='bg-gray-50'>
										<tr>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												nom
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												numéro de facture
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												code client
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Montant
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Montant payé
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Date pièce
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Date d'échéance
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												status
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Date
											</th>
										</tr>
									</thead>
									<tbody className='bg-white divide-y divide-gray-200'>
										{preview.map((receivable, index) => (
											<tr key={index}>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.name}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.invoice_no}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.client_code}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.amount}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.paid_amount}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.document_date}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.due_date}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.status}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.date}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className='flex justify-end space-x-4'>
								<button
									onClick={resetForm}
									className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
								>
									Annuler
								</button>
								<button
									onClick={importReceivables}
									className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'
								>
									Importer {data.length} clients
								</button>
							</div>
						</div>
					)}

					{step === 'importing' && (
						<div className='text-center py-8'>
							<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
							<p className='text-lg font-medium'>
								Importation en cours... {importedCount} / {data.length}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CSVImport;
