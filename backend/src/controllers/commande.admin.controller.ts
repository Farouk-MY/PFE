import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Retrieves all orders with basic information
 * Accessible only by admins
 */
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '10', sort = 'desc', search = '', status = '' } = req.query;

    try {
        // Parse pagination parameters
        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Build filter conditions
        const where: any = {};

        // Add search functionality
        if (search) {
            const searchTerm = search as string;
            where.OR = [
                {
                    client: {
                        utilisateur: {
                            OR: [
                                { nom: { contains: searchTerm, mode: 'insensitive' } },
                                { prenom: { contains: searchTerm, mode: 'insensitive' } },
                                { email: { contains: searchTerm, mode: 'insensitive' } }
                            ]
                        }
                    }
                },
                { id: isNaN(parseInt(searchTerm)) ? undefined : parseInt(searchTerm) }
            ].filter(Boolean);
        }

        // Add status filter if provided
        if (status) {
            where.livraison = {
                some: {
                    statutLivraison: status
                }
            };
        }

        // Get total count for pagination
        const totalOrders = await prisma.commande.count({ where });

        // Fetch orders with pagination, sorting and filtering
        const orders = await prisma.commande.findMany({
            where,
            include: {
                client: {
                    include: {
                        utilisateur: {
                            select: {
                                nom: true,
                                prenom: true,
                                email: true,
                                telephone: true
                            }
                        }
                    }
                },
                livraison: true,
                paiement: true
            },
            orderBy: {
                id: sort === 'desc' ? 'desc' : 'asc'
            },
            skip,
            take: limitNumber
        });

        // Format the response
        const formattedOrders = orders.map(order => ({
            id: order.id,
            date: order.livraison[0]?.date || null,
            clientName: `${order.client.utilisateur.prenom} ${order.client.utilisateur.nom}`,
            clientEmail: order.client.utilisateur.email,
            clientPhone: order.client.utilisateur.telephone,
            total: order.montantAPayer,
            status: order.livraison[0]?.statutLivraison || 'unknown',
            paymentMethod: order.paiement?.methode || 'pending',
            paymentStatus: order.paiement?.statut || 'pending'
        }));

        res.status(200).json({
            orders: formattedOrders,
            pagination: {
                total: totalOrders,
                page: pageNumber,
                limit: limitNumber,
                pages: Math.ceil(totalOrders / limitNumber)
            }
        });

    } catch (err) {
        console.error('Error fetching all orders:', err);
        res.status(500).json({
            error: 'Error fetching orders',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    } finally {
        await prisma.$disconnect();
    }
};

/**
 * Retrieves detailed information for a specific order
 * Accessible only by admins
 */
export const getOrderDetails = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: 'Invalid order ID' });
        return;
    }

    try {
        const orderDetails = await prisma.commande.findUnique({
            where: { id: Number(id) },
            include: {
                client: {
                    include: {
                        utilisateur: {
                            select: {
                                nom: true,
                                prenom: true,
                                email: true,
                                telephone: true,
                                ville: true,
                                codePostal: true,
                                gouvernorat: true
                            }
                        }
                    }
                },
                panier: {
                    include: {
                        lignePanier: {
                            include: {
                                produit: true
                            }
                        }
                    }
                },
                livraison: true,
                paiement: true
            }
        });

        if (!orderDetails) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Format the response with detailed information
        const formattedOrder = {
            id: orderDetails.id,
            orderInfo: {
                date: orderDetails.livraison[0]?.date || null,
                deliveryDate: orderDetails.dateLivraison,
                status: orderDetails.livraison[0]?.statutLivraison || 'unknown',
                deliveryAddress: orderDetails.livraison[0]?.detailPaiement || '',
                deliveryPerson: orderDetails.livraison[0]?.nomLivreur || 'Not assigned'
            },
            clientInfo: {
                id: orderDetails.client.id,
                name: `${orderDetails.client.utilisateur.prenom} ${orderDetails.client.utilisateur.nom}`,
                email: orderDetails.client.utilisateur.email,
                phone: orderDetails.client.utilisateur.telephone,
                address: {
                    city: orderDetails.client.utilisateur.ville,
                    postalCode: orderDetails.client.utilisateur.codePostal,
                    governorate: orderDetails.client.utilisateur.gouvernorat
                }
            },
            paymentInfo: {
                method: orderDetails.paiement?.methode || 'pending',
                status: orderDetails.paiement?.statut || 'pending',
                date: orderDetails.paiement?.date || null,
                cardDetails: orderDetails.paiement?.detailsCarte || null
            },
            financialInfo: {
                subtotal: orderDetails.total,
                discount: orderDetails.remise,
                discountPercentage: orderDetails.pourcentageRemise,
                pointsUsed: orderDetails.pointsUtilises,
                pointsAmount: orderDetails.montantPoint,
                deliveryFee: orderDetails.montantLivraison,
                totalAmount: orderDetails.montantAPayer,
                pointsEarned: orderDetails.pointsGagnes
            },
            items: orderDetails.panier.lignePanier.map(item => ({
                id: item.id,
                productId: item.produit_id,
                name: item.produit.designation,
                price: item.prix,
                quantity: item.qteCmd,
                subtotal: item.sousTotal,
                image: item.produit.images.length > 0 ? item.produit.images[0] : null
            }))
        };

        res.status(200).json(formattedOrder);

    } catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).json({
            error: 'Error fetching order details',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    } finally {
        await prisma.$disconnect();
    }
};

/**
 * Updates the status of an order's delivery
 * Accessible only by admins
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, nomLivreur } = req.body;

    if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: 'Invalid order ID' });
        return;
    }

    if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
    }

    // Validate status values
    const validStatuses = ['en_attente', 'en_preparation', 'en_cours_livraison', 'livrée', 'annulée'];
    if (!validStatuses.includes(status)) {
        res.status(400).json({
            error: 'Invalid status value',
            validValues: validStatuses
        });
        return;
    }

    try {
        const commande = await prisma.commande.findUnique({
            where: { id: Number(id) },
            include: { livraison: true }
        });

        if (!commande) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        if (!commande.livraison || commande.livraison.length === 0) {
            res.status(404).json({ error: 'No delivery associated with this order' });
            return;
        }

        // Update delivery status
        const updatedLivraison = await prisma.livraison.update({
            where: { id: commande.livraison[0].id },
            data: {
                statutLivraison: status,
                ...(nomLivreur && { nomLivreur })
            }
        });

        res.status(200).json({
            message: 'Order status updated successfully',
            livraison: updatedLivraison
        });

    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({
            error: 'Error updating order status',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    } finally {
        await prisma.$disconnect();
    }
};

/**
 * Get order statistics for admin dashboard
 */
export const getOrderStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get current date values for filtering
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get total orders count
        const totalOrders = await prisma.commande.count();

        // Count orders by status
        const ordersByStatus = await prisma.livraison.groupBy({
            by: ['statutLivraison'],
            _count: {
                id: true
            }
        });

        // Get revenue statistics
        const totalRevenue = await prisma.commande.aggregate({
            _sum: {
                montantAPayer: true
            }
        });

        // Get today's orders
        const todayOrders = await prisma.commande.count({
            where: {
                livraison: {
                    some: {
                        date: {
                            gte: startOfDay
                        }
                    }
                }
            }
        });

        // Get this week's orders
        const weekOrders = await prisma.commande.count({
            where: {
                livraison: {
                    some: {
                        date: {
                            gte: startOfWeek
                        }
                    }
                }
            }
        });

        // Get this month's orders
        const monthOrders = await prisma.commande.count({
            where: {
                livraison: {
                    some: {
                        date: {
                            gte: startOfMonth
                        }
                    }
                }
            }
        });

        // Format the status counts
        const statusCounts: Record<string, number> = {};
        ordersByStatus.forEach(status => {
            statusCounts[status.statutLivraison] = status._count.id;
        });

        res.status(200).json({
            totalOrders,
            statusCounts,
            revenue: {
                total: totalRevenue._sum.montantAPayer || 0
            },
            trends: {
                today: todayOrders,
                thisWeek: weekOrders,
                thisMonth: monthOrders
            }
        });

    } catch (err) {
        console.error('Error fetching order statistics:', err);
        res.status(500).json({
            error: 'Error fetching order statistics',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    } finally {
        await prisma.$disconnect();
    }
};