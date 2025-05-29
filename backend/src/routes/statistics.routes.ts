import { Router } from 'express';
import { authenticateAdmin } from '../middleware/role.middleware';
import { getStatistics } from '../controllers/statistics.controller';

const router = Router();

router.get('/admin/statistics', authenticateAdmin, getStatistics);

export default router;