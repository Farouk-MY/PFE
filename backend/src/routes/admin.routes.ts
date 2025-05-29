import { Router } from 'express';
import {createAdmin, blockUser, unblockUser, exportUsers, getAdminProfile} from '../controllers/admin.controller';
import {authenticateAdmin} from "../middleware/role.middleware";

const router = Router();

router.post('/admins', createAdmin);                         // Public route to create admin
router.get('/admins/me', authenticateAdmin, getAdminProfile); // Protected route
router.put('/users/:id/block', authenticateAdmin, blockUser); // Add authenticateAdmin
router.put('/users/:id/unblock', authenticateAdmin, unblockUser); // Add authenticateAdmin
router.get('/export-users/:format', authenticateAdmin, exportUsers as any);// Temporary 'as any' to bypass type checking

export default router;