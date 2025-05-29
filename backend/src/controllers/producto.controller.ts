import { Request, Response } from "express";
import pool from "../db/connection";

export const getProductos = (req: Request, res: Response): void => {
    pool.query('SELECT * FROM utilisateur', (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
        } else {
            res.json({
                data: result.rows
            });
        }
    });
};