import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import Stripe from 'stripe';
import { calculateDiscount, calculatePoints } from '../utils/pointsCalculator';
import { notifyAdminLowStock } from '../services/email.service';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia' as const
});

interface PointsValidationResult {
    valid: boolean;
    error?: string;
    discountAmount?: number;
    pointsUsed?: number;
}

const validatePointsUsage = (pointsToUse: number, clientPoints: number, totalAmount: number): PointsValidationResult => {
    const MIN_POINTS = 2000;
    const POINTS_PER_DISCOUNT = 2000;
    const DISCOUNT_PERCENT_PER_BLOCK = 10;
    const MAX_DISCOUNT_PERCENT = 50; // Max 50% discount

    if (pointsToUse < MIN_POINTS) {
        return { valid: false, error: `Minimum ${MIN_POINTS} points required to use this feature` };
    }

    if (pointsToUse % POINTS_PER_DISCOUNT !== 0) {
        return { valid: false, error: `Points must be in blocks of ${POINTS_PER_DISCOUNT}` };
    }

    if (pointsToUse > clientPoints) {
        return { valid: false, error: 'Not enough points available' };
    }

    const discountBlocks = pointsToUse / POINTS_PER_DISCOUNT;
    const discountPercent = Math.min(discountBlocks * DISCOUNT_PERCENT_PER_BLOCK, MAX_DISCOUNT_PERCENT);
    const discountAmount = totalAmount * (discountPercent / 100);

    return {
        valid: true,
        discountAmount,
        pointsUsed: pointsToUse
    };
};

export const validatePanierAndCreateCommande = async (req: Request, res: Response): Promise<void> => {
    const { panier_id, utiliserPoints, pointsToUse, paymentMethod, livrerDomicile, adresseLivraison } = req.body;

    // Input validation
    if (!panier_id || typeof panier_id !== 'number') {
        res.status(400).json({ error: 'Invalid or missing panier_id' });
        return;
    }
    if (paymentMethod !== 'espece' && paymentMethod !== 'carte') {
        res.status(400).json({ error: 'Invalid payment method. Must be "espece" or "carte"' });
        return;
    }
    if (livrerDomicile && !adresseLivraison) {
        res.status(400).json({ error: 'adresseLivraison is required when livrerDomicile is true' });
        return;
    }
    if (utiliserPoints && (typeof pointsToUse !== 'number' || pointsToUse <= 0)) {
        res.status(400).json({ error: 'Invalid points amount. Must be a positive number' });
        return;
    }

    try {
        // Fetch panier with necessary relations
        const panier = await prisma.panier.findUnique({
            where: { id: panier_id },
            include: {
                lignePanier: { include: { produit: true } },
                client: { include: { utilisateur: true } }
            }
        });

        if (!panier) {
            res.status(404).json({ error: 'Panier non trouvé' });
            return;
        }

        if (!panier.client) {
            res.status(400).json({ error: 'Client non associé au panier' });
            return;
        }

        // Check stock availability
        for (const ligne of panier.lignePanier) {
            if (!ligne.produit) {
                res.status(400).json({ error: `Produit non trouvé pour lignePanier ID ${ligne.id}` });
                return;
            }
            if (ligne.produit.qteStock < ligne.qteCmd) {
                res.status(400).json({ error: `Stock insuffisant pour le produit ${ligne.produit.designation}` });
                return;
            }
        }

        // Calculate points earned from this order
        const pointsGagnes = calculatePoints(panier);
        let remise = 0;
        let pointsUtilises = 0;

        if (utiliserPoints) {
            const validation = validatePointsUsage(pointsToUse, panier.client.soldePoints, panier.total);
            if (!validation.valid) {
                res.status(400).json({ error: validation.error });
                return;
            }

            // Fix for TypeScript error: Use default values to ensure they are numbers
            remise = validation.discountAmount || 0;
            pointsUtilises = validation.pointsUsed || 0;
        }

        const fraisLivraison = livrerDomicile ? 8 : 0;
        const totalAPayer = panier.total - remise + fraisLivraison;

        // Track products with low stock to notify admin after transaction
        const lowStockProducts: { qteStock: number; id: number; prix: number; designation: string; description: string | null; images: string[]; nbrPoint: number; seuilMin: number; deleted: boolean; }[] = [];

        // Create commande in a transaction
        const commande = await prisma.$transaction(async (prisma) => {
            // 1. Update product quantities
            for (const ligne of panier.lignePanier) {
                if (!ligne.produit) {
                    throw new Error(`Produit non trouvé pour lignePanier ID ${ligne.id}`);
                }
                if (ligne.produit.qteStock < ligne.qteCmd) {
                    throw new Error(`Stock insuffisant pour le produit ${ligne.produit.designation}`);
                }

                // Update product stock
                await prisma.produit.update({
                    where: { id: ligne.produit_id },
                    data: { qteStock: ligne.produit.qteStock - ligne.qteCmd }
                });

                // Check for low stock and collect for notification after transaction
                const newStockLevel = ligne.produit.qteStock - ligne.qteCmd;
                if (newStockLevel <= ligne.produit.seuilMin) {
                    lowStockProducts.push({...ligne.produit, qteStock: newStockLevel});
                }
            }

            // 2. Create commande
            const nouvelleCommande = await prisma.commande.create({
                data: {
                    panier_id: panier.id,
                    client_id: panier.client_id,
                    total: panier.total,
                    remise: remise,
                    pourcentageRemise: remise > 0 ? (remise / panier.total) * 100 : null,
                    montantPoint: pointsUtilises,
                    montantLivraison: fraisLivraison,
                    montantAPayer: totalAPayer,
                    dateLivraison: new Date(new Date().setDate(new Date().getDate() + 3)),
                    pointsGagnes: pointsGagnes,
                    pointsUtilises: pointsUtilises,
                    livraison: {
                        create: {
                            date: new Date(),
                            nomLivreur: "À assigner",
                            statutLivraison: 'en_attente',
                            detailPaiement: livrerDomicile ? adresseLivraison : 'Retrait en magasin'
                        }
                    }
                },
                include: {
                    livraison: true
                }
            });

            // 3. Update client points
            const currentClient = await prisma.client.findUnique({
                where: { id: panier.client_id },
                select: {
                    soldePoints: true,
                    historiqueAchats: true,
                    historiquePoints: true
                }
            });

            if (!currentClient) {
                throw new Error('Client non trouvé lors de la mise à jour des points');
            }

            const newSoldePoints = currentClient.soldePoints - pointsUtilises + pointsGagnes;

            const historiqueAchat = {
                date: new Date(),
                commandeId: nouvelleCommande.id,
                produits: panier.lignePanier.map(ligne => ({
                    produitId: ligne.produit_id,
                    designation: ligne.produit.designation,
                    quantite: ligne.qteCmd,
                    prixUnitaire: ligne.prix,
                    total: ligne.sousTotal
                })),
                total: nouvelleCommande.montantAPayer,
                pointsGagnes: pointsGagnes,
                pointsUtilises: pointsUtilises
            };

            const historiquePoint = {
                date: new Date(),
                type: pointsUtilises > 0 ? 'utilisation' : 'gain',
                points: pointsUtilises > 0 ? pointsUtilises : pointsGagnes,
                solde: newSoldePoints,
                commandeId: nouvelleCommande.id
            };

            const currentAchats = Array.isArray(currentClient.historiqueAchats) ?
                currentClient.historiqueAchats :
                JSON.parse(currentClient.historiqueAchats as string || '[]');

            const currentPoints = Array.isArray(currentClient.historiquePoints) ?
                currentClient.historiquePoints :
                JSON.parse(currentClient.historiquePoints as string || '[]');

            const updatedAchats = [...currentAchats, historiqueAchat];
            const updatedPoints = [...currentPoints, historiquePoint];

            await prisma.client.update({
                where: { id: panier.client_id },
                data: {
                    soldePoints: newSoldePoints,
                    historiqueAchats: updatedAchats,
                    historiquePoints: updatedPoints
                }
            });

            return nouvelleCommande;
        });

        // Make sure commande is defined before proceeding
        if (!commande) {
            res.status(500).json({ error: 'Erreur de création de la commande' });
            return;
        }

        // Send notifications for low stock products outside the transaction
        for (const product of lowStockProducts) {
            try {
                await notifyAdminLowStock(product);
                console.log(`Notification de stock faible envoyée pour produit ${product.id}: ${product.designation} (Stock: ${product.qteStock})`);
            } catch (emailError) {
                console.error(`Erreur lors de l'envoi de la notification de stock faible pour le produit ${product.id}:`, emailError);
                // Continue processing even if email fails
            }
        }

        // Process payment if carte
        if (paymentMethod === 'carte') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalAPayer * 100),
                currency: 'eur',
                metadata: { commande_id: commande.id },
                description: `Commande #${commande.id}`
            });

            await prisma.livraison.update({
                where: { id: commande.livraison[0].id },
                data: {
                    statutLivraison: "en_preparation"
                }
            });

            res.status(200).json({
                paymentRequired: true,
                redirectUrl: `/payment-form?clientSecret=${paymentIntent.client_secret}&commandeId=${commande.id}&amount=${paymentIntent.amount / 100}`
            });
        } else {
            res.status(200).json({
                paymentRequired: false,
                message: "Commande créée avec succès",
                commandeId: commande.id,
                factureUrl: `/api/commande/${commande.id}/facture`
            });
        }

    } catch (err) {
        console.error('Detailed error in validatePanierAndCreateCommande:', err);
        res.status(500).json({
            error: 'Erreur lors de la création de la commande',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    } finally {
        await prisma.$disconnect();
    }
};
export const downloadInvoice = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const commande = await prisma.commande.findUnique({
            where: { id: Number(id) },
            include: {
                client: { include: { utilisateur: true } },
                panier: {
                    include: {
                        lignePanier: { include: { produit: true } }
                    }
                },
                paiement: true,
                livraison: true
            }
        });

        if (!commande) {
            res.status(404).json({ error: 'Commande non trouvée' });
            return;
        }

        const pdfBuffer = await generateInvoicePDF(commande, commande.client, commande.panier);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=facture-${commande.id}.pdf`);
        res.send(pdfBuffer);

    } catch (err) {
        console.error('Error in downloadInvoice:', err);
        res.status(500).json({
            error: 'Erreur lors de la génération de la facture',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    } finally {
        await prisma.$disconnect();
    }
};

export const confirmLivraison = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { montant, methode, details } = req.body;

    if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: 'ID de commande invalide' });
        return;
    }

    if (!montant || !methode) {
        res.status(400).json({ error: 'Les champs montant et methode sont requis' });
        return;
    }

    try {
        const commande = await prisma.commande.findUnique({
            where: { id: Number(id) },
            include: { livraison: true }
        });

        if (!commande) {
            res.status(404).json({ error: 'Commande non trouvée' });
            return;
        }

        if (!commande.livraison || commande.livraison.length === 0) {
            res.status(400).json({ error: 'Aucune livraison associée à cette commande' });
            return;
        }

        await prisma.livraison.update({
            where: { id: commande.livraison[0].id },
            data: {
                statutLivraison: "livrée",
                date: new Date(),
                detailPaiement: `Paiement ${methode} reçu`,
                nomLivreur: details?.nomLivreur || "Non spécifié"
            }
        });

        if (methode === 'espece') {
            await prisma.paiement.create({
                data: {
                    montant: Number(montant),
                    methode: methode,
                    statut: "payé",
                    commande_id: Number(id),
                    date: new Date(),
                    detailsCarte: {}
                }
            });
        }

        res.status(200).json({
            message: 'Livraison confirmée avec succès',
            commandeId: id,
            livraisonId: commande.livraison[0].id
        });

    } catch (err) {
        console.error('Error in confirmLivraison:', err);
        res.status(500).json({
            error: 'Erreur lors de la confirmation de la livraison',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    } finally {
        await prisma.$disconnect();
    }
};

export const confirmCardPayment = async (req: Request, res: Response): Promise<void> => {
    const { commande_id, paymentIntentId } = req.body;

    // Ensure commande_id is a number
    if (!commande_id || isNaN(Number(commande_id))) {
        res.status(400).json({ error: 'ID de commande invalide ou manquant' });
        return;
    }

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['payment_method']
        });

        if (paymentIntent.status !== 'succeeded') {
            res.status(400).json({ error: 'Paiement non confirmé' });
            return;
        }

        const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;
        const cardDetails = paymentMethod?.card;

        // Convert commande_id to a number to satisfy TypeScript
        const commandeIdNumber = Number(commande_id);

        await prisma.paiement.create({
            data: {
                montant: paymentIntent.amount / 100,
                methode: 'carte',
                detailsCarte: cardDetails ? {
                    last4: cardDetails.last4 || '',
                    brand: cardDetails.brand || '',
                    exp_month: cardDetails.exp_month || 0,
                    exp_year: cardDetails.exp_year || 0
                } : {},
                statut: 'payé',
                commande_id: commandeIdNumber
            }
        });

        const commande = await prisma.commande.findUnique({
            where: { id: commandeIdNumber },
            include: {
                client: { include: { utilisateur: true } },
                panier: {
                    include: {
                        lignePanier: { include: { produit: true } }
                    }
                },
                paiement: true,
                livraison: true
            }
        });

        // Vérifiez si la commande existe
        if (!commande) {
            res.status(404).json({ error: 'Commande non trouvée' });
            return;
        }

        const pdfBuffer = await generateInvoicePDF(commande, commande.client, commande.panier);

        res.status(200)
            .setHeader('Content-Type', 'application/pdf')
            .setHeader('Content-Disposition', `attachment; filename=facture-${commande.id}.pdf`)
            .send(pdfBuffer);

    } catch (err) {
        console.error('Error in confirmCardPayment:', err);
        res.status(500).json({
            error: 'Erreur lors de la confirmation du paiement',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    } finally {
        await prisma.$disconnect();
    }
};