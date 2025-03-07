import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, AlertCircle, Check, HelpCircle, Info } from 'lucide-react';
import { Receivable, Client } from '../../types/database';
import Papa from 'papaparse';

interface CSVImportModalProps {
	onClose: () => void;
	onImportSuccess: (importedCount: number) => void;
}
// Shanaka (Start)
const columnMapping: { [key: string]: string } = {
	// Numéro de facture
	invoice_number: 'facture',
	'numéro de facture': 'facture',
	'n° facture': 'facture',
	'n°facture': 'facture',
	'num facture': 'facture',
	invoice: 'facture',
	'invoice number': 'facture',
	facture: 'facture',
	'numero facture': 'facture',
	numéro: 'facture',
	ref: 'facture',
	référence: 'facture',
	reference: 'facture',

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
	montant: 'montant devise',
	'montant ht': 'montant devise',
	'montant ttc': 'montant devise',
	'montant devise': 'montant devise',
	prix: 'montant devise',
	total: 'montant devise',
	price: 'montant devise',
	'total amount': 'montant devise',
	somme: 'montant devise',

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
	"date d'échéance": 'échéance',
	'date echéance': 'échéance',
	"date d'echeance": 'échéance',
	'date échéance': 'échéance',
	'date echeance': 'échéance',
	échéance: 'échéance',
	echeance: 'échéance',
	'due date': 'échéance',
	deadline: 'échéance',
	'date limite': 'échéance',
	'date butoir': 'échéance',

	// Statut
	status: 'statut',
	état: 'statut',
	etat: 'statut',
	statut: 'statut',
	state: 'statut',

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
	'n° échéance': 'numéro échéance',
	'n°échéance': 'numéro échéance',
	'num échéance': 'numéro échéance',
	'numéro échéance': 'numéro échéance',
	'numero echeance': 'numéro échéance',
	installment: 'numéro échéance',
	'installment number': 'numéro échéance',
	'payment number': 'numéro échéance',
	'n° paiement': 'numéro échéance',

	//Date pièce
	'date pièce': 'date pièce',

	//Montant Réglé Devise
	'montant réglé devise': 'montant réglé devise',
};
// Shanaka (Finish)
export default function CSVImportModal({
	onClose,
	onImportSuccess,
}: CSVImportModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [data, setData] = useState<any[]>([]);
	//Shanaka (Start)
	const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
	//Shanaka (Finish)
	const [step, setStep] = useState<'upload' | 'preview' | 'importing'>(
		'upload'
	);
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

	// Colonnes attendues dans le CSV
	const expectedHeaders = [
		'Client',
		'Facture',
		'Montant devise',
		'Montant Réglé devise',
		'Date pièce',
		'Échéance',
		'Numéro échéance',
		'Statut',
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
						return columnMapping[h.toLowerCase().trim()];
					});
					// Shanaka (Finish)
					setCsvHeaders(cleanedHeaders);
					// Vérification du format des colonnes
					const missingHeaders = expectedHeaders.filter(
						(header) =>
							!cleanedHeaders.some(
								(h) => h.toLowerCase() === header.toLowerCase()
							)
					);

					if (missingHeaders.length > 0) {
						setError(
							`Le format du fichier est incorrect. Colonnes manquantes: ${missingHeaders.join(
								', '
							)}`
						);
						return;
					}

					const rows = result.data.slice(1) as string[][];
					setData(rows);
					generatePreview(cleanedHeaders, rows);
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

	const generatePreview = (headers: string[], rows: string[][]) => {
		try {
			// Trouver les indices des colonnes
			const clientIndex = headers.findIndex((h) =>
				h.toLowerCase().includes('client')
			);
			const invoiceIndex = headers.findIndex((h) =>
				h.toLowerCase().includes('facture')
			);
			const amountIndex = headers.findIndex(
				(h) =>
					h.toLowerCase().includes('montant') &&
					!h.toLowerCase().includes('réglé')
			);
			const paidAmountIndex = headers.findIndex((h) =>
				h.toLowerCase().includes('réglé')
			);
			const documentDateIndex = headers.findIndex((h) =>
				h.toLowerCase().includes('pièce')
			);
			const dueDateIndex = headers.findIndex(
				(h) =>
					h.toLowerCase().includes('échéance') &&
					!h.toLowerCase().includes('numéro')
			);
			const installmentNumberIndex = headers.findIndex((h) =>
				h.toLowerCase().includes('numéro échéance')
			);
			const statusIndex = headers.findIndex((h) =>
				h.toLowerCase().includes('statut')
			);

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

			const previewData: (Receivable & { client: Client })[] = rows
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
			const clientIndex = csvHeaders.findIndex((h) =>
				h.toLowerCase().includes('client')
			);
			const invoiceIndex = csvHeaders.findIndex((h) =>
				h.toLowerCase().includes('facture')
			);
			const amountIndex = csvHeaders.findIndex(
				(h) =>
					h.toLowerCase().includes('montant') &&
					!h.toLowerCase().includes('réglé')
			);
			const paidAmountIndex = csvHeaders.findIndex((h) =>
				h.toLowerCase().includes('réglé')
			);
			const documentDateIndex = csvHeaders.findIndex((h) =>
				h.toLowerCase().includes('pièce')
			);
			const dueDateIndex = csvHeaders.findIndex(
				(h) =>
					h.toLowerCase().includes('échéance') &&
					!h.toLowerCase().includes('numéro')
			);
			const installmentNumberIndex = csvHeaders.findIndex((h) =>
				h.toLowerCase().includes('numéro échéance')
			);
			const statusIndex = csvHeaders.findIndex((h) =>
				h.toLowerCase().includes('statut')
			);
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
