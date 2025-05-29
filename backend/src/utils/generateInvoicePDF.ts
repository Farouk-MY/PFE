import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

export const generateInvoicePDF = async (commande: any, client: any, panier: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        // Create a PDF with a blue theme
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            info: {
                Title: `Facture-${commande.id}`,
                Author: 'MediaSoft Tech',
            }
        });
        
        const buffers: Buffer[] = [];
        
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Set custom colors for a tech theme
        const colors = {
            primary: '#0066CC',     // Blue for headers and titles
            secondary: '#333333',   // Dark gray for main text
            accent: '#00AAFF',      // Light blue for accents
            light: '#F0F8FF',       // Very light blue for backgrounds
            highlight: '#FF6600'    // Orange for important values
        };

        generateHeader(doc, colors);
        generateCustomerInformation(doc, client, commande, colors);
        generateInvoiceTable(doc, panier, commande, colors);
        generatePaymentInformation(doc, commande, colors);
        generateFooter(doc, colors);

        doc.end();
    });
};

function generateHeader(doc: PDFKit.PDFDocument, colors: any) {
    // Add a colored banner at the top
    doc.rect(0, 0, doc.page.width, 100)
       .fill(colors.primary);
    
    // Add company logo and name
    doc.fillColor('#FFFFFF')  // White text on blue background
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('MediaSoft Tech', 50, 40)
       .fontSize(10)
       .font('Helvetica')
       .text('Innovations technologiques', 50, 70);
       
    // Company contact details on right side
    doc.fontSize(10)
       .text('123 Rue de Commerce', 400, 40, { align: 'right' })
       .text('Tunis, 1001', 400, 55, { align: 'right' })
       .text('support@mediasoft.tech', 400, 70, { align: 'right' })
       .text('+216 71 123 456', 400, 85, { align: 'right' });
    
    // Add a subtle tech pattern in the background
    for (let i = 0; i < 10; i++) {
        doc.circle(25 + (i * 15), 120, 2).fillOpacity(0.1).fill(colors.accent);
    }
}

function generateCustomerInformation(doc: PDFKit.PDFDocument, client: any, commande: any, colors: any) {
    doc.fillOpacity(1);
    
    // Facture heading with accent box
    doc.rect(50, 120, 150, 30).fill(colors.light);
    doc.fillColor(colors.primary)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('FACTURE', 60, 128);
       
    // Add QR code placeholder for digital verification
    doc.rect(470, 120, 80, 80)
       .lineWidth(1)
       .stroke(colors.secondary);
    doc.fontSize(8)
       .fillColor(colors.secondary)
       .text('Scan pour vérifier', 475, 203, { width: 70, align: 'center' });
    
    // Draw a nice separator
    generateFancyHr(doc, 160, colors);

    const customerInformationTop = 180;

    // Invoice information on left
    doc.fontSize(10)
       .fillColor(colors.secondary)
       .font('Helvetica-Bold')
       .text('N° Facture:', 50, customerInformationTop)
       .font('Helvetica')
       .text(commande.id.toString(), 150, customerInformationTop)
       .font('Helvetica-Bold')
       .text('Date:', 50, customerInformationTop + 20)
       .font('Helvetica')
       .text(formatDate(new Date()), 150, customerInformationTop + 20)
       .font('Helvetica-Bold')
       .text('Référence:', 50, customerInformationTop + 40)
       .font('Helvetica')
       .text(`INV-${commande.id}-${new Date().getFullYear()}`, 150, customerInformationTop + 40);
    
    // Customer information on right
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(colors.primary)
       .text('INFORMATIONS CLIENT', 300, customerInformationTop);
       
    doc.fontSize(10)
       .fillColor(colors.secondary)
       .font('Helvetica-Bold')
       .text('Nom:', 300, customerInformationTop + 20)
       .font('Helvetica')
       .text(`${client.utilisateur.prenom} ${client.utilisateur.nom}`, 400, customerInformationTop + 20)
       .font('Helvetica-Bold')
       .text('Email:', 300, customerInformationTop + 40)
       .font('Helvetica')
       .text(client.utilisateur.email, 400, customerInformationTop + 40)
       .font('Helvetica-Bold')
       .text('Téléphone:', 300, customerInformationTop + 60)
       .font('Helvetica')
       .text(client.utilisateur.telephone, 400, customerInformationTop + 60);
       
    // Add a status indicator
    const status = 'PAYÉE';
    const statusWidth = doc.widthOfString(status) + 20;
    doc.rect(50, customerInformationTop + 60, statusWidth, 20)
       .fill(colors.highlight);
    doc.fillColor('#FFFFFF')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(status, 60, customerInformationTop + 65);
    
    generateFancyHr(doc, 260, colors);
}

function generateInvoiceTable(doc: PDFKit.PDFDocument, panier: any, commande: any, colors: any) {
    let i;
    const invoiceTableTop = 280;
    
    // Table header with background
    doc.rect(50, invoiceTableTop - 10, 500, 30).fill(colors.primary);
    
    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold');
    
    generateTableRow(
        doc,
        invoiceTableTop,
        'Produit',
        'Quantité',
        'Prix Unitaire',
        'Total'
    );
    
    doc.font('Helvetica')
       .fillColor(colors.secondary);
    
    let position;
    
    // Add zebra striping for better readability
    for (i = 0; i < panier.lignePanier.length; i++) {
        position = invoiceTableTop + (i + 1) * 30;
        
        // Add light background for even rows
        if (i % 2 !== 0) {
            doc.rect(50, position - 10, 500, 30).fillOpacity(0.1).fill(colors.light);
            doc.fillOpacity(1);
        }
        
        const item = panier.lignePanier[i];
        
        generateTableRow(
            doc,
            position,
            item.produit.designation,
            item.qteCmd.toString(),
            `${item.prix.toFixed(2)} €`,
            `${item.sousTotal.toFixed(2)} €`
        );
    }

    const totalsTop = invoiceTableTop + (i + 1) * 30 + 10;
    
    // Add a summary section with a different background
    doc.rect(300, totalsTop - 10, 250, 100).fill(colors.light);
    
    doc.fillColor(colors.secondary);
    generateTableRow(
        doc,
        totalsTop,
        '',
        '',
        'Sous-total',
        `${commande.total.toFixed(2)} €`
    );

    generateTableRow(
        doc,
        totalsTop + 25,
        '',
        '',
        'Remise',
        `-${commande.remise.toFixed(2)} €`
    );

    generateTableRow(
        doc,
        totalsTop + 50,
        '',
        '',
        'Frais de livraison',
        `${commande.montantLivraison.toFixed(2)} €`
    );

    // Highlight total to pay
    doc.rect(300, totalsTop + 75, 250, 30).fill(colors.primary);
    doc.fillColor('#FFFFFF');
    
    generateTableRow(
        doc,
        totalsTop + 80,
        '',
        '',
        'TOTAL À PAYER',
        `${commande.montantAPayer.toFixed(2)} €`,
        true
    );
}

function generatePaymentInformation(doc: PDFKit.PDFDocument, commande: any, colors: any) {
    const paymentTop = 520;
    
    // Payment method section with styled heading
    doc.rect(50, paymentTop, 240, 30).fill(colors.primary);
    doc.fillColor('#FFFFFF')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('MÉTHODE DE PAIEMENT', 60, paymentTop + 8);

    doc.fillColor(colors.secondary);
    
    // Payment details
    if (commande.paiement) {
        const paymentMethod = commande.paiement.methode === 'carte' ? 'Carte bancaire' : 'Espèces';
        
        doc.rect(50, paymentTop + 40, 240, 30).fillOpacity(0.1).fill(colors.light);
        doc.fillOpacity(1);
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(paymentMethod, 60, paymentTop + 48);

        if (commande.paiement.methode === 'carte' && commande.paiement.detailsCarte) {
            const card = commande.paiement.detailsCarte;
            
            doc.fontSize(10)
               .font('Helvetica')
               .text(`Type: ${card.brand || 'Inconnu'}`, 60, paymentTop + 80)
               .text(`Derniers chiffres: **** **** **** ${card.last4 || '****'}`, 60, paymentTop + 95)
               .text(`Expiration: ${card.exp_month || '**'}/${card.exp_year || '****'}`, 60, paymentTop + 110);
        }
        
        // Add a status indicator
        const statusWidth = doc.widthOfString(commande.paiement.statut) + 20;
        doc.rect(60, paymentTop + 130, statusWidth, 20).fill(
            commande.paiement.statut === 'complété' ? '#00CC66' : colors.highlight
        );
        
        doc.fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text(commande.paiement.statut, 70, paymentTop + 135);
            
    } else {
        doc.rect(50, paymentTop + 40, 240, 80).fillOpacity(0.1).fill(colors.light);
        doc.fillOpacity(1);
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Espèces (à payer à la livraison)', 60, paymentTop + 48)
           .fontSize(10)
           .font('Helvetica')
           .text('Statut: En attente de paiement', 60, paymentTop + 70);
    }
    
    // Add a technical note or policy on the right side
    doc.rect(310, paymentTop, 240, 150).fillOpacity(0.1).fill(colors.light);
    doc.fillOpacity(1);
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(colors.primary)
       .text('POLITIQUE DE RETOUR', 330, paymentTop + 10)
       .font('Helvetica')
       .fillColor(colors.secondary)
       .fontSize(9)
       .text('Les produits technologiques non ouverts peuvent être retournés dans les 14 jours suivant la réception. Les logiciels et licences numériques ne peuvent pas être retournés une fois activés. Contactez notre support technique pour toute assistance.', 
            330, paymentTop + 30, { width: 200, align: 'left' });
            
    doc.font('Helvetica-Bold')
       .fillColor(colors.primary)
       .fontSize(10)
       .text('ASSISTANCE TECHNIQUE', 330, paymentTop + 90)
       .font('Helvetica')
       .fillColor(colors.secondary)
       .fontSize(9)
       .text('Pour toute question concernant vos produits, contactez notre équipe de support:', 
            330, paymentTop + 110, { width: 200, align: 'left' })
       .text('support@mediasoft.tech', 330, paymentTop + 130)
       .text('+216 71 123 456', 330, paymentTop + 145);
}

function generateFooter(doc: PDFKit.PDFDocument, colors: any) {
    // Add a tech-styled footer with company details
    doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill(colors.primary);
    
    // Center thank you message
    doc.fillColor('#FFFFFF')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Merci pour votre achat chez MediaSoft Tech', 0, doc.page.height - 35, { align: 'center' });
    
    // Add social media placeholder icons
    for (let i = 0; i < 4; i++) {
        doc.circle(doc.page.width - 120 + (i * 25), doc.page.height - 25, 8)
           .fillOpacity(0.8)
           .fill('#FFFFFF');
    }
    
    // Add website
    doc.fontSize(10)
       .text('www.mediasoft.tech', 50, doc.page.height - 30);
       
    // Add page number
    doc.text('Page 1/1', doc.page.width - 50, doc.page.height - 30, { align: 'right' });
    
    // Add unique invoice ID at the bottom
    doc.fontSize(8)
       .text(`ID: ${generateUniqueId()}`, doc.page.width / 2, doc.page.height - 15, { align: 'center' });
}

function generateTableRow(
    doc: PDFKit.PDFDocument,
    y: number,
    item: string,
    quantity: string,
    unitPrice: string,
    lineTotal: string,
    bold = false
) {
    if (bold) {
        doc.font('Helvetica-Bold');
    }
    
    doc.fontSize(10)
       .text(item, 60, y, { width: 190 })
       .text(quantity, 280, y, { width: 90, align: 'center' })
       .text(unitPrice, 370, y, { width: 90, align: 'right' })
       .text(lineTotal, 0, y, { align: 'right', width: 540 });
    
    if (bold) {
        doc.font('Helvetica');
    }
}

function generateFancyHr(doc: PDFKit.PDFDocument, y: number, colors: any) {
    // Create a gradient line
    doc.strokeColor(colors.primary)
       .lineWidth(1)
       .moveTo(50, y)
       .lineTo(550, y)
       .stroke();
       
    // Add dots for tech feeling
    for (let i = 0; i < 20; i++) {
        if (i % 4 === 0) {
            doc.circle(50 + (i * 25), y, 1.5).fill(colors.accent);
        }
    }
}

// Helper functions
function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function generateUniqueId(): string {
    return `INV-${Math.floor(Math.random() * 10000)}-${new Date().getTime().toString().slice(-6)}`;
}