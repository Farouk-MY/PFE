import { Router } from 'express';
import {
    getAllOrders,
    getOrderDetails,
    updateOrderStatus,
    getOrderStatistics
} from '../controllers/commande.admin.controller';
import { authenticateAdmin } from '../middleware/role.middleware';

const router = Router();

// All routes here are protected with the admin middleware
router.get('/orders', authenticateAdmin, getAllOrders);
router.get('/orders/statistics', authenticateAdmin, getOrderStatistics);
router.get('/orders/:id', authenticateAdmin, getOrderDetails);
router.put('/orders/:id/status', authenticateAdmin, updateOrderStatus);

export default router;