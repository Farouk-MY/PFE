import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { Utilisateur } from '@prisma/client';

interface ClientExportData {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    ville: string;
    codePostal: string;
    gouvernorat: string;
    inscritLe: Date;
    statut: string;
    soldePoints: number;
    commandesTotal: number;
    montantTotal: number;
}

export const generatePDF = async (
    clients: any[],
    filePath: string
): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
            });

            // Setup the PDF stream
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Add logo placeholder or company info at the top
            doc.fontSize(10).fillColor('#666666').text('E-commerce Administration', { align: 'right' });
            doc.text(`Date d'exportation: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { align: 'right' });

            // Add title
            doc.moveDown(2);
            doc.fontSize(20).fillColor('#003366').text('Liste des Clients', { align: 'center' });
            doc.moveDown(1);

            // Add info text
            doc.fontSize(10).fillColor('#666666')
                .text(`Total clients: ${clients.length}`, { align: 'left' });
            doc.moveDown(1);

            // Create table header
            const tableTop = 170;
            const columnSpacing = 15;
            const tableWidth = doc.page.width - 100;

            // Define columns
            const columns = {
                id: { x: 50, width: 30 },
                name: { x: 80, width: 110 },
                contact: { x: 190, width: 130 },
                location: { x: 320, width: 140 },
                stats: { x: 460, width: 80 }
            };

            // Draw table header
            doc.fontSize(10).fillColor('#ffffff');
            doc.rect(50, tableTop - 15, tableWidth, 20).fill('#003366');
            doc.fillColor('#ffffff');

            doc.text('ID', columns.id.x, tableTop - 11);
            doc.text('Nom & Prénom', columns.name.x, tableTop - 11);
            doc.text('Contact', columns.contact.x, tableTop - 11);
            doc.text('Localisation', columns.location.x, tableTop - 11);
            doc.text('Points', columns.stats.x, tableTop - 11);

            // Draw line under header
            doc.moveTo(50, tableTop + 5).lineTo(50 + tableWidth, tableTop + 5).stroke('#cccccc');

            // Draw table rows
            let rowTop = tableTop + 10;
            let pageRowLimit = 20; // Approx number of rows per page
            let rowCounter = 0;

            clients.forEach((client, i) => {
                // Add a new page if needed
                if (rowCounter >= pageRowLimit) {
                    doc.addPage();
                    // Reset row position for new page
                    rowTop = 70;
                    rowCounter = 0;

                    // Add header on new page
                    doc.fontSize(10).fillColor('#666666').text('E-commerce Administration - Suite', { align: 'right' });
                    doc.moveDown(1);

                    // Draw table header on new page
                    doc.fontSize(10).fillColor('#ffffff');
                    doc.rect(50, rowTop - 15, tableWidth, 20).fill('#003366');
                    doc.fillColor('#ffffff');

                    doc.text('ID', columns.id.x, rowTop - 11);
                    doc.text('Nom & Prénom', columns.name.x, rowTop - 11);
                    doc.text('Contact', columns.contact.x, rowTop - 11);
                    doc.text('Localisation', columns.location.x, rowTop - 11);
                    doc.text('Points', columns.stats.x, rowTop - 11);

                    // Draw line under header
                    doc.moveTo(50, rowTop + 5).lineTo(50 + tableWidth, rowTop + 5).stroke('#cccccc');
                    rowTop += 10;
                }

                // Set alternating row background
                if (i % 2 === 0) {
                    doc.rect(50, rowTop - 5, tableWidth, 30).fill('#f5f5f5');
                }

                // Get client data
                const clientData = client.client || { soldePoints: 0 };

                doc.fontSize(9).fillColor('#333333');

                // ID
                doc.text(String(client.id), columns.id.x, rowTop);

                // Name
                doc.font('Helvetica-Bold');
                doc.text(`${client.nom} ${client.prenom}`, columns.name.x, rowTop);
                doc.font('Helvetica');

                // Contact
                doc.text(client.email, columns.contact.x, rowTop);
                doc.text(client.telephone, columns.contact.x, rowTop + 12);

                // Location
                const location = [
                    client.ville,
                    client.codePostal,
                    client.gouvernorat
                ].filter(Boolean).join(', ');
                doc.text(location, columns.location.x, rowTop);

                // Stats
                doc.text(`${clientData.soldePoints || 0} pts`, columns.stats.x, rowTop);

                // Move to next row
                rowTop += 30;
                rowCounter++;

                // Draw light line between rows
                doc.moveTo(50, rowTop - 5).lineTo(50 + tableWidth, rowTop - 5).stroke('#e0e0e0');
            });

            // Add footer with page numbers
            const totalPages = Math.ceil(clients.length / pageRowLimit);
            for (let i = 0; i < totalPages; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor('#666666')
                    .text(`Page ${i + 1} sur ${totalPages}`, 50, doc.page.height - 50, { align: 'center' });
            }

            // Finalize the PDF
            doc.end();

            stream.on('finish', () => {
                resolve();
            });

            stream.on('error', (err) => {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
};

export const prepareClientData = (
    clients: any[]
): ClientExportData[] => {
    return clients.map(client => {
        // Get client data if available
        const clientData = client.client || { soldePoints: 0 };

        // Calculate commands total and montant total
        let commandesTotal = 0;
        let montantTotal = 0;

        if (clientData.commande && Array.isArray(clientData.commande)) {
            commandesTotal = clientData.commande.length;
            montantTotal = clientData.commande.reduce((total: number, cmd: any) =>
                total + (cmd.montantAPayer || 0), 0);
        }

        return {
            id: client.id,
            nom: client.nom,
            prenom: client.prenom,
            email: client.email,
            telephone: client.telephone,
            ville: client.ville || '',
            codePostal: client.codePostal || '',
            gouvernorat: client.gouvernorat || '',
            inscritLe: client.inscritLe,
            statut: client.statut,
            soldePoints: clientData.soldePoints || 0,
            commandesTotal,
            montantTotal
        };
    });
};