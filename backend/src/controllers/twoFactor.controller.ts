import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

/**
 * Generate a new 2FA secret for a user
 */
export const setupTwoFactor = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    try {
        // Check if 2FA is already enabled
        const user = await prisma.utilisateur.findUnique({
            where: { id: userId }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.twoFactorEnabled) {
            res.status(400).json({ error: '2FA is already enabled for this account' });
            return;
        }

        // Generate a new secret
        const secret = speakeasy.generateSecret({
            name: `MediaSoft:${user.email}`
        });

        // Store the secret temporarily (it will be confirmed when the user verifies the code)
        await prisma.utilisateur.update({
            where: { id: userId },
            data: {
                twoFactorSecret: secret.base32
            }
        });

        // Generate QR code
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

        res.status(200).json({
            message: '2FA setup initiated',
            qrCode: qrCodeUrl,
            secret: secret.base32
        });
    } catch (err) {
        console.error('Error setting up 2FA:', err);
        res.status(500).json({
            error: 'Error setting up two-factor authentication',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};

/**
 * Verify and enable 2FA for a user
 */
export const verifyAndEnableTwoFactor = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const { token } = req.body;

    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    if (!token) {
        res.status(400).json({ error: 'Verification token is required' });
        return;
    }

    try {
        const user = await prisma.utilisateur.findUnique({
            where: { id: userId }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (!user.twoFactorSecret) {
            res.status(400).json({ error: '2FA setup not initiated' });
            return;
        }

        // Verify the token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token
        });

        if (!verified) {
            res.status(400).json({ error: 'Invalid verification code' });
            return;
        }

        // Generate backup codes
        const backupCodes = Array(8).fill(0).map(() =>
            crypto.randomBytes(4).toString('hex')
        );

        // Enable 2FA and store backup codes
        await prisma.utilisateur.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                backupCodes: backupCodes
            }
        });

        res.status(200).json({
            message: '2FA enabled successfully',
            backupCodes: backupCodes
        });
    } catch (err) {
        console.error('Error verifying 2FA:', err);
        res.status(500).json({
            error: 'Error verifying two-factor authentication',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};

/**
 * Verify a 2FA token during login
 */
export const verifyTwoFactorToken = async (req: Request, res: Response): Promise<void> => {
    const { email, token, isBackupCode = false } = req.body;

    if (!email || !token) {
        res.status(400).json({ error: 'Email and verification token are required' });
        return;
    }

    try {
        const user = await prisma.utilisateur.findUnique({
            where: { email },
            include: { client: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            res.status(400).json({ error: '2FA is not enabled for this account' });
            return;
        }

        let verified = false;

        if (isBackupCode) {
            // Check if the token matches any backup code
            verified = user.backupCodes.includes(token);

            // If verified, remove the used backup code
            if (verified) {
                await prisma.utilisateur.update({
                    where: { id: user.id },
                    data: {
                        backupCodes: user.backupCodes.filter(code => code !== token)
                    }
                });
            }
        } else {
            // Verify the TOTP token
            verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token
            });
        }

        if (!verified) {
            res.status(400).json({ error: 'Invalid verification code' });
            return;
        }

        // Generate JWT token
        const jwtToken = jwt.sign(
            {
                id: user.id,
                role: user.role,
                clientId: user.client?.id
            },
            process.env.JWT_SECRET || 'votre_secret_jwt',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token: jwtToken,
            client: {
                id: user.client?.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                telephone: user.telephone,
                soldePoints: user.client?.soldePoints || 0
            }
        });
    } catch (err) {
        console.error('Error verifying 2FA token:', err);
        res.status(500).json({
            error: 'Error verifying two-factor authentication',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};

/**
 * Disable 2FA for a user
 */
export const disableTwoFactor = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const { currentPassword } = req.body;

    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    if (!currentPassword) {
        res.status(400).json({ error: 'Current password is required' });
        return;
    }

    try {
        const user = await prisma.utilisateur.findUnique({
            where: { id: userId }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.motDePasse);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Current password is incorrect' });
            return;
        }

        // Disable 2FA
        await prisma.utilisateur.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                backupCodes: []
            }
        });

        res.status(200).json({ message: '2FA disabled successfully' });
    } catch (err) {
        console.error('Error disabling 2FA:', err);
        res.status(500).json({
            error: 'Error disabling two-factor authentication',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};

/**
 * Get 2FA status for a user
 */
export const getTwoFactorStatus = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    try {
        const user = await prisma.utilisateur.findUnique({
            where: { id: userId },
            select: {
                twoFactorEnabled: true
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({
            twoFactorEnabled: user.twoFactorEnabled
        });
    } catch (err) {
        console.error('Error getting 2FA status:', err);
        res.status(500).json({
            error: 'Error retrieving two-factor authentication status',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};

/**
 * Generate new backup codes
 */
export const generateNewBackupCodes = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const { currentPassword } = req.body;

    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    if (!currentPassword) {
        res.status(400).json({ error: 'Current password is required' });
        return;
    }

    try {
        const user = await prisma.utilisateur.findUnique({
            where: { id: userId }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.motDePasse);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Current password is incorrect' });
            return;
        }

        if (!user.twoFactorEnabled) {
            res.status(400).json({ error: '2FA is not enabled for this account' });
            return;
        }

        // Generate new backup codes
        const backupCodes = Array(8).fill(0).map(() =>
            crypto.randomBytes(4).toString('hex')
        );

        // Update backup codes
        await prisma.utilisateur.update({
            where: { id: userId },
            data: { backupCodes: backupCodes }
        });

        res.status(200).json({
            message: 'New backup codes generated successfully',
            backupCodes: backupCodes
        });
    } catch (err) {
        console.error('Error generating new backup codes:', err);
        res.status(500).json({
            error: 'Error generating new backup codes',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};