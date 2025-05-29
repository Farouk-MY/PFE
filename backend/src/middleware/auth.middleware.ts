import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const openRoutes = [
        { path: '/api/auth', method: 'ALL' },
        { path: '/api/produit', method: 'GET' },
        { path: '/api/admins', method: 'POST' },
        { path: '/api/clients', method: 'POST' },
        { path: '/api/categories', method: 'GET' },
        { path: '/api/avis/produit', method: 'GET' }  // Add this line
    ];

    // Check if the route should skip authentication
    const shouldSkipAuth = openRoutes.some(route =>
        req.path.startsWith(route.path) &&
        (route.method === 'ALL' || req.method === route.method)
    );

    if (shouldSkipAuth) {
        next();
        return;
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Token manquant' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt');
        (req as any).user = decoded;
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        res.status(401).json({ error: 'Token invalide' });
    }
};