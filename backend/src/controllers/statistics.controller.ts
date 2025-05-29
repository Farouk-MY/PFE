// src/controllers/statistics.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStatistics = async (req: Request, res: Response) => {
    try {
        // Calculate total revenue
        const totalRevenueResult = await prisma.commande.aggregate({
            _sum: {
                total: true,
            },
        });
        const totalRevenue = totalRevenueResult._sum.total || 0;

        // Count total orders
        const totalOrders = await prisma.commande.count();

        // Count new customers (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newCustomers = await prisma.client.count({
            where: {
                utilisateur: {
                    inscritLe: {
                        gte: thirtyDaysAgo,
                    },
                },
            },
        });

        // Calculate average order value
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Get sales data for the last 6 months
        const salesData = await getSalesData();

        // Get category distribution
        const categoryData = await getCategoryData();

        // Get traffic data (simplified - in a real app you'd track this separately)
        const trafficData = await getTrafficData();

        // Get recent orders
        const recentOrders = await prisma.commande.findMany({
            take: 5,
            orderBy: {
                id: 'desc',
            },
            include: {
                client: {
                    include: {
                        utilisateur: true,
                    },
                },
                panier: true,
                livraison: true, // Added to include livraison
            },
        });

        // Count pending orders
        const pendingOrders = await prisma.commande.count({
            where: {
                livraison: {
                    some: {
                        statutLivraison: 'pending',
                    },
                },
            },
        });

        res.json({
            totalRevenue,
            totalOrders,
            newCustomers,
            avgOrderValue,
            salesData,
            categoryData,
            trafficData,
            pendingOrders,
            recentOrders: recentOrders.map(order => ({
                id: order.id,
                customer: `${order.client.utilisateur.prenom} ${order.client.utilisateur.nom}`,
                amount: order.total,
                date: order.panier.date,
                status: order.livraison[0]?.statutLivraison || 'pending', // Access first livraison element
            })),
        });
    } catch (error:any) {
        console.error('Error fetching statistics:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};;

async function getSalesData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const result = [];

    for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthName = months[monthIndex];

        // Calculate start and end dates for the month
        const startDate = new Date();
        startDate.setMonth(monthIndex, 1);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);

        // Get sales for the month
        const sales = await prisma.commande.aggregate({
            _sum: {
                total: true,
            },
            where: {
                panier: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
        });

        const profit = sales._sum.total ? sales._sum.total * 0.3 : 0; // Assuming 30% profit margin

        // Get unique customers for the month (fixed the distinct count issue)
        const customerOrders = await prisma.commande.findMany({
            where: {
                panier: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
            select: {
                client_id: true,
            },
            distinct: ['client_id'],
        });

        const customers = customerOrders.length;

        result.push({
            month: monthName,
            sales: sales._sum.total || 0,
            profit,
            customers,
        });
    }

    return result;
}

async function getCategoryData() {
    const categories = await prisma.category.findMany({
        include: {
            produits: {
                include: {
                    lignePanier: {
                        include: {
                            panier: true,
                        },
                    },
                },
            },
        },
    });

    return categories.map(category => {
        const sales = category.produits.reduce((sum, product) => {
            return sum + product.lignePanier.reduce((sum, line) => sum + line.sousTotal, 0);
        }, 0);

        return {
            name: category.name,
            value: sales,
        };
    });
}

async function getTrafficData() {
    // In a real app, you'd have a separate table for tracking traffic
    // For demo purposes, we'll generate some random data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
        name: day,
        value: Math.floor(Math.random() * 2000) + 500,
    }));
}