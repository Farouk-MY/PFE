import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import {sendContactReplyEmail} from "../services/email.service";

const prisma = new PrismaClient();

export const getAllContacts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, type, priority, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        // Build where clause based on filters
        const where: any = {};
        if (status) where.status = status;
        if (type) where.type = type;
        if (priority) where.priority = priority;

        // Get total count for pagination
        const totalCount = await prisma.contact.count({ where });

        // Get contacts with pagination and sorting
        const contacts = await prisma.contact.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: {
                [sort as string]: order === 'desc' ? 'desc' : 'asc'
            },
            include: {
                history: {
                    orderBy: {
                        date: 'desc'
                    }
                },
                replies: {
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        });

        res.status(200).json({
            contacts,
            pagination: {
                total: totalCount,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalCount / Number(limit))
            }
        });
    } catch (err) {
        console.error('Erreur lors de la récupération des contacts:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

export const getContactById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const contact = await prisma.contact.findUnique({
            where: { id: Number(id) },
            include: {
                history: {
                    orderBy: {
                        date: 'desc'
                    }
                },
                replies: {
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        });

        if (!contact) {
            res.status(404).json({ error: 'Contact non trouvé' });
            return;
        }

        res.status(200).json(contact);
    } catch (err) {
        console.error(`Erreur lors de la récupération du contact ${req.params.id}:`, err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

export const updateContactStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    const staffName = (req as any).user?.nom || 'Admin';

    if (!status) {
        res.status(400).json({ error: 'Le statut est requis' });
        return;
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Statut invalide' });
        return;
    }

    try {
        const contact = await prisma.contact.findUnique({
            where: { id: Number(id) }
        });

        if (!contact) {
            res.status(404).json({ error: 'Contact non trouvé' });
            return;
        }

        // Update contact status and add history entry
        const updatedContact = await prisma.$transaction([
            prisma.contact.update({
                where: { id: Number(id) },
                data: { status }
            }),
            prisma.contactHistory.create({
                data: {
                    contactId: Number(id),
                    action: 'status_changed',
                    details: `Statut modifié de ${contact.status} à ${status} par ${staffName}`
                }
            })
        ]);

        res.status(200).json({
            message: 'Statut mis à jour avec succès',
            contact: updatedContact[0]
        });
    } catch (err) {
        console.error(`Erreur lors de la mise à jour du statut pour le contact ${id}:`, err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

export const updateContactPriority = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { priority } = req.body;
    const staffName = (req as any).user?.nom || 'Admin';

    if (!priority) {
        res.status(400).json({ error: 'La priorité est requise' });
        return;
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
        res.status(400).json({ error: 'Priorité invalide' });
        return;
    }

    try {
        const contact = await prisma.contact.findUnique({
            where: { id: Number(id) }
        });

        if (!contact) {
            res.status(404).json({ error: 'Contact non trouvé' });
            return;
        }

        // Update contact priority and add history entry
        const updatedContact = await prisma.$transaction([
            prisma.contact.update({
                where: { id: Number(id) },
                data: { priority }
            }),
            prisma.contactHistory.create({
                data: {
                    contactId: Number(id),
                    action: 'priority_changed',
                    details: `Priorité modifiée de ${contact.priority} à ${priority} par ${staffName}`
                }
            })
        ]);

        res.status(200).json({
            message: 'Priorité mise à jour avec succès',
            contact: updatedContact[0]
        });
    } catch (err) {
        console.error(`Erreur lors de la mise à jour de la priorité pour le contact ${id}:`, err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

export const replyToContact = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { content } = req.body;
    const staffName = (req as any).user?.nom || 'Admin';

    if (!content) {
        res.status(400).json({ error: 'Le contenu de la réponse est requis' });
        return;
    }

    try {
        const contact = await prisma.contact.findUnique({
            where: { id: Number(id) }
        });

        if (!contact) {
            res.status(404).json({ error: 'Contact non trouvé' });
            return;
        }

        // Create reply and history entry
        const [reply, history] = await prisma.$transaction([
            prisma.contactReply.create({
                data: {
                    contactId: Number(id),
                    staff: staffName,
                    content
                }
            }),
            prisma.contactHistory.create({
                data: {
                    contactId: Number(id),
                    action: 'reply_sent',
                    details: `Réponse envoyée par ${staffName}`
                }
            }),
            // Also update status to in_progress if it's pending
            ...(contact.status === 'pending' ? [
                prisma.contact.update({
                    where: { id: Number(id) },
                    data: { status: 'in_progress' }
                })
            ] : [])
        ]);

        // Send email notification to the contact
        await sendContactReplyEmail(contact.email, contact.name, contact.subject, content, staffName);

        res.status(201).json({
            message: 'Réponse envoyée avec succès',
            reply
        });
    } catch (err) {
        console.error(`Erreur lors de l'envoi de la réponse pour le contact ${id}:`, err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        // Check if contact exists
        const contact = await prisma.contact.findUnique({
            where: { id: Number(id) }
        });

        if (!contact) {
            res.status(404).json({ error: 'Contact non trouvé' });
            return;
        }

        // Delete contact and all related records
        await prisma.$transaction([
            // Delete all history records
            prisma.contactHistory.deleteMany({
                where: { contactId: Number(id) }
            }),
            // Delete all replies
            prisma.contactReply.deleteMany({
                where: { contactId: Number(id) }
            }),
            // Delete the contact
            prisma.contact.delete({
                where: { id: Number(id) }
            })
        ]);

        res.status(200).json({
            message: 'Contact supprimé avec succès'
        });
    } catch (err) {
        console.error(`Erreur lors de la suppression du contact ${id}:`, err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

export const getContactStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        const [
            totalCount,
            pendingCount,
            inProgressCount,
            resolvedCount,
            highPriorityCount,
            todayCount
        ] = await Promise.all([
            prisma.contact.count(),
            prisma.contact.count({ where: { status: 'pending' } }),
            prisma.contact.count({ where: { status: 'in_progress' } }),
            prisma.contact.count({ where: { status: 'resolved' } }),
            prisma.contact.count({ where: { priority: 'high' } }),
            prisma.contact.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            })
        ]);

        res.status(200).json({
            total: totalCount,
            pending: pendingCount,
            inProgress: inProgressCount,
            resolved: resolvedCount,
            highPriority: highPriorityCount,
            today: todayCount
        });
    } catch (err) {
        console.error('Erreur lors de la récupération des statistiques de contact:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};