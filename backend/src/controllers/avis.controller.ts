import { Request, Response } from "express";
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Type personnalisé pour les erreurs Prisma
type PrismaError = Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientUnknownRequestError | Prisma.PrismaClientValidationError;

export const createAvis = async (req: Request, res: Response): Promise<void> => {
    const { note, commentaire, utilisateur_id, produit_id } = req.body;

    if (!note || !utilisateur_id || !produit_id) {
        res.status(400).json({ error: 'Les champs note, utilisateur_id et produit_id sont obligatoires' });
        return;
    }

    try {
        // Vérifier si le produit existe
        const produit = await prisma.produit.findUnique({
            where: { id: Number(produit_id) }
        });

        if (!produit) {
            res.status(404).json({ error: 'Produit non trouvé' });
            return;
        }

        // Créer ou mettre à jour l'avis
        const avis = await prisma.avis.upsert({
            where: {
                // Make sure this matches the @@unique name in your Prisma schema
                utilisateur_id_produit_id: {
                    utilisateur_id: Number(utilisateur_id),
                    produit_id: Number(produit_id)
                }
            },
            update: {
                note: Number(note),
                commentaire: commentaire || null
            },
            create: {
                date: new Date(),
                note: Number(note),
                commentaire: commentaire || null,
                utilisateur_id: Number(utilisateur_id),
                produit_id: Number(produit_id)
            },
            include: {
                utilisateur: {
                    select: {
                        nom: true,
                        prenom: true
                    }
                },
                produit: {
                    select: {
                        designation: true
                    }
                }
            }
        });

        res.status(201).json({ message: 'Avis enregistré avec succès', data: avis });
    } catch (error: unknown) {
        console.error('Erreur lors de la création de l\'avis:', error);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                res.status(400).json({ error: 'ID utilisateur ou produit invalide' });
                return;
            }
        }

        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        res.status(500).json({ 
            error: 'Erreur lors de la création de l\'avis',
            details: process.env.NODE_ENV === 'development' ? errorMessage : null
        });
    }
};


// Récupérer tous les avis
export const getAllAvis = async (req: Request, res: Response): Promise<void> => {
    try {
        const avis = await prisma.avis.findMany({
            include: {
                utilisateur: {
                    select: {
                        nom: true,
                        prenom: true,
                        email: true
                    }
                },
                produit: {
                    select: {
                        id: true,
                        designation: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        res.status(200).json({ data: avis });
    } catch (error: unknown) {
        console.error('Erreur lors de la récupération des avis:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des avis',
            details: process.env.NODE_ENV === 'development' ? errorMessage : null
        });
    }
};

// Récupérer un avis par ID
export const getAvisById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const avis = await prisma.avis.findUnique({
            where: { id: Number(id) },
            include: {
                utilisateur: {
                    select: {
                        nom: true,
                        prenom: true,
                        email: true
                    }
                },
                produit: {
                    select: {
                        id: true,
                        designation: true
                    }
                }
            }
        });

        if (!avis) {
            res.status(404).json({ error: 'Avis non trouvé' });
            return;
        }

        res.status(200).json({ data: avis });
    } catch (error: unknown) {
        console.error('Erreur lors de la récupération de l\'avis:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        res.status(500).json({ 
            error: 'Erreur lors de la récupération de l\'avis',
            details: process.env.NODE_ENV === 'development' ? errorMessage : null
        });
    }
};

// Mettre à jour un avis
export const updateAvis = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { note, commentaire } = req.body;

    try {
        const updatedAvis = await prisma.avis.update({
            where: { id: Number(id) },
            data: {
                note,
                commentaire
            },
            include: {
                utilisateur: {
                    select: {
                        nom: true,
                        prenom: true,
                        email: true
                    }
                },
                produit: {
                    select: {
                        id: true,
                        designation: true
                    }
                }
            }
        });

        res.status(200).json({ message: 'Avis mis à jour avec succès', data: updatedAvis });
    } catch (error: unknown) {
        console.error('Erreur lors de la mise à jour de l\'avis:', error);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                res.status(404).json({ error: 'Avis non trouvé' });
                return;
            }
        }

        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        res.status(500).json({ 
            error: 'Erreur lors de la mise à jour de l\'avis',
            details: process.env.NODE_ENV === 'development' ? errorMessage : null
        });
    }
};

// Supprimer un avis
export const deleteAvis = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        await prisma.avis.delete({
            where: { id: Number(id) }
        });

        res.status(200).json({ message: 'Avis supprimé avec succès' });
    } catch (error: unknown) {
        console.error('Erreur lors de la suppression de l\'avis:', error);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                res.status(404).json({ error: 'Avis non trouvé' });
                return;
            }
        }

        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        res.status(500).json({ 
            error: 'Erreur lors de la suppression de l\'avis',
            details: process.env.NODE_ENV === 'development' ? errorMessage : null
        });
    }
};

// Statistiques des avis
export const getAvisStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // Statistiques globales
        const statsGlobales = await prisma.avis.aggregate({
            _avg: {
                note: true
            },
            _count: {
                _all: true
            }
        });

        // Top 10 des produits les mieux notés
        const statsParProduit = await prisma.avis.groupBy({
            by: ['produit_id'],
            _avg: {
                note: true
            },
            _count: {
                _all: true
            },
            orderBy: {
                _avg: {
                    note: 'desc'
                }
            },
            take: 10
        });

        // Récupérer les infos des produits
        const produitsIds = statsParProduit.map(stat => stat.produit_id);
        const produits = await prisma.produit.findMany({
            where: {
                id: { in: produitsIds.filter(id => id !== null) as number[] }
            },
            select: {
                id: true,
                designation: true,
                images: true
            }
        });

        // Combiner les données
        const topProduits = statsParProduit.map(stat => {
            const produit = produits.find(p => p.id === stat.produit_id);
            return {
                produit_id: stat.produit_id,
                designation: produit?.designation,
                image: produit?.images[0],
                note_moyenne: stat._avg.note ?? 0,
                nombre_avis: stat._count._all
            };
        });

        res.status(200).json({
            stats_globales: {
                note_moyenne: statsGlobales._avg.note ?? 0,
                nombre_total_avis: statsGlobales._count._all
            },
            top_produits: topProduits
        });
    } catch (error: unknown) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des statistiques',
            details: process.env.NODE_ENV === 'development' ? errorMessage : null
        });
    }
};

// Obtenir les avis d'un produit spécifique
export const getAvisProduit = async (req: Request, res: Response): Promise<void> => {
    const { produit_id } = req.params;

    try {
        const avis = await prisma.avis.findMany({
            where: { 
                produit: { id: Number(produit_id) }
            },
            include: {
                utilisateur: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        // Calculer la note moyenne pour ce produit
        const statsProduit = await prisma.avis.aggregate({
            where: { 
                produit: { id: Number(produit_id) }
            },
            _avg: {
                note: true
            },
            _count: {
                _all: true
            }
        });

        res.status(200).json({
            note_moyenne: statsProduit._avg.note ?? 0,
            nombre_avis: statsProduit._count._all,
            avis
        });
    } catch (error: unknown) {
        console.error('Erreur lors de la récupération des avis:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des avis',
            details: process.env.NODE_ENV === 'development' ? errorMessage : null
        });
    }
};