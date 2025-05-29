import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { format } from 'date-fns';
import { Response } from 'express';
import fs from 'fs';

export const exportToCSV = async (clients: any[], res: Response, filePath: string): Promise<void> => {
    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            { id: 'id', title: 'ID' },
            { id: 'nom', title: 'Nom' },
            { id: 'prenom', title: 'Prénom' },
            { id: 'email', title: 'Email' },
            { id: 'telephone', title: 'Téléphone' },
            { id: 'ville', title: 'Ville' },
            { id: 'codePostal', title: 'Code Postal' },
            { id: 'gouvernorat', title: 'Gouvernorat' },
            { id: 'inscritLe', title: 'Date d\'inscription' },
            { id: 'statut', title: 'Statut' },
            { id: 'soldePoints', title: 'Solde Points' },
            { id: 'commandesTotal', title: 'Nombre de commandes' },
            { id: 'montantTotal', title: 'Montant total dépensé' },
        ],
        fieldDelimiter: ';'
    });

    const records = clients.map(user => {
        // Extract client data if available
        const clientData = user.client || { soldePoints: 0 };

        // Get commandes from client relation
        let commandesTotal = 0;
        let montantTotal = 0;

        if (clientData.commande && Array.isArray(clientData.commande)) {
            commandesTotal = clientData.commande.length;
            montantTotal = clientData.commande.reduce((total: number, cmd: any) =>
                total + (cmd.montantAPayer || 0), 0);
        } else if (clientData.historiqueAchats) {
            try {
                const historiqueAchats = typeof clientData.historiqueAchats === 'string'
                    ? JSON.parse(clientData.historiqueAchats)
                    : clientData.historiqueAchats;

                if (Array.isArray(historiqueAchats)) {
                    commandesTotal = historiqueAchats.length;
                    montantTotal = historiqueAchats.reduce((total: number, achat: any) =>
                        total + (achat.montant || 0), 0);
                }
            } catch (e) {
                console.error('Erreur de parsing historiqueAchats:', e);
            }
        }

        return {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            telephone: user.telephone,
            ville: user.ville || '',
            codePostal: user.codePostal || '',
            gouvernorat: user.gouvernorat || '',
            inscritLe: user.inscritLe ? format(new Date(user.inscritLe), 'dd/MM/yyyy') : '',
            statut: user.statut,
            soldePoints: clientData.soldePoints || 0,
            commandesTotal,
            montantTotal: montantTotal.toFixed(2),
        };
    });

    try {
        await csvWriter.writeRecords(records);
        return Promise.resolve();
    } catch (err) {
        console.error('Erreur lors de la génération du fichier CSV:', err);
        return Promise.reject(err);
    }
};