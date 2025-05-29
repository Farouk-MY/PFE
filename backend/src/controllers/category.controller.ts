// src/controllers/category.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all categories
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        produits: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error
        });
    }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                produits: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        if (!category) {
            res.status(404).json({
                success: false,
                message: 'Category not found'
            });
            return;
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error
        });
    }
};

// Create a new category
export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body;

        // Check if name was provided
        if (!name) {
            res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
            return;
        }

        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
            where: {
                name: name
            }
        });

        if (existingCategory) {
            res.status(409).json({
                success: false,
                message: 'Category with this name already exists'
            });
            return;
        }

        // Create new category
        const category = await prisma.category.create({
            data: {
                name
            }
        });

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error
        });
    }
};

// Update category
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Check if name was provided
        if (!name) {
            res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
            return;
        }

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: {
                id: parseInt(id)
            }
        });

        if (!existingCategory) {
            res.status(404).json({
                success: false,
                message: 'Category not found'
            });
            return;
        }

        // Check if name is already taken by another category
        const nameExists = await prisma.category.findFirst({
            where: {
                name,
                id: {
                    not: parseInt(id)
                }
            }
        });

        if (nameExists) {
            res.status(409).json({
                success: false,
                message: 'Another category with this name already exists'
            });
            return;
        }

        // Update category
        const updatedCategory = await prisma.category.update({
            where: {
                id: parseInt(id)
            },
            data: {
                name
            }
        });

        res.json({
            success: true,
            data: updatedCategory
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error
        });
    }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                produits: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        if (!category) {
            res.status(404).json({
                success: false,
                message: 'Category not found'
            });
            return;
        }

        // Check if category has associated products
        if (category.produits.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Cannot delete category with associated products',
                count: category.produits.length
            });
            return;
        }

        // Delete category
        await prisma.category.delete({
            where: {
                id: parseInt(id)
            }
        });

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error
        });
    }
};

// Search categories
export const searchCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;

        const categories = await prisma.category.findMany({
            where: {
                name: {
                    contains: query as string,
                    mode: 'insensitive'
                }
            },
            include: {
                _count: {
                    select: {
                        produits: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error searching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching categories',
            error: error
        });
    }
};