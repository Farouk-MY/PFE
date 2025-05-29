import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendVerificationEmail } from '../services/email.service';
import crypto from 'crypto';


const prisma = new PrismaClient();

export const createClient = async (req: Request, res: Response): Promise<void> => {
    const { nom, prenom, email, telephone, ville, codePostal, gouvernorat, motDePasse } = req.body;

    // Validation des données
    if (!nom || !prenom || !email || !telephone || !motDePasse) {
        res.status(400).json({ error: 'Tous les champs obligatoires sont requis.' });
        return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Format d\'email invalide' });
        return;
    }

    try {
        // Vérifier d'abord si l'email existe déjà
        const existingUser = await prisma.utilisateur.findUnique({
            where: { email }
        });

        if (existingUser) {
            res.status(400).json({ error: 'Cet email est déjà utilisé.' });
            return;
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 3600000); // 1 heure

        const hashedPassword = await bcrypt.hash(motDePasse, 10);

        // Créer l'utilisateur et le client en une seule transaction
        const client = await prisma.$transaction(async (prisma) => {
            const utilisateur = await prisma.utilisateur.create({
                data: {
                    nom,
                    prenom,
                    email,
                    telephone,
                    ville: ville || "",
                    codePostal: codePostal || "",
                    gouvernorat: gouvernorat || "",
                    motDePasse: hashedPassword,
                    role: "client",
                    statut: "inactif",
                    emailVerified: false,
                    verificationToken,
                    verificationTokenExpires
                }
            });

            const client = await prisma.client.create({
                data: {
                    id: utilisateur.id,
                    soldePoints: 0,
                    historiqueAchats: "[]",
                    historiquePoints: "[]"
                },
                include: {
                    utilisateur: true
                }
            });

            return client;
        });

        await sendVerificationEmail(client.utilisateur.email, verificationToken);

        res.status(201).json({
            message: 'Compte créé avec succès! Veuillez vérifier votre email pour activer votre compte.',
            verificationSent: true,
            email: client.utilisateur.email
        });
    } catch (err) {
        console.error('Erreur:', err);
        res.status(500).json({
            error: 'Erreur lors de la création du client',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};
export const getHistoriqueAchats = async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;

    try {
        const commandes = await prisma.commande.findMany({
            where: { client_id: parseInt(clientId) },
            include: {
                panier: {
                    include: {
                        lignePanier: {
                            include: {
                                produit: true
                            }
                        }
                    }
                },
                livraison: true
            },
            orderBy: {
                id: 'desc'
            }
        });

        if (!commandes || commandes.length === 0) {
            res.status(404).json({ message: 'Aucun historique d\'achat trouvé pour ce client' });
            return;
        }

        const historique = commandes.map(commande => {
            const produits = commande.panier.lignePanier.map(ligne => ({
                id: ligne.produit.id,
                designation: ligne.produit.designation,
                quantite: ligne.qteCmd,
                prixUnitaire: ligne.prix,
                total: ligne.sousTotal,
                points: ligne.produit.nbrPoint * ligne.qteCmd,
                image: ligne.produit.images[0]
            }));

            const totalProduits = produits.reduce((sum, prod) => sum + prod.total, 0);
            const totalPoints = produits.reduce((sum, prod) => sum + prod.points, 0);

            return {
                id: commande.id,
                date: commande.panier.date,
                produits,
                remise: commande.remise || 0, // Fix: Use the monetary amount from commande.remise
                pourcentageRemise: commande.pourcentageRemise || 0, // Keep the percentage as-is
                montantLivraison: commande.montantLivraison,
                montantTotal: commande.montantAPayer,
                pointsUtilises: commande.pointsUtilises,
                pointsGagnes: commande.pointsGagnes,
                statutLivraison: commande.livraison[0]?.statutLivraison || 'En attente',
                detailsLivraison: commande.livraison[0] || null
            };
        });

        res.status(200).json(historique);
    } catch (err) {
        console.error('Erreur:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
    }
};
export const updateHistoriqueClient = async (clientId: number, nouvelleCommande: any) => {
    try {
        const client = await prisma.client.findUnique({
            where: { id: clientId }
        });

        let historique = client?.historiqueAchats ? JSON.parse(client.historiqueAchats.toString()) : [];
        historique.push(nouvelleCommande);

        await prisma.client.update({
            where: { id: clientId },
            data: {
                historiqueAchats: JSON.stringify(historique)
            }
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'historique:', err);
    }
};

export const getAllHistoriqueAchats = async (req: Request, res: Response): Promise<void> => {
    try {
        // Récupérer toutes les commandes avec les détails clients
        const commandes = await prisma.commande.findMany({
            include: {
                panier: {
                    include: {
                        lignePanier: {
                            include: {
                                produit: true
                            }
                        }
                    }
                },
                livraison: true,
                client: {
                    include: {
                        utilisateur: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });

        if (!commandes || commandes.length === 0) {
            res.status(404).json({ message: 'Aucun historique d\'achat trouvé' });
            return;
        }

        // Formater les données pour la réponse
        const historique = commandes.map(commande => {
            const produits = commande.panier.lignePanier.map(ligne => ({
                id: ligne.produit.id,
                designation: ligne.produit.designation,
                quantite: ligne.qteCmd,
                prixUnitaire: ligne.prix,
                total: ligne.sousTotal,
                points: ligne.produit.nbrPoint * ligne.qteCmd
            }));

            return {
                id: commande.id,
                date: commande.panier.date,
                client: {
                    id: commande.client.id,
                    nom: commande.client.utilisateur.nom,
                    prenom: commande.client.utilisateur.prenom,
                    email: commande.client.utilisateur.email
                },
                produits,
                remise: commande.pourcentageRemise || 0,
                montantLivraison: commande.montantLivraison,
                montantTotal: commande.montantAPayer,
                pointsUtilises: commande.pointsUtilises,
                pointsGagnes: commande.pointsGagnes,
                statutLivraison: commande.livraison[0]?.statutLivraison || 'En attente'
            };
        });

        res.status(200).json(historique);
    } catch (err) {
        console.error('Erreur:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique global' });
    }
};

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    console.log("Getting profile for user ID:", userId);

    try {
        const utilisateur = await prisma.utilisateur.findUnique({
            where: { id: userId },
            include: {
                client: {
                    include: {
                        panier: {
                            include: {
                                lignePanier: {
                                    include: {
                                        produit: true
                                    }
                                }
                            },
                            orderBy: { date: 'desc' },
                            take: 1
                        },
                        commande: {
                            include: {
                                panier: {
                                    include: {
                                        lignePanier: {
                                            include: {
                                                produit: true
                                            }
                                        }
                                    }
                                },
                                livraison: true,
                                paiement: true
                            },
                            orderBy: { id: 'desc' },
                            take: 5
                        }
                    }
                }
            }
        });

        if (!utilisateur) {
            console.log("User not found");
            res.status(404).json({ error: 'Utilisateur non trouvé' });
            return;
        }

        if (!utilisateur.client) {
            console.log("Client association not found for user");
            res.status(404).json({ error: 'Client non trouvé' });
            return;
        }

        // Safely access data with optional chaining
        const historiqueAchats = utilisateur.client.commande.map(commande => {
            const produits = commande.panier?.lignePanier?.map(ligne => ({
                id: ligne.produit?.id,
                designation: ligne.produit?.designation,
                quantite: ligne.qteCmd,
                prixUnitaire: ligne.prix,
                total: ligne.sousTotal,
                points: (ligne.produit?.nbrPoint || 0) * ligne.qteCmd,
                image: ligne.produit?.images?.[0] || null
            })) || [];

            return {
                id: commande.id,
                date: commande.panier?.date,
                produits,
                remise: commande.pourcentageRemise || 0,
                montantLivraison: commande.montantLivraison,
                montantTotal: commande.montantAPayer,
                pointsUtilises: commande.pointsUtilises,
                pointsGagnes: commande.pointsGagnes,
                statutLivraison: commande.livraison?.[0]?.statutLivraison || 'En attente',
                methodePaiement: commande.paiement?.methode || 'Non spécifiée'
            };
        });

        // Safely construct the response with optional chaining
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
                emailVerifie: utilisateur.emailVerified
            },
            points: {
                solde: utilisateur.client.soldePoints || 0,
                historique: utilisateur.client.historiquePoints
                    ? (typeof utilisateur.client.historiquePoints === 'string'
                        ? JSON.parse(utilisateur.client.historiquePoints)
                        : (Array.isArray(utilisateur.client.historiquePoints)
                            ? utilisateur.client.historiquePoints
                            : []))
                    : []
            },
            panierActuel: utilisateur.client.panier?.length > 0 ? {
                id: utilisateur.client.panier[0].id,
                total: utilisateur.client.panier[0].total || 0,
                nombreArticles: utilisateur.client.panier[0].lignePanier?.reduce((sum, ligne) => sum + ligne.qteCmd, 0) || 0,
                articles: utilisateur.client.panier[0].lignePanier?.map(ligne => ({
                    id: ligne.produit?.id,
                    designation: ligne.produit?.designation,
                    quantite: ligne.qteCmd,
                    prixUnitaire: ligne.prix,
                    points: ligne.produit?.nbrPoint || 0,
                    total: ligne.sousTotal,
                    image: ligne.produit?.images?.[0] || null
                })) || []
            } : null,
            historiqueAchats,
            statistiques: {
                totalCommandes: utilisateur.client.commande?.length || 0,
                totalDepense: utilisateur.client.commande?.reduce((sum, cmd) => sum + cmd.montantAPayer, 0) || 0,
                totalPointsGagnes: utilisateur.client.commande?.reduce((sum, cmd) => sum + cmd.pointsGagnes, 0) || 0
            }
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Erreur dans getMyProfile:', err);
        res.status(500).json({
            error: 'Erreur lors de la récupération du profil',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export const updateUserInfo = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const { nom, prenom, telephone, ville, codePostal, gouvernorat } = req.body;

    // Validation
    if (!nom && !prenom && !telephone && !ville && !codePostal && !gouvernorat) {
        res.status(400).json({ error: 'Aucune information à mettre à jour' });
        return;
    }

    try {
        const utilisateur = await prisma.utilisateur.findUnique({
            where: { id: userId }
        });

        if (!utilisateur) {
            res.status(404).json({ error: 'Utilisateur non trouvé' });
            return;
        }

        // Prepare update data
        const updateData: any = {};
        if (nom) updateData.nom = nom;
        if (prenom) updateData.prenom = prenom;
        if (telephone) updateData.telephone = telephone;
        if (ville) updateData.ville = ville;
        if (codePostal) updateData.codePostal = codePostal;
        if (gouvernorat) updateData.gouvernorat = gouvernorat;

        // Update user information
        const updatedUser = await prisma.utilisateur.update({
            where: { id: userId },
            data: updateData,
            include: { client: true }
        });

        // Format response
        const response = {
            id: updatedUser.id,
            nom: updatedUser.nom,
            prenom: updatedUser.prenom,
            email: updatedUser.email,
            telephone: updatedUser.telephone,
            adresse: {
                ville: updatedUser.ville,
                codePostal: updatedUser.codePostal,
                gouvernorat: updatedUser.gouvernorat
            },
            soldePoints: updatedUser.client?.soldePoints || 0
        };

        res.status(200).json({
            message: 'Informations mises à jour avec succès',
            user: response
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour des informations:', err);
        res.status(500).json({
            error: 'Erreur lors de la mise à jour des informations',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};


export const getSoldePointsHistory = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        // Récupérer le client avec son historique de points
        const client = await prisma.client.findUnique({
            where: { id: userId },
            include: {
                commande: {
                    orderBy: {
                        id: 'desc'
                    },
                    select: {
                        id: true,
                        dateLivraison: true,
                        pointsGagnes: true,
                        pointsUtilises: true,
                        panier: {
                            select: {
                                date: true,
                                total: true
                            }
                        }
                    }
                }
            }
        });

        if (!client) {
            res.status(404).json({ error: 'Client non trouvé' });
            return;
        }

        // Formater l'historique des points
        const historique = client.commande.map(cmd => {
            return {
                commandeId: cmd.id,
                date: cmd.panier?.date || new Date(),
                montantAchat: cmd.panier?.total || 0,
                pointsGagnes: cmd.pointsGagnes,
                pointsUtilises: cmd.pointsUtilises,
                impact: cmd.pointsGagnes - cmd.pointsUtilises // impact net sur le solde
            };
        });

        // Calculer l'évolution du solde
        let soldeActuel = client.soldePoints;
        const historiqueSolde = [];

        // Parcourir les commandes en ordre chronologique inverse pour retracer l'évolution du solde
        for (let i = 0; i < historique.length; i++) {
            const operation = historique[i];

            // Calculer le solde avant cette opération
            const soldePrecedent = soldeActuel - operation.impact;

            historiqueSolde.unshift({
                ...operation,
                soldePrecedent,
                soldeApres: soldeActuel
            });

            // Mettre à jour le solde pour l'opération suivante
            soldeActuel = soldePrecedent;
        }

        res.status(200).json({
            soldeActuel: client.soldePoints,
            historique: historiqueSolde
        });
    } catch (err) {
        console.error('Erreur lors de la récupération de l\'historique des points:', err);
        res.status(500).json({
            error: 'Erreur lors de la récupération de l\'historique des points',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export const getClientPoints = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        // Get client's points balance
        const client = await prisma.client.findUnique({
            where: { id: userId },
            select: {
                soldePoints: true
            }
        });

        if (!client) {
            res.status(404).json({ error: 'Client not found' });
            return;
        }

        res.status(200).json({
            points: client.soldePoints
        });
    } catch (err) {
        console.error('Error getting client points:', err);
        res.status(500).json({
            error: 'Error retrieving client points',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export const getClientOrdersCount = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        // Get count of client orders
        const orderCount = await prisma.commande.count({
            where: { client_id: userId }
        });

        res.status(200).json({
            count: orderCount
        });
    } catch (err) {
        console.error('Error getting order count:', err);
        res.status(500).json({
            error: 'Error retrieving order count',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};