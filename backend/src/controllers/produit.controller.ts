// src/controllers/produit.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { cloudinary } from '../config/cloudinary';

const prisma = new PrismaClient();

// Create a new product with images
export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            designation,
            description,
            qteStock,
            prix,
            nbrPoint,
            seuilMin,
            productTempId,
            categoryId
        } = req.body;

        // Get uploaded files from multer
        const files = req.files as Express.Multer.File[];

        // Extract image URLs from uploaded files
        const imageUrls = files ? files.map(file => (file as any).path) : [];

        // Create product with image URLs
        const product = await prisma.produit.create({
            data: {
                designation,
                description,
                qteStock: parseInt(qteStock),
                prix: parseFloat(prix),
                nbrPoint: parseInt(nbrPoint),
                seuilMin: parseInt(seuilMin),
                categoryId: categoryId ? parseInt(categoryId) : null, // Add category relationship
                images: imageUrls
            }
        });

        // If we used a temporary folder, rename it to the actual product ID
        if (productTempId && productTempId.startsWith('temp-')) {
            try {
                // Move files from temp folder to product ID folder
                await cloudinary.api.create_folder(`products/${product.id}`);

                const newImageUrls = [];

                // Move each image to the new folder
                for (const imageUrl of imageUrls) {
                    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
                    const fileExt = imageUrl.split('.').pop();

                    // Extract just the filename without path
                    const fileName = publicId.split('/').pop();

                    // New public ID with product ID folder
                    const newPublicId = `products/${product.id}/${fileName}`;

                    // Move the file
                    const result = await cloudinary.uploader.rename(publicId, newPublicId);
                    newImageUrls.push(result.secure_url);
                }

                // Update product with new image URLs
                await prisma.produit.update({
                    where: { id: product.id },
                    data: { images: newImageUrls }
                });

                // Try to delete the temporary folder
                try {
                    await cloudinary.api.delete_folder(`products/${productTempId}`);
                } catch (folderErr) {
                    console.log("Temp folder may not be empty or couldn't be deleted:", folderErr);
                }

                // Update the product object to return the latest data
                product.images = newImageUrls;
            } catch (moveErr) {
                console.error("Error moving images to product folder:", moveErr);
                // Continue despite error - the product was created successfully
            }
        }

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error
        });
    }
};

// Get all products
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await prisma.produit.findMany({
            where: {
                deleted: false
            },
            include: {
                category: true // Include category information
            }
        });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error
        });
    }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const product = await prisma.produit.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                category: true, // Include category information
                avis: {
                    include: {
                        utilisateur: {
                            select: {
                                nom: true,
                                prenom: true,
                                id: true
                            }
                        }
                    }
                }
            }
        });

        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found'
            });
            return;
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error
        });
    }
};

// Update product with new images
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            designation,
            description,
            qteStock,
            prix,
            nbrPoint,
            seuilMin,
            keepImages,
            categoryId
        } = req.body;

        // Get current product to access existing images
        const currentProduct = await prisma.produit.findUnique({
            where: { id: parseInt(id) }
        });

        if (!currentProduct) {
            res.status(404).json({
                success: false,
                message: 'Product not found'
            });
            return;
        }

        // Handle image management
        let imagesToKeep: string[] = [];

        // Keep selected existing images if specified
        if (keepImages && Array.isArray(keepImages)) {
            imagesToKeep = keepImages;
        }

        // Delete images that are not kept
        if (currentProduct.images.length > 0) {
            for (const imageUrl of currentProduct.images) {
                if (!imagesToKeep.includes(imageUrl)) {
                    // Extract public_id from Cloudinary URL
                    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
                    // Delete image from Cloudinary
                    await cloudinary.uploader.destroy(publicId);
                }
            }
        }

        // Get new uploaded files
        const files = req.files as Express.Multer.File[];

        // Extract image URLs from newly uploaded files
        const newImageUrls = files ? files.map(file => (file as any).path) : [];

        // Combine kept images and new images
        const allImages = [...imagesToKeep, ...newImageUrls];

        // Update product with images
        const updatedProduct = await prisma.produit.update({
            where: {
                id: parseInt(id)
            },
            data: {
                designation,
                description,
                qteStock: parseInt(qteStock),
                prix: parseFloat(prix),
                nbrPoint: parseInt(nbrPoint),
                seuilMin: parseInt(seuilMin),
                categoryId: categoryId ? parseInt(categoryId) : currentProduct.categoryId, // Update category relationship
                images: allImages
            },
            include: {
                category: true // Include category in response
            }
        });

        res.json({
            success: true,
            data: updatedProduct
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error
        });
    }
};

// Delete product and all its images
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Get product details first
        const product = await prisma.produit.findUnique({
            where: {
                id: parseInt(id)
            }
        });

        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found'
            });
            return;
        }

        // Soft delete the product
        await prisma.produit.update({
            where: {
                id: parseInt(id)
            },
            data: {
                deleted: true
            }
        });

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error
        });
    }
};

// Hard delete product and all its images from Cloudinary
export const hardDeleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Get product details first
        const product = await prisma.produit.findUnique({
            where: {
                id: parseInt(id)
            }
        });

        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found'
            });
            return;
        }

        // Delete all product images from Cloudinary
        if (product.images && product.images.length > 0) {
            for (const imageUrl of product.images) {
                try {
                    // Extract public_id from Cloudinary URL
                    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                } catch (error) {
                    console.error(`Failed to delete image: ${imageUrl}`, error);
                }
            }
        }

        // Delete product folder in Cloudinary
        try {
            await cloudinary.api.delete_folder(`products/${id}`);
        } catch (error) {
            console.error(`Failed to delete product folder`, error);
        }

        // Delete the product from database
        await prisma.produit.delete({
            where: {
                id: parseInt(id)
            }
        });

        res.json({
            success: true,
            message: 'Product and all its images permanently deleted'
        });
    } catch (error) {
        console.error('Error hard deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Error hard deleting product',
            error: error
        });
    }
};

// Search products
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, categoryId } = req.query;

        const filters: any = {
            deleted: false,
        };

        // Add category filter if provided
        if (categoryId) {
            filters.categoryId = parseInt(categoryId as string);
        }

        // Add search term filter if provided
        if (query) {
            filters.OR = [
                {
                    designation: {
                        contains: query as string,
                        mode: 'insensitive'
                    }
                },
                {
                    description: {
                        contains: query as string,
                        mode: 'insensitive'
                    }
                }
            ];
        }

        const products = await prisma.produit.findMany({
            where: filters,
            include: {
                category: true
            }
        });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching products',
            error: error
        });
    }
};

// Check stock
export const checkStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const product = await prisma.produit.findUnique({
            where: {
                id: parseInt(id)
            },
            select: {
                id: true,
                designation: true,
                qteStock: true,
                seuilMin: true
            }
        });

        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found'
            });
            return;
        }

        const isLowStock = product.qteStock <= product.seuilMin;

        res.json({
            success: true,
            data: {
                ...product,
                isLowStock
            }
        });
    } catch (error) {
        console.error('Error checking stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking stock',
            error: error
        });
    }
};

// Get product dashboard
export const getProductDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const product = await prisma.produit.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                category: true,
                avis: true,
                clientsAcheteurs: {
                    select: {
                        id: true,
                        utilisateur: {
                            select: {
                                nom: true,
                                prenom: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found'
            });
            return;
        }

        // Calculate average rating
        const avgRating = product.avis.length > 0
            ? product.avis.reduce((sum, avis) => sum + avis.note, 0) / product.avis.length
            : 0;

        res.json({
            success: true,
            data: {
                ...product,
                avgRating,
                totalPurchases: product.clientsAcheteurs.length
            }
        });
    } catch (error) {
        console.error('Error getting product dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting product dashboard',
            error: error
        });
    }
};

// Update stock
export const updateStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { qteStock } = req.body;

        const updatedProduct = await prisma.produit.update({
            where: {
                id: parseInt(id)
            },
            data: {
                qteStock: parseInt(qteStock)
            }
        });

        res.json({
            success: true,
            data: updatedProduct
        });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating stock',
            error: error
        });
    }
};

// Get low stock products
export const getLowStockProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await prisma.produit.findMany({
            where: {
                deleted: false
            },
            include: {
                category: true
            }
        });

        const lowStockProducts = products.filter(product => product.qteStock <= product.seuilMin);

        res.json({
            success: true,
            data: lowStockProducts
        });
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching low stock products',
            error: error
        });
    }
};

// Get trending products
export const getTrendingProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get products with at least one purchase (client relationship)
        const productsWithPurchases = await prisma.produit.findMany({
            where: {
                deleted: false,
                clientsAcheteurs: {
                    some: {}
                }
            },
            include: {
                category: true,
                clientsAcheteurs: true,
                avis: true
            }
        });

        // Sort by number of purchases (client relationships)
        const trendingProducts = productsWithPurchases
            .sort((a, b) => b.clientsAcheteurs.length - a.clientsAcheteurs.length)
            .slice(0, 10); // Get top 10

        // Calculate average ratings
        const trendingWithStats = trendingProducts.map(product => {
            const avgRating = product.avis.length > 0
                ? product.avis.reduce((sum, avis) => sum + avis.note, 0) / product.avis.length
                : 0;

            return {
                ...product,
                purchaseCount: product.clientsAcheteurs.length,
                avgRating: parseFloat(avgRating.toFixed(1))
            };
        });

        res.json({
            success: true,
            data: trendingWithStats
        });
    } catch (error) {
        console.error('Error fetching trending products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching trending products',
            error: error
        });
    }
};

// Get products by category
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { categoryId } = req.params;

        const products = await prisma.produit.findMany({
            where: {
                deleted: false,
                categoryId: parseInt(categoryId)
            },
            include: {
                category: true
            }
        });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products by category',
            error: error
        });
    }
};