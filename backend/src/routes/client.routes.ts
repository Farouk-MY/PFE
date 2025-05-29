import { Router } from 'express';
import {
    createClient, getHistoriqueAchats, getAllHistoriqueAchats,
    getMyProfile, updateUserInfo, getSoldePointsHistory,
    getClientOrdersCount, getClientPoints
} from '../controllers/client.controller';
import { authenticateClient, isClient } from '../middleware/role.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public route to create a client
router.post('/clients', createClient);

// Use the fixed authenticateClient middleware
router.get('/clients/me', authenticateClient, getMyProfile);
router.put('/clients/update', authenticateClient, updateUserInfo);
router.get('/clients/:clientId/historique', authenticate, isClient, getHistoriqueAchats);
router.get('/historique-global', authenticate, isClient, getAllHistoriqueAchats);
router.get('/clients/points-history', authenticateClient, getSoldePointsHistory);
router.get('/clients/orders/count', authenticateClient, getClientOrdersCount);
router.get('/clients/points', authenticateClient, getClientPoints);

export default router;