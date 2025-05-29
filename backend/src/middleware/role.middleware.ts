import { Request, Response, NextFunction } from 'express';
import { authenticate } from './auth.middleware';

export const isClient = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    console.log('User in isClient middleware:', user);

    if (user && user.role === 'client') {
        next();
        return;
    }

    res.status(403).json({ error: 'Accès refusé' });
};

// Fix the middleware composition
export const authenticateClient = (req: Request, res: Response, next: NextFunction): void => {
    authenticate(req, res, (err?: any) => {
        if (err) return next(err);
        isClient(req, res, next);
    });
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    console.log('User in isAdmin middleware:', user);

    if (user && user.role === 'admin') {
        next();
        return;
    }

    res.status(403).json({ error: 'Accès refusé' });
};

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
    authenticate(req, res, (err?: any) => {
        if (err) return next(err);
        isAdmin(req, res, next);
    });
};