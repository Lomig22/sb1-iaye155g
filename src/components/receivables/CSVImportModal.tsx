import React, { useState, useRef, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, AlertCircle, Info, Loader2 } from 'lucide-react';
import { Receivable, Client } from '../../types/database';
import Papa from 'papaparse';
import { MappingField } from '../clients/CSVImportModal';

interface CSVImportModalProps {
	onClose: () => void;
	onImportSuccess: (importedCount: number) => void;
	receivables: (Receivable & { client: Client })[];
}
interface MappingField {
	field: keyof CSVMapping;
	label: string;
	required: boolean;
}

interface CSVMapping {
	client: string;
	invoice_number: string;
	amount: string;
	paid_amount: string | null;
	due_date: string;
	status: string | null;
	document_date: string | null;
	installment_number: string | null;
	management_number: string | null;
	code: string | null;
	created_at: string | null;
	updated_at: string | null;
}

const mappingFields: MappingField[] = [
	{ field: 'client', label: 'Client', required: true },
	{ field: 'invoice_number', label: 'Facture', required: true },
	{ field: 'amount', label: 'Montant', required: true },
	{ field: 'paid_amount', label: 'Montant réglé', required: true },
	{ field: 'due_date', label: "Date d'échéance", required: false },
	{ field: 'status', label: 'Statut', required: false },
	{ field: 'document_date', label: 'Date pièce', required: false },
	{ field: 'installment_number', label: "Numéro d'échéance", required: false },
	{ field: 'management_number', label: 'Numéro dans gestion', required: false },
	{ field: 'code', label: 'Code', required: false },
];

// Shanaka (Start)
const columnMapping: { [key: string]: string } = {
	// Numéro de facture
	invoice_number: 'invoice_number',
	'numéro de facture': 'invoice_number',
	'n° facture': 'invoice_number',
	'n°facture': 'invoice_number',
	'num facture': 'invoice_number',
	invoice: 'invoice_number',
	'invoice number': 'invoice_number',
	facture: 'invoice_number',
	'numero facture': 'invoice_number',
	numéro: 'invoice_number',
	ref: 'invoice_number',
	référence: 'invoice_number',
	reference: 'invoice_number',

	// Numéro dans gestion
	'n° gestion': 'management_number',
	'n° dans gestion': 'management_number',
	'n°gestion': 'management_number',
	'num gestion': 'management_number',
	'numéro gestion': 'management_number',
	'numero gestion': 'management_number',
	'ref gestion': 'management_number',
	'référence gestion': 'management_number',
	'reference gestion': 'management_number',
	'management number': 'management_number',
	management_number: 'management_number',
	'internal ref': 'management_number',
	'internal reference': 'management_number',
	// Code
	code: 'code',
	'code facture': 'code',
	'code client': 'code',
	'code référence': 'code',
	'code reference': 'code',
	'invoice code': 'code',
	'ref code': 'code',

	// Montant
	montant: 'amount',
	'montant ht': 'amount',
	'montant ttc': 'amount',
	'montant devise': 'amount',
	prix: 'amount',
	total: 'amount',
	price: 'amount',
	'total amount': 'amount',
	amount: 'amount',
	somme: 'amount',

	// Montant réglé
	'montant réglé': 'paid_amount',
	'montant regle': 'paid_amount',
	'montant payé': 'paid_amount',
	'montant paye': 'paid_amount',
	réglé: 'paid_amount',
	regle: 'paid_amount',
	payé: 'paid_amount',
	paye: 'paid_amount',
	paid: 'paid_amount',
	paid_amount: 'paid_amount',
	payment: 'paid_amount',

	// Date d'échéance
	"date d'échéance": 'due_date',
	'date echéance': 'due_date',
	"date d'echeance": 'due_date',
	'date échéance': 'due_date',
	'date echeance': 'due_date',
	échéance: 'due_date',
	echeance: 'due_date',
	'due date': 'due_date',
	due_date: 'due_date',
	deadline: 'due_date',
	'date limite': 'due_date',
	'date butoir': 'due_date',

	// Statut
	status: 'status',
	état: 'status',
	etat: 'status',
	statut: 'status',
	state: 'status',

	// Client
	client: 'client',
	client_id: 'client',
	'nom client': 'client',
	'nom du client': 'client',
	'raison sociale': 'client',
	société: 'client',
	societe: 'client',
	entreprise: 'client',
	customer: 'client',
	'customer name': 'client',
	company: 'client',
	'company name': 'client',
	'nom (client)': 'client',

	// Numéro d'échéance
	'n° échéance': 'installment_number',
	'n°échéance': 'installment_number',
	'num échéance': 'installment_number',
	'numéro échéance': 'installment_number',
	'numero echeance': 'installment_number',
	installment: 'installment_number',
	installment_number: 'installment_number',
	'installment number': 'installment_number',
	'payment number': 'installment_number',
	'n° paiement': 'installment_number',

	//Date pièce
	'date pièce': 'document_date',
	document_date: 'document_date',

	//Montant Réglé Devise
	'montant réglé devise': 'paid_amount',
};
// Shanaka (Finish)
export default function CSVImportModal({
	onClose,
	onImportSuccess,
	receivables,
}: CSVImportModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [data, setData] = useState<any[]>([]);
	//Shanaka (Start)
	const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
	//Shanaka (Finish)
	const [step, setStep] = useState<
		'upload' | 'preview' | 'importing' | 'mapping'
	>('upload');
	const [error, setError] = useState<string | null>(null);
	const [preview, setPreview] = useState<(Receivable & { client: Client })[]>(
		[]
	);
	const [importing, setImporting] = useState(false);
	const [importedCount, setImportedCount] = useState(0);
	const [clients, setClients] = useState<Client[]>([]);
	const [clientMap, setClientMap] = useState<Record<string, Client>>({});
	const [newClients, setNewClients] = useState<Record<string, Client>>({});
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [mapping, setMapping] = useState<Record<string, keyof CSVMapping>>({});
	const [savingSchema, setSavingSchema] = useState(false);

	// Colonnes attendues dans le CSV
	const expectedHeaders = [
		'Client',
		'Facture',
		'Montant devise',
		'Montant Réglé devise',
	];

	// Désactiver le défilement du body quand la modale est ouverte
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, []);

	// Charger les clients au montage
	useEffect(() => {
		fetchClients();
	}, []);

	const fetchClients = async () => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Utilisateur non authentifié');

			const { data, error } = await supabase
				.from('clients')
				.select('*')
				.eq('owner_id', user.id)
				.order('company_name');

			if (error) throw error;

			setClients(data || []);

			// Créer un map pour un accès rapide par ID et par nom d'entreprise
			const map: Record<string, Client> = {};
			data?.forEach((client) => {
				map[client.id] = client;
				// Ajouter aussi une entrée avec le nom d'entreprise en minuscules pour faciliter la recherche
				map[client.company_name.toLowerCase()] = client;
			});
			setClientMap(map);
		} catch (error) {
			console.error('Erreur lors du chargement des clients:', error);
			setError('Impossible de charger la liste des clients');
		}
	};

	const handleMapping = async (header: string[]) => {
		const headerMap = new Map(
			header.map((item) => [columnMapping[item], true])
		);
		const missingHeaders: string[] = [];
		for (const expected of expectedHeaders) {
			if (!headerMap.has(columnMapping[expected.toLowerCase().trim()])) {
				missingHeaders.push(expected);
			}
		}

		if (missingHeaders.length > 0) {
			setError(
				`Le fichier CSV doit contenir une colonne "${missingHeaders.join(
					','
				)}" pour importer les données`
			);
			return;
		}

		const autoMapping: Record<string, keyof CSVMapping> = {};
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) throw new Error('Utilisateur non authentifié');
		const { data: savedMapping } = await supabase
			.from('profiles')
			.select('receivables_mapping')
			.eq('id', user.id);
		if (savedMapping !== undefined && savedMapping !== null) {
			const decodedMapping = JSON.parse(savedMapping[0].receivables_mapping);

			Object.entries(decodedMapping).forEach(([key, value]) => {
				autoMapping[key] = value as keyof CSVMapping;
			});
		} else {
			// columnMapping
			for (const col of header) {
				const mappedColumn = columnMapping[col.trim().toLowerCase()];
				if (mappedColumn !== undefined && mappedColumn !== null) {
					autoMapping[col.trim().toLowerCase()] =
						mappedColumn as keyof CSVMapping;
				}
			}
		}
		setMapping(autoMapping);
		setStep('mapping');
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
					// Shanaka (Finish)
					setCsvHeaders(cleanedHeaders);
					// Vérification du format des colonnes
					// const missingHeaders = expectedHeaders.filter(
					// 	(header) =>
					// 		!cleanedHeaders.some((h) => {
					// 			return columnMapping[h].toLowerCase() === header.toLowerCase();
					// 		})
					// );

					// if (missingHeaders.length > 0) {
					// 	setError(
					// 		`Le format du fichier est incorrect. Colonnes manquantes: ${missingHeaders.join(
					// 			', '
					// 		)}`
					// 	);
					// 	return;
					// }

					const rows = result.data.slice(1) as string[][];
					setData(rows);
					//generatePreview(cleanedHeaders, rows);
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

		return null;
	};

	const getClientId = (clientIdentifier: string): string | null => {
		if (!clientIdentifier) return null;

		// Si c'est déjà un UUID valide
		if (
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
				clientIdentifier
			)
		) {
			const client = clients.find((c) => c.id === clientIdentifier);
			return client ? client.id : null;
		}

		// Chercher par nom d'entreprise exact (insensible à la casse)
		const clientKey = clientIdentifier.toLowerCase().trim();

		// Recherche directe dans le map
		if (clientMap[clientKey]) {
			return clientMap[clientKey].id;
		}

		// Chercher par correspondance exacte
		// Shanaka (Start)
		const exactMatch = clients.find(
			(c) => c.company_name.toLowerCase().trim() === clientKey
		);
		// Shanaka (Finish)

		if (exactMatch) {
			return exactMatch.id;
		}

		//Shanaka (Start)
		// Removed partial match as we need the exact match to get the correct client id to see if the client is new
		// Chercher par correspondance partielle
		const partialMatches = clients.filter((c) => {
			if (c.company_name === '') {
				return clientKey === '';
			}
			if (clientKey === '') {
				return c.company_name === '';
			}
			return (
				c.company_name.toLowerCase().includes(clientKey) ||
				clientKey.includes(c.company_name.toLowerCase())
			);
		});
		if (partialMatches.length === 1) {
			return partialMatches[0].id;
		}

		// Si plusieurs correspondances partielles, prendre la plus proche
		if (partialMatches.length > 1) {
			// Trier par longueur de nom d'entreprise (du plus court au plus long)
			partialMatches.sort(
				(a, b) => a.company_name.length - b.company_name.length
			);
			return partialMatches[0].id;
		}
		//Shanaka (Finish)

		// Recherche avec caractères spéciaux nettoyés
		const cleanClientKey = clientKey.replace(/[&@]/g, '').trim();
		if (cleanClientKey !== clientKey) {
			const cleanMatches = clients.filter(
				(c) =>
					c.company_name
						.toLowerCase()
						.replace(/[&@]/g, '')
						.includes(cleanClientKey) ||
					cleanClientKey.includes(
						c.company_name.toLowerCase().replace(/[&@]/g, '')
					)
			);
			if (cleanMatches.length === 1) {
				return cleanMatches[0].id;
			}

			if (cleanMatches.length > 1) {
				cleanMatches.sort(
					(a, b) => a.company_name.length - b.company_name.length
				);
				return cleanMatches[0].id;
			}
		}

		// Si c'est un nombre, essayer de trouver le client par index (pour les cas où le CSV contient des indices au lieu des noms)
		if (/^\d+$/.test(clientIdentifier)) {
			const index = parseInt(clientIdentifier, 10) - 1; // Ajuster pour l'indexation à base 0
			if (index >= 0 && index < clients.length) {
				return clients[index].id;
			}
		}

		// Recherche par nom partiel sans tenir compte des espaces et de la casse
		const normalizedKey = clientKey.replace(/\s+/g, '');
		const normalizedMatches = clients.filter((c) => {
			if (c.company_name === '') {
				return normalizedKey === '';
			}
			if (normalizedKey === '') {
				return c.company_name === '';
			}
			return (
				c.company_name
					.toLowerCase()
					.replace(/\s+/g, '')
					.includes(normalizedKey) ||
				normalizedKey.includes(c.company_name.toLowerCase().replace(/\s+/g, ''))
			);
		});
		if (normalizedMatches.length === 1) {
			return normalizedMatches[0].id;
		}

		if (normalizedMatches.length > 1) {
			normalizedMatches.sort(
				(a, b) => a.company_name.length - b.company_name.length
			);
			return normalizedMatches[0].id;
		}

		return null;
	};

	const mapStatus = (
		statusStr: string
	): 'pending' | 'reminded' | 'paid' | 'late' | 'legal' => {
		if (!statusStr) return 'pending';

		const statusLower = statusStr.toLowerCase();

		if (
			statusLower.includes('payé') ||
			statusLower.includes('paye') ||
			statusLower.includes('paid') ||
			statusLower.includes('réglé') ||
			statusLower.includes('regle')
		) {
			return 'paid';
		}

		if (
			statusLower.includes('relance') ||
			statusLower.includes('reminded') ||
			statusLower.includes('rappel')
		) {
			return 'reminded';
		}

		if (
			statusLower.includes('retard') ||
			statusLower.includes('late') ||
			statusLower.includes('overdue')
		) {
			return 'late';
		}

		if (
			statusLower.includes('legal') ||
			statusLower.includes('contentieux') ||
			statusLower.includes('juridique') ||
			statusLower.includes('avocat')
		) {
			return 'legal';
		}

		return 'pending';
	};

	const generatePreview = () => {
		try {
			// First check if the required fields are present
			// SCV header has the header from the csv
			// Mapping has the csv -> to db mapping

			// Trouver les indices des colonnes
			const clientIndex = csvHeaders.findIndex((h) => mapping[h] === 'client');
			const invoiceIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'invoice_number'
			);
			const amountIndex = csvHeaders.findIndex((h) => mapping[h] === 'amount');
			const paidAmountIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'paid_amount'
			);
			const documentDateIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'document_date'
			);
			const dueDateIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'due_date'
			);
			const installmentNumberIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'installment_number'
			);
			const statusIndex = csvHeaders.findIndex((h) => mapping[h] === 'status');
			if (
				clientIndex === -1 ||
				invoiceIndex === -1 ||
				amountIndex === -1 ||
				dueDateIndex === -1
			) {
				setError('Colonnes obligatoires manquantes dans le fichier CSV');
				return;
			}
			// Réinitialiser les nouveaux clients
			const newClientsMap: Record<string, Client> = {};
			const previewData: (Receivable & { client: Client })[] = data
				.slice(0, 5)
				.map((row, index) => {
					// Récupérer les valeurs des colonnes
					const clientName = row[clientIndex] || '';
					const invoiceNumber = row[invoiceIndex] || '';
					const amountStr = row[amountIndex] || '0';
					const paidAmountStr =
						paidAmountIndex !== -1 ? row[paidAmountIndex] : '';
					const documentDate =
						documentDateIndex !== -1
							? formatDate(row[documentDateIndex])
							: null;
					const dueDateStr = row[dueDateIndex] || '';
					const installmentNumber =
						installmentNumberIndex !== -1 ? row[installmentNumberIndex] : null;
					const statusStr = statusIndex !== -1 ? row[statusIndex] : '';
					// Nettoyer et convertir les valeurs
					const amount =
						parseFloat(amountStr.replace(/[^\d.,]/g, '').replace(',', '.')) ||
						0;
					const paidAmount = paidAmountStr
						? parseFloat(
								paidAmountStr.replace(/[^\d.,]/g, '').replace(',', '.')
						  ) || null
						: null;
					const dueDate =
						formatDate(dueDateStr) || new Date().toISOString().split('T')[0];
					const status = mapStatus(statusStr);
					// Trouver le client correspondant
					const clientId = getClientId(clientName);
					//shanaka (Start)
					// Check if the client is already in the new clients map
					const client = clientId
						? clientMap[clientId]
						: newClientsMap[`new-${clientName}`] ?? null;
					//shanaka (Finish)
					// Si le client n'est pas trouvé, créer un nouveau client temporaire
					if (!client) {
						// Générer un ID temporaire pour le nouveau client
						const tempId = `new-${clientName}`;
						// Créer un nouveau client avec le nom fourni
						const newClient: Client = {
							id: tempId,
							company_name: clientName,
							email: `${clientName
								.toLowerCase()
								.replace(/\s+/g, '.')}@example.com`, // Email temporaire
							needs_reminder: true,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
							owner_id: '', // Sera rempli lors de l'import
						};
						// Ajouter au map des nouveaux clients
						newClientsMap[tempId] = newClient;
						return {
							id: `preview-${index}`,
							client_id: tempId,
							invoice_number: invoiceNumber,
							amount,
							paid_amount: paidAmount,
							document_date: documentDate,
							due_date: dueDate,
							installment_number: installmentNumber,
							status,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
							client: newClient,
						} as Receivable & { client: Client };
					}
					return {
						id: `preview-${index}`,
						client_id: client.id,
						invoice_number: invoiceNumber,
						amount,
						paid_amount: paidAmount,
						document_date: documentDate,
						due_date: dueDate,
						installment_number: installmentNumber,
						status,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
						client: client,
					} as Receivable & { client: Client };
				});
			setNewClients(newClientsMap);
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
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Utilisateur non authentifié');

			// Trouver les indices des colonnes
			//Shanaka (Start)
			// Replaced the const header , with csvHeader from the state
			const clientIndex = csvHeaders.findIndex((h) => mapping[h] === 'client');
			const invoiceIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'invoice_number'
			);
			const amountIndex = csvHeaders.findIndex((h) => mapping[h] === 'amount');
			const paidAmountIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'paid_amount'
			);
			const documentDateIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'document_date'
			);
			const dueDateIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'due_date'
			);
			const installmentNumberIndex = csvHeaders.findIndex(
				(h) => mapping[h] === 'installment_number'
			);
			const statusIndex = csvHeaders.findIndex((h) => mapping[h] === 'status');
			//Shanaka (Finish)
			// Créer d'abord les nouveaux clients
			const createdClients: Record<string, string> = {}; // Map des IDs temporaires vers les vrais IDs

			for (const [tempId, newClient] of Object.entries(newClients)) {
				try {
					const { data: createdClient, error } = await supabase
						.from('clients')
						.insert([
							{
								//Shanaka(Start)
								// Trimmed the company_name
								company_name: newClient.company_name.trim(),
								//Shanaka(Finish)
								email: newClient.email,
								needs_reminder: true,
								owner_id: user.id,
							},
						])
						.select()
						.single();

					if (error) {
						console.error('Erreur lors de la création du client:', error);
						continue;
					}

					if (createdClient) {
						createdClients[tempId] = createdClient.id;
					}
				} catch (err) {
					console.error('Exception lors de la création du client:', err);
				}
			}

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
					const amountStr = row[amountIndex] || '0';
					const paidAmountStr =
						paidAmountIndex !== -1 ? row[paidAmountIndex] : '';
					const documentDate =
						documentDateIndex !== -1
							? formatDate(row[documentDateIndex])
							: null;
					const dueDateStr = row[dueDateIndex] || '';
					const installmentNumber =
						installmentNumberIndex !== -1 ? row[installmentNumberIndex] : null;
					const statusStr = statusIndex !== -1 ? row[statusIndex] : '';

					// Nettoyer et convertir les valeurs
					const amount =
						parseFloat(amountStr.replace(/[^\d.,]/g, '').replace(',', '.')) ||
						0;
					const paidAmount = paidAmountStr
						? parseFloat(
								paidAmountStr.replace(/[^\d.,]/g, '').replace(',', '.')
						  ) || null
						: null;
					const dueDate =
						formatDate(dueDateStr) || new Date().toISOString().split('T')[0];
					const status = mapStatus(statusStr);

					// Trouver le client correspondant
					let clientId = getClientId(clientName);

					// Si le client n'est pas trouvé, vérifier s'il a été créé
					if (!clientId) {
						// Chercher dans les clients nouvellement créés
						for (const [tempId, realId] of Object.entries(createdClients)) {
							const newClient = newClients[tempId];
							//Shanaka(Start)
							// Trimmed the company name
							if (newClient && newClient.company_name.trim() === clientName) {
								// Shanaka (Finish)
								clientId = realId;
								break;
							}
						}

						// Si toujours pas trouvé, créer un nouveau client à la volée
						if (!clientId) {
							try {
								// Créer un nouveau client
								const { data: newClient, error } = await supabase
									.from('clients')
									.insert([
										{
											company_name: clientName,
											email: `${clientName
												.toLowerCase()
												.replace(/\s+/g, '.')}@example.com`,
											needs_reminder: true,
											owner_id: user.id,
										},
									])
									.select()
									.single();

								if (error) {
									console.error(
										'Erreur lors de la création du client à la volée:',
										error
									);
									continue;
								}

								if (newClient) {
									clientId = newClient.id;
								} else {
									continue;
								}
							} catch (err) {
								console.error(
									'Exception lors de la création du client à la volée:',
									err
								);
								continue;
							}
						}
					}

					// Vérifier que les données sont valides avant d'ajouter à la liste
					if (clientId && invoiceNumber && amount > 0) {
						receivablesToImport.push({
							client_id: clientId,
							invoice_number: invoiceNumber,
							amount,
							paid_amount: paidAmount,
							document_date: documentDate,
							due_date: dueDate,
							installment_number: installmentNumber,
							status,
							owner_id: user.id,
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

			for (let i = 0; i < receivablesToImport.length; i += batchSize) {
				const batch = receivablesToImport.slice(i, i + batchSize);

				if (batch.length === 0) continue;

				try {
					const { data, error } = await supabase
						.from('receivables')
						.upsert(batch, {
							//Shanaka(Start)
							// Removed the extra on conflict statement
							onConflict: 'owner_id, invoice_number',
							//Shanaka(Finish)
							ignoreDuplicates: false,
						});

					if (error) {
						console.error("Erreur lors de l'import du lot:", error);
						// Continue with next batch instead of throwing
					} else {
						successCount += batch.length;
					}

					setImportedCount(successCount);
				} catch (err) {
					console.error("Exception lors de l'import du lot:", err);
					// Continue with next batch
				}
			}

			// Mettre à jour les clients pour activer les relances
			const clientIds = [
				...new Set(receivablesToImport.map((r) => r.client_id)),
			];
			if (clientIds.length > 0) {
				try {
					await supabase
						.from('clients')
						.update({ needs_reminder: true })
						.in('id', clientIds);
				} catch (err) {
					console.error('Erreur lors de la mise à jour des clients:', err);
				}
			}
			// Delete lines that were not in the csv
			const prevItems = new Set(
				receivablesToImport.map(
					(item) => `${item.owner_id}-${item.invoice_number}`
				)
			);

			const missingReceivables = receivables.filter(
				(item) => !prevItems.has(`${item.owner_id}-${item.invoice_number}`)
			);

			if (missingReceivables.length > 0) {
				try {
					await supabase
						.from('receivables')
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

	const saveMapping = async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) throw new Error('Utilisateur non authentifié');

		try {
			setSavingSchema(true);
			await supabase
				.from('profiles')
				.update({ receivables_mapping: JSON.stringify(mapping) })
				.eq('id', user.id);
			setSavingSchema(false);
		} catch (err) {
			console.error(
				'Erreur lors de la suppression des créances manquantes:',
				err
			);
			setSavingSchema(false);
		}
	};

	const resetForm = () => {
		setFile(null);
		setData([]);
		setStep('upload');
		setError(null);
		setPreview([]);
		setNewClients({});
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
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
						Import de créances depuis un fichier CSV
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
										<ul className='list-disc pl-5 text-blue-700 text-sm mt-1'>
											{expectedHeaders.map((header, index) => (
												<li
													key={index}
													className={index < 4 ? 'font-semibold' : ''}
												>
													{header}
													{index < 4 ? ' *' : ''}
												</li>
											))}
										</ul>
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
								{/* <div className='flex justify-between items-center mb-2'>
									<h3 className='font-medium'>Correspondance des colonnes</h3>
									<button
										onClick={() => setShowHelp(!showHelp)}
										className='text-blue-600 hover:text-blue-800 flex items-center text-sm'
									>
										<HelpCircle className='h-4 w-4 mr-1' />
										{showHelp ? "Masquer l'aide" : "Afficher l'aide"}
									</button>
								</div>

								{showHelp && (
									<div className='bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-700'>
										<p className='mb-2'>
											<span className='font-medium'>
												Correspondance des colonnes :
											</span>{' '}
											Associez chaque colonne de votre fichier CSV à un champ
											dans notre système.
										</p>
										<ul className='list-disc pl-5 space-y-1'>
											<li>
												<span className='font-medium'>
													Nom de l'entreprise et Email
												</span>{' '}
												sont obligatoires.
											</li>
											<li>
												Pour le champ{' '}
												<span className='font-medium'>
													Nécessite une relance
												</span>
												, les valeurs acceptées sont : "Oui", "OUI", "Yes", "1",
												"True", "Relance en cours".
											</li>
											<li>
												Pour les champs{' '}
												<span className='font-medium'>Créé le</span> et{' '}
												<span className='font-medium'>Mis à jour</span>,
												plusieurs formats de date sont acceptés.
											</li>
											<li>
												Les colonnes non mappées seront ignorées lors de
												l'import.
											</li>
										</ul>
									</div>
								)} */}

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
								<button
									onClick={saveMapping}
									className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex'
									disabled={savingSchema}
								>
									{savingSchema && <Loader2 className='animate-spin' />}
									Save Mapping
								</button>
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

							{Object.keys(newClients).length > 0 && (
								<div className='p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700'>
									<h3 className='font-medium mb-2 flex items-center'>
										<AlertCircle className='h-5 w-5 mr-2' />
										Nouveaux clients à créer ({Object.keys(newClients).length})
									</h3>
									<p className='text-sm mb-2'>
										Les clients suivants n'existent pas dans votre liste et
										seront créés automatiquement:
									</p>
									<ul className='list-disc pl-5 text-sm'>
										{Object.values(newClients).map((client, index) => (
											<li key={index}>{client.company_name}</li>
										))}
									</ul>
								</div>
							)}

							<div className='overflow-x-auto'>
								<table className='min-w-full divide-y divide-gray-200'>
									<thead className='bg-gray-50'>
										<tr>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Client
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Facture
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Montant devise
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Montant Réglé devise
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Date pièce
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Échéance
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Numéro échéance
											</th>
											<th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Statut
											</th>
										</tr>
									</thead>
									<tbody className='bg-white divide-y divide-gray-200'>
										{preview.map((receivable, index) => (
											<tr
												key={index}
												className={
													receivable.client_id.startsWith('new-')
														? 'bg-yellow-50'
														: ''
												}
											>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.client_id.startsWith('new-') ? (
														<span className='flex items-center'>
															<span className='font-medium text-yellow-600'>
																{receivable.client.company_name}
															</span>
															<span className='ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full'>
																Nouveau
															</span>
														</span>
													) : (
														receivable.client.company_name
													)}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.invoice_number}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{new Intl.NumberFormat('fr-FR', {
														style: 'currency',
														currency: 'EUR',
													}).format(receivable.amount)}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
													{receivable.paid_amount
														? new Intl.NumberFormat('fr-FR', {
																style: 'currency',
																currency: 'EUR',
														  }).format(receivable.paid_amount)
														: '-'}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-500'>
													{receivable.document_date
														? new Date(
																receivable.document_date
														  ).toLocaleDateString('fr-FR')
														: '-'}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-500'>
													{new Date(receivable.due_date).toLocaleDateString(
														'fr-FR'
													)}
												</td>
												<td className='px-4 py-3 whitespace-nowrap text-sm text-gray-500'>
													{receivable.installment_number || '-'}
												</td>
												<td className='px-4 py-3 whitespace-nowrap'>
													<span
														className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
															receivable.status === 'paid'
																? 'bg-green-100 text-green-800'
																: receivable.status === 'late'
																? 'bg-red-100 text-red-800'
																: receivable.status === 'reminded'
																? 'bg-yellow-100 text-yellow-800'
																: receivable.status === 'legal'
																? 'bg-purple-100 text-purple-800'
																: 'bg-gray-100 text-gray-800'
														}`}
													>
														{receivable.status === 'paid' && 'Payé'}
														{receivable.status === 'late' && 'En retard'}
														{receivable.status === 'reminded' && 'Relancé'}
														{receivable.status === 'pending' && 'En attente'}
														{receivable.status === 'legal' && 'Contentieux'}
													</span>
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
									Importer {data.length} créances
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
}
