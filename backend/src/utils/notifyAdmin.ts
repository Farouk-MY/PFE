import nodemailer from 'nodemailer';
import { PrismaClient, Produit } from '@prisma/client';

const prisma = new PrismaClient();

export const notifyAdminLowStock = async (produit: Produit): Promise<void> => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Récupérer tous les administrateurs
        const admins = await prisma.admin.findMany({
            include: { utilisateur: true }
        });

        for (const admin of admins) {
            const mailOptions = {
                from: `"Système d'Alerte Stock" <${process.env.EMAIL_USER}>`,
                to: admin.utilisateur.email,
                subject: `ALERTE STOCK - ${produit.designation}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #dc2626;">ALERTE DE STOCK FAIBLE</h2>
                        
                        <p>Le produit suivant atteint son seuil minimum de stock :</p>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <h3 style="margin-top: 0;">${produit.designation}</h3>
                            <p><strong>ID Produit :</strong> ${produit.id}</p>
                            <p><strong>Stock actuel :</strong> ${produit.qteStock}</p>
                            <p><strong>Seuil minimum :</strong> ${produit.seuilMin}</p>
                        </div>
                        
                        <p style="color: #dc2626; font-weight: bold;">Veuillez procéder au réapprovisionnement dès que possible.</p>
                        
                        <div style="margin-top: 20px;">
                            <a href="${process.env.ADMIN_URL}/produits/${produit.id}" 
                               style="background-color: #dc2626; color: white; 
                                      padding: 10px 20px; text-decoration: none; 
                                      border-radius: 5px; display: inline-block;">
                                Voir le produit
                            </a>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Notification de stock faible envoyée à ${admin.utilisateur.email}`);
        }
    } catch (err) {
        console.error('Erreur lors de l\'envoi de la notification de stock faible:', err);
        // Ne pas throw l'erreur pour ne pas interrompre le processus de commande
    } finally {
        await prisma.$disconnect();
    }
};