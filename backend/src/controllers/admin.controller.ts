import { Request, Response } from "express";
import {Prisma, PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { generatePDF, prepareClientData } from '../utils/generatePDF';
import { exportToCSV } from '../utils/exportCSV';
import { format } from 'date-fns';

const prisma = new PrismaClient();

interface ExportUsersRequest extends Request {
    params: {
        format: 'csv' | 'pdf';
    };
    query: {
        filter?: string;
    };
}

export const createAdmin = async (req: Request, res: Response): Promise<void> => {
    const { nom, prenom, email, telephone, ville, codePostal, gouvernorat, motDePasse } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(motDePasse, 10);
        const admin = await prisma.admin.create({
            data: {
                utilisateur: {
                    create: {
                        nom,
                        prenom,
                        email,
                        telephone,
                        ville,
                        codePostal,
                        gouvernorat,
                        motDePasse: hashedPassword,
                        role: "admin",
                        statut: "actif",
                        emailVerified: true
                    }
                }
            },
            include: {
                utilisateur: true,
            },
        });

        res.status(201).json({ message: 'Admin créé avec succès', data: admin });
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ error: 'Erreur lors de la création de l\'admin', details: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
};

export const blockUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: 'ID invalide ou manquant.' });
        return;
    }

    try {
        const updatedUser = await prisma.utilisateur.update({
            where: { id: Number(id) },
            data: { statut: 'bloqué' }
        });

        res.status(200).json({ message: 'Utilisateur bloqué avec succès', user: updatedUser });
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ error: 'Erreur lors du blocage de l\'utilisateur', details: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
};

export const unblockUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: 'ID invalide ou manquant.' });
        return;
    }

    try {
        const updatedUser = await prisma.utilisateur.update({
            where: { id: Number(id) },
            data: { statut: 'actif' }
        });

        res.status(200).json({ message: 'Utilisateur débloqué avec succès', user: updatedUser });
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ error: 'Erreur lors du déblocage de l\'utilisateur', details: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
};

export const exportUsers = async (req: ExportUsersRequest, res: Response): Promise<void> => {
    const { format: exportFormat } = req.params;
    const { filter } = req.query;

    try {
        // Base query for finding users
        let whereCondition: Prisma.UtilisateurWhereInput = { role: 'client' };

        // Add filter if provided
        if (filter) {
            const searchQuery = filter;
            whereCondition.OR = [
                { nom: { contains: searchQuery, mode: 'insensitive' } },
                { prenom: { contains: searchQuery, mode: 'insensitive' } },
                { email: { contains: searchQuery, mode: 'insensitive' } },
                { telephone: { contains: searchQuery } },
                { ville: { contains: searchQuery, mode: 'insensitive' } },
            ];
        }

        // Get clients with their data
        const clients = await prisma.utilisateur.findMany({
            where: whereCondition,
            include: {
                client: {
                    include: {
                        commande: true
                    }
                }
            },
            orderBy: { nom: 'asc' }
        });

        // Create timestamp for unique filenames
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');

        if (exportFormat === 'csv') {
            const filePath = path.join(__dirname, `clients_export_${timestamp}.csv`);
            await exportToCSV(clients, res, filePath);

            res.download(filePath, `clients_${timestamp}.csv`, (err) => {
                if (err) {
                    console.error('Erreur lors de l\'envoi du fichier CSV:', err);
                    res.status(500).json({ error: 'Erreur lors de l\'envoi du fichier CSV' });
                } else {
                    // Cleanup after sending
                    try {
                        fs.unlinkSync(filePath);
                    } catch (unlinkErr) {
                        console.error('Erreur lors de la suppression du fichier temporaire:', unlinkErr);
                    }
                }
            });
        } else if (exportFormat === 'pdf') {
            const filePath = path.join(__dirname, `clients_export_${timestamp}.pdf`);
            await generatePDF(clients, filePath);

            res.download(filePath, `clients_${timestamp}.pdf`, (err) => {
                if (err) {
                    console.error('Erreur lors de l\'envoi du fichier PDF:', err);
                    res.status(500).json({ error: 'Erreur lors de l\'envoi du fichier PDF' });
                } else {
                    // Cleanup after sending
                    try {
                        fs.unlinkSync(filePath);
                    } catch (unlinkErr) {
                        console.error('Erreur lors de la suppression du fichier temporaire:', unlinkErr);
                    }
                }
            });
        } else {
            res.status(400).json({ error: 'Format non supporté. Utilisez "csv" ou "pdf".' });
        }
    } catch (err) {
        console.error('Erreur lors de l\'exportation des utilisateurs:', err);
        res.status(500).json({
            error: 'Erreur lors de l\'exportation des utilisateurs',
            details: err instanceof Error ? err.message : 'Erreur inconnue'
        });
    }
};

export const getAdminProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    console.log("Getting admin profile for user ID:", userId);

    try {
        const utilisateur = await prisma.utilisateur.findUnique({
            where: { id: userId },
            include: {
                admin: true
            }
        });

        if (!utilisateur) {
            console.log("User not found");
            res.status(404).json({ error: 'Utilisateur non trouvé' });
            return;
        }

        if (!utilisateur.admin) {
            console.log("Admin association not found for user");
            res.status(404).json({ error: 'Admin non trouvé' });
            return;
        }

        // Format response
        const response = {
            informationsPersonnelles: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email: utilisateur.email,
                telephone: utilisateur.telephone,
                adresse: {
                    ville: utilisateur.ville || '',
                    codePostal: utilisateur.codePostal || '',
                    gouvernorat: utilisateur.gouvernorat || ''
                },
                dateInscription: utilisateur.inscritLe,
                statutCompte: utilisateur.statut,
                emailVerifie: utilisateur.emailVerified,
                role: utilisateur.role
            },
            adminId: utilisateur.admin.id
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Erreur dans getAdminProfile:', err);
        res.status(500).json({
            error: 'Erreur lors de la récupération du profil admin',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};