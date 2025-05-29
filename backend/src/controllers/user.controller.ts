import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Fonction pour générer un token de réinitialisation
const generateResetToken = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getDefault = (req: Request, res: Response): void => {
    res.json({ msg: 'API fonctionnelle' });
};

// Modified to get only clients
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.utilisateur.findMany({
            where: {
                client: {
                    isNot: null
                }
            },
            include: {
                client: true
            }
        });

        // Map the data to match the expected format in the frontend
        const formattedUsers = users.map(user => ({
            id: user.id.toString(),
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            telephone: user.telephone,
            adresse: `${user.ville} ${user.codePostal} ${user.gouvernorat}`.trim(),
            statut: user.statut,
            dateCreation: user.inscritLe.toISOString(),
            points: user.client?.soldePoints || 0
            // You could add additional fields like commandes, totalDepense, and derniereCommande
            // if you have that data available in other tables
        }));

        res.json({ users: formattedUsers });
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs', details: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: 'ID invalide ou manquant.' });
        return;
    }

    try {
        const user = await prisma.utilisateur.findUnique({
            where: { id: Number(id) },
            include: {
                client: true
            }
        });

        if (user) {
            // Format user data to match frontend expectations
            const formattedUser = {
                id: user.id.toString(),
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                telephone: user.telephone,
                adresse: `${user.ville} ${user.codePostal} ${user.gouvernorat}`.trim(),
                statut: user.statut,
                dateCreation: user.inscritLe.toISOString(),
                points: user.client?.soldePoints || 0
                // Additional fields can be added here as needed
            };

            res.json({ user: formattedUser });
        } else {
            res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur', details: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.query;

    if (!query) {
        res.status(400).json({ error: 'Le paramètre de recherche est requis.' });
        return;
    }

    try {
        const users = await prisma.utilisateur.findMany({
            where: {
                AND: [
                    {
                        client: {
                            isNot: null
                        }
                    },
                    {
                        OR: [
                            { nom: { contains: query as string, mode: 'insensitive' } },
                            { prenom: { contains: query as string, mode: 'insensitive' } },
                            { email: { contains: query as string, mode: 'insensitive' } }
                        ]
                    }
                ]
            },
            include: {
                client: true
            }
        });

        // Format the data to match frontend expectations
        const formattedUsers = users.map(user => ({
            id: user.id.toString(),
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            telephone: user.telephone,
            adresse: `${user.ville} ${user.codePostal} ${user.gouvernorat}`.trim(),
            statut: user.statut,
            dateCreation: user.inscritLe.toISOString(),
            points: user.client?.soldePoints || 0
            // Additional fields can be added as needed
        }));

        res.json({ users: formattedUsers });
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ error: 'Erreur lors de la recherche des utilisateurs', details: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
};