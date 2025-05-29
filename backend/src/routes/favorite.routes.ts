import { Router } from 'express';
import {
    addToFavorites,
    removeFromFavorites,
    removeFromFavoritesByProductId,
    getFavorites,
    checkFavorite
} from '../controllers/favorite.controller';
import { authenticateClient } from '../middleware/role.middleware';

const router = Router();

// All routes require client authentication
router.post('/favorites', authenticateClient, addToFavorites);
router.delete('/favorites/:favoriteId', authenticateClient, removeFromFavorites);
router.delete('/favorites/product/:productId', authenticateClient, removeFromFavoritesByProductId);
router.get('/favorites', authenticateClient, getFavorites);
router.get('/favorites/check/:productId', authenticateClient, checkFavorite);

export default router;