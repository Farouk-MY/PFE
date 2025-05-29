import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPanier = async (req: Request, res: Response): Promise<void> => {
    const { client_id } = req.body;

    try {
        // Vérifier si le client existe
        const client = await prisma.client.findUnique({
            where: { id: client_id },
        });

        if (!client) {
            res.status(404).json({ error: 'Client non trouvé.' });
            return;
        }

        // Créer un panier
        const panier = await prisma.panier.create({
            data: {
                client_id,
                total: 0, // Initialiser le total à 0
                livrerDomicile: false, // Par défaut
                date: new Date(), // Ajouter la date actuelle
            },
        });

        res.status(201).json({ message: 'Panier créé avec succès', data: panier });
    } catch (err) {
        if (err instanceof Error) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la création du panier', details: err.message });
        } else {
            console.error('Erreur inconnue:', err);
            res.status(500).json({ error: 'Erreur inconnue lors de la création du panier' });
        }
    }
};
export const addProductToPanier = async (req: Request, res: Response): Promise<void> => {
    const { panier_id } = req.params; // Extraction de l'ID du panier depuis l'URL
    const { produit_id, qteCmd } = req.body; // Extraction des données du corps de la requête

    if (!panier_id || isNaN(Number(panier_id))) {
        res.status(400).json({ error: 'ID de panier invalide ou manquant.' });
        return;
    }

    try {
        // Vérifier si le panier existe
        const panier = await prisma.panier.findUnique({
            where: { id: Number(panier_id) }, // Utilisation de l'ID du panier
        });

        if (!panier) {
            res.status(404).json({ error: 'Panier non trouvé.' });
            return;
        }

        // Vérifier si le produit existe
        const produit = await prisma.produit.findUnique({
            where: { id: produit_id },
        });

        if (!produit) {
            res.status(404).json({ error: 'Produit non trouvé.' });
            return;
        }

        // Vérifier si la quantité en stock est suffisante
        if (produit.qteStock < qteCmd) {
            res.status(400).json({ error: 'Stock insuffisant pour ce produit.' });
            return;
        }

        // Calculer le sous-total
        const sousTotal = produit.prix * qteCmd;

        // Ajouter le produit au panier
        const lignePanier = await prisma.lignePanier.create({
            data: {
                panier_id: Number(panier_id),
                produit_id,
                qteCmd,
                prix: produit.prix,
                sousTotal,
            },
        });

        // Mettre à jour le total du panier
        const updatedPanier = await prisma.panier.update({
            where: { id: Number(panier_id) },
            data: {
                total: panier.total + sousTotal,
            },
        });

        res.status(201).json({ message: 'Produit ajouté au panier avec succès', data: { lignePanier, updatedPanier } });
    } catch (err) {
        if (err instanceof Error) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de l\'ajout du produit au panier', details: err.message });
        } else {
            console.error('Erreur inconnue:', err);
            res.status(500).json({ error: 'Erreur inconnue lors de l\'ajout du produit au panier' });
        }
    }
};