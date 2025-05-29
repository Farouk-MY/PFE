import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Add a product to favorites
 */
export const addToFavorites = async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.body;
    const clientId = (req as any).user.clientId;

    if (!productId) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
    }

    try {
        // Check if product exists
        const product = await prisma.produit.findUnique({
            where: { id: Number(productId) }
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        // Check if already in favorites
        const existingFavorite = await prisma.favorite.findUnique({
            where: {
                clientId_produitId: {
                    clientId: clientId,
                    produitId: Number(productId)
                }
            }
        });

        if (existingFavorite) {
            res.status(400).json({ error: 'This product is already in favorites', favorite: existingFavorite });
            return;
        }

        // Add to favorites
        const favorite = await prisma.favorite.create({
            data: {
                clientId: clientId,
                produitId: Number(productId)
            },
            include: {
                produit: true
            }
        });

        res.status(201).json({
            message: 'Product added to favorites successfully',
            favorite
        });

    } catch (err) {
        console.error('Error adding product to favorites:', err);
        res.status(500).json({
            error: 'Error adding product to favorites',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

/**
 * Remove a product from favorites
 */
export const removeFromFavorites = async (req: Request, res: Response): Promise<void> => {
    const { favoriteId } = req.params;
    const clientId = (req as any).user.clientId;

    try {
        // Check if the favorite exists and belongs to the client
        const favorite = await prisma.favorite.findFirst({
            where: {
                id: Number(favoriteId),
                clientId: clientId
            }
        });

        if (!favorite) {
            res.status(404).json({ error: 'Favorite not found or not authorized' });
            return;
        }

        // Delete the favorite
        await prisma.favorite.delete({
            where: { id: Number(favoriteId) }
        });

        res.status(200).json({
            message: 'Product removed from favorites successfully'
        });

    } catch (err) {
        console.error('Error removing product from favorites:', err);
        res.status(500).json({
            error: 'Error removing product from favorites',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

/**
 * Remove a product from favorites by product ID
 */
export const removeFromFavoritesByProductId = async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.params;
    const clientId = (req as any).user.clientId;

    try {
        // Check if the favorite exists and belongs to the client
        const favorite = await prisma.favorite.findFirst({
            where: {
                produitId: Number(productId),
                clientId: clientId
            }
        });

        if (!favorite) {
            res.status(404).json({ error: 'This product is not in favorites' });
            return;
        }

        // Delete the favorite
        await prisma.favorite.delete({
            where: { id: favorite.id }
        });

        res.status(200).json({
            message: 'Product removed from favorites successfully'
        });

    } catch (err) {
        console.error('Error removing product from favorites:', err);
        res.status(500).json({
            error: 'Error removing product from favorites',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

/**
 * Get all favorite products for the client
 */
export const getFavorites = async (req: Request, res: Response): Promise<void> => {
    const clientId = (req as any).user.clientId;

    try {
        // Get all favorites with product details
        const favorites = await prisma.favorite.findMany({
            where: { clientId: clientId },
            include: {
                produit: true
            },
            orderBy: { addedAt: 'desc' }
        });

        res.status(200).json(favorites);

    } catch (err) {
        console.error('Error getting favorites:', err);
        res.status(500).json({
            error: 'Error retrieving favorites',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

/**
 * Check if a product is in favorites
 */
export const checkFavorite = async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.params;
    const clientId = (req as any).user.clientId;

    try {
        // Check if the product is in favorites
        const favorite = await prisma.favorite.findUnique({
            where: {
                clientId_produitId: {
                    clientId: clientId,
                    produitId: Number(productId)
                }
            }
        });

        res.status(200).json({
            isFavorite: !!favorite,
            favoriteId: favorite?.id
        });

    } catch (err) {
        console.error('Error checking favorite status:', err);
        res.status(500).json({
            error: 'Error checking favorite status',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};