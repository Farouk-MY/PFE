import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Fonction pour générer un token de réinitialisation
const generateResetToken = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getDefault = (req: Request, res: Response): void => {
    res.json({ msg: 'API fonctionnelle' });
};
export const sendNotificationToAllClients = async (req: Request, res: Response): Promise<void> => {
    const { message } = req.body;

    if (!message) {
        res.status(400).json({ error: 'Le message de la notification est requis.' });
        return;
    }

    try {
        // Récupérer tous les clients
        const clients = await prisma.utilisateur.findMany({
            where: {
                role: 'client',
            },
        });

        // Configurer Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Envoyer un e-mail à chaque client et enregistrer la notification
        for (const client of clients) {
            const notification = await prisma.notification.create({
                data: {
                    message,
                    dateEnvoi: new Date(),
                    statut: 'non lu',
                    utilisateur_id: client.id,
                },
            });

            // Créer un lien unique pour marquer la notification comme lue
            const markAsReadLink = `http://localhost:3000/api/users/notifications/${notification.id}/mark-as-read`;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: client.email,
                subject: 'Nouvelle Notification',
                html: `
                    <p>${message}</p>
                    <p><a href="${markAsReadLink}">Cliquez ici pour marquer cette notification comme lue</a></p>
                `,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Erreur lors de l'envoi de l'e-mail à ${client.email}:`, error);
                } else {
                    console.log(`E-mail envoyé à ${client.email}:`, info.response);
                }
            });
        }

        res.status(200).json({ message: 'Notifications envoyées à tous les clients avec succès.' });
    } catch (err) {
        if (err instanceof Error) {
            console.error('Erreur lors de l\'envoi des notifications:', err);
            res.status(500).json({ error: 'Erreur lors de l\'envoi des notifications', details: err.message });
        } else {
            console.error('Erreur inconnue:', err);
            res.status(500).json({ error: 'Erreur inconnue lors de l\'envoi des notifications' });
        }
    }
};
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
    const { notificationId } = req.params;

    if (!notificationId || isNaN(Number(notificationId))) {
        res.status(400).json({ error: 'ID de notification invalide ou manquant.' });
        return;
    }

    try {
        // Mettre à jour le statut de la notification
        const updatedNotification = await prisma.notification.update({
            where: { id: Number(notificationId) },
            data: { statut: 'lu' },
        });

        res.status(200).json({
            message: 'Notification marquée comme lue avec succès',
            notification: updatedNotification,
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification', details: err.message });
        } else {
            console.error('Erreur inconnue:', err);
            res.status(500).json({ error: 'Erreur inconnue lors de la mise à jour de la notification' });
        }
    }
};

export const getClientsWhoReadNotification = async (req: Request, res: Response): Promise<void> => {
    const { message } = req.query;

    console.log('Message reçu:', message); // Log pour déboguer

    if (!message) {
        res.status(400).json({ error: 'Le message de la notification est requis.' });
        return;
    }

    try {
        // Récupérer les notifications avec le statut "lu" pour le message spécifié
        const readNotifications = await prisma.notification.findMany({
            where: {
                message: message as string,
                statut: 'lu',
            },
            include: {
                utilisateur: true, // Inclure les informations de l'utilisateur
            },
        });

        // Extraire les utilisateurs qui ont lu la notification
        const clientsWhoRead = readNotifications.map(notification => notification.utilisateur);

        res.status(200).json({ clients: clientsWhoRead });
    } catch (err) {
        if (err instanceof Error) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des clients', details: err.message });
        } else {
            console.error('Erreur inconnue:', err);
            res.status(500).json({ error: 'Erreur inconnue lors de la récupération des clients' });
        }
    }
};
export const getClientsWhoDidNotReadNotification = async (req: Request, res: Response): Promise<void> => {
    const { message } = req.query;

    if (!message) {
        res.status(400).json({ error: 'Le message de la notification est requis.' });
        return;
    }

    try {
        // Récupérer tous les clients
        const allClients = await prisma.utilisateur.findMany({
            where: {
                role: 'client',
            },
        });

        // Récupérer les notifications avec le statut "lu" pour le message spécifié
        const readNotifications = await prisma.notification.findMany({
            where: {
                message: message as string,
                statut: 'lu',
            },
            include: {
                utilisateur: true, // Inclure les informations de l'utilisateur
            },
        });

        // Extraire les IDs des utilisateurs qui ont lu la notification
        const readClientIds = readNotifications.map(notification => notification.utilisateur.id);

        // Filtrer les clients qui n'ont pas lu la notification
        const clientsWhoDidNotRead = allClients.filter(client => !readClientIds.includes(client.id));

        res.status(200).json({ clients: clientsWhoDidNotRead });
    } catch (err) {
        if (err instanceof Error) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des clients', details: err.message });
        } else {
            console.error('Erreur inconnue:', err);
            res.status(500).json({ error: 'Erreur inconnue lors de la récupération des clients' });
        }
    }
};
const exportClientsToCSV = async (clientsWhoRead: any[], clientsWhoDidNotRead: any[], res: Response): Promise<void> => {
    const filePath = path.join(__dirname, 'clients_notification_status.csv');
    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            { id: 'id', title: 'ID' },
            { id: 'nom', title: 'Nom' },
            { id: 'prenom', title: 'Prénom' },
            { id: 'email', title: 'Email' },
            { id: 'statut', title: 'Statut' }, // Statut de la notification (lu ou non lu)
        ],
    });

    // Combiner les deux listes avec un statut
    const records = [
        ...clientsWhoRead.map(client => ({
            id: client.id,
            nom: client.nom,
            prenom: client.prenom,
            email: client.email,
            statut: 'lu',
        })),
        ...clientsWhoDidNotRead.map(client => ({
            id: client.id,
            nom: client.nom,
            prenom: client.prenom,
            email: client.email,
            statut: 'non lu',
        })),
    ];

    try {
        await csvWriter.writeRecords(records);

        res.download(filePath, 'clients_notification_status.csv', (err) => {
            if (err) {
                console.error('Erreur lors de l\'envoi du fichier CSV:', err);
                res.status(500).json({ error: 'Erreur lors de l\'envoi du fichier CSV' });
            }
            fs.unlinkSync(filePath); // Supprimer le fichier après l'envoi
        });
    } catch (err) {
        console.error('Erreur lors de la génération du fichier CSV:', err);
        res.status(500).json({ error: 'Erreur lors de la génération du fichier CSV' });
    }
};
const exportClientsToPDF = async (clientsWhoRead: any[], clientsWhoDidNotRead: any[], res: Response): Promise<void> => {
    const filePath = path.join(__dirname, 'clients_notification_status.pdf');
    const doc = new PDFDocument();

    // Écrire le titre
    doc.fontSize(14).text('Statut des notifications', { align: 'center' });

    // Écrire la section des clients qui ont lu la notification
    doc.fontSize(12).text('Clients ayant lu la notification:', { underline: true });
    clientsWhoRead.forEach((client, index) => {
        doc.fontSize(10).text(`${index + 1}. ${client.nom} ${client.prenom} - ${client.email}`);
    });

    // Ajouter un espace
    doc.moveDown();

    // Écrire la section des clients qui n'ont pas lu la notification
    doc.fontSize(12).text('Clients n\'ayant pas lu la notification:', { underline: true });
    clientsWhoDidNotRead.forEach((client, index) => {
        doc.fontSize(10).text(`${index + 1}. ${client.nom} ${client.prenom} - ${client.email}`);
    });

    // Finaliser le PDF
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    doc.end();

    // Attendre que le fichier soit entièrement écrit
    writeStream.on('finish', () => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="clients_notification_status.pdf"');

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);

        // Supprimer le fichier après l'envoi
        readStream.on('end', () => {
            fs.unlinkSync(filePath);
        });
    });

    writeStream.on('error', (err) => {
        console.error('Erreur lors de la génération du fichier PDF:', err);
        res.status(500).json({ error: 'Erreur lors de la génération du fichier PDF' });
    });
};
export const exportNotificationStatus = async (req: Request, res: Response): Promise<void> => {
    const { message, format } = req.query;

    if (!message || !format) {
        res.status(400).json({ error: 'Le message de la notification et le format sont requis.' });
        return;
    }

    try {
        // Récupérer les clients qui ont lu la notification
        const readNotifications = await prisma.notification.findMany({
            where: {
                message: message as string,
                statut: 'lu',
            },
            include: {
                utilisateur: true,
            },
        });
        const clientsWhoRead = readNotifications.map(notification => notification.utilisateur);

        // Récupérer tous les clients
        const allClients = await prisma.utilisateur.findMany({
            where: {
                role: 'client',
            },
        });

        // Filtrer les clients qui n'ont pas lu la notification
        const readClientIds = clientsWhoRead.map(client => client.id);
        const clientsWhoDidNotRead = allClients.filter(client => !readClientIds.includes(client.id));

        // Exporter en fonction du format demandé
        if (format === 'csv') {
            await exportClientsToCSV(clientsWhoRead, clientsWhoDidNotRead, res);
        } else if (format === 'pdf') {
            await exportClientsToPDF(clientsWhoRead, clientsWhoDidNotRead, res);
        } else {
            res.status(400).json({ error: 'Format non supporté. Utilisez "csv" ou "pdf".' });
        }
    } catch (err) {
        console.error('Erreur lors de l\'exportation des données:', err);
        res.status(500).json({ error: 'Erreur lors de l\'exportation des données', details: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
};