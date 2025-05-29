import { Request, Response } from "express";

export const getDefault = (req: Request, res: Response): void => {
    res.json({
        msg: 'API fonctionnelle'
    });
};