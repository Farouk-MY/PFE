import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const submitContact = async (req: Request, res: Response): Promise<void> => {
    const { name, email, subject, message, type = "general" } = req.body;

    if (!name || !email || !subject || !message) {
        res.status(400).json({ error: 'Tous les champs sont requis (nom, email, sujet, message)' });
        return;
    }

    try {
        const newContact = await prisma.contact.create({
            data: {
                name,
                email,
                subject,
                message,
                type,
                status: "pending",
                priority: "medium",
                history: {
                    create: {
                        action: "message_created",
                        details: "Nouveau message de contact créé"
                    }
                }
            },
            include: {
                history: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Message de contact envoyé avec succès',
            contact: newContact
        });
    } catch (err) {
        console.error('Erreur lors de la soumission du formulaire de contact:', err);
        res.status(500).json({
            error: 'Erreur lors de la soumission du formulaire de contact',
            details: err instanceof Error ? err.message : 'Erreur inconnue'
        });
    }
};

export const getContactTypes = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Return predefined contact types
        const contactTypes = [
            { value: "general", label: "Question générale" },
            { value: "support", label: "Support technique" },
            { value: "sales", label: "Service commercial" },
            { value: "feedback", label: "Commentaires" }
        ];

        res.status(200).json(contactTypes);
    } catch (err) {
        console.error('Erreur lors de la récupération des types de contact:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};