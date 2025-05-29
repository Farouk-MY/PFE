import { Router } from 'express';
import {
    getAllContacts,
    getContactById,
    updateContactStatus,
    updateContactPriority,
    replyToContact,
    deleteContact,
    getContactStats
} from '../controllers/adminContact.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All these routes need authentication
router.use(authenticate);

// Get statistics for dashboard
router.get('/stats', getContactStats);

// CRUD operations
router.get('/', getAllContacts);
router.get('/:id', getContactById);
router.patch('/:id/status', updateContactStatus);
router.patch('/:id/priority', updateContactPriority);
router.post('/:id/reply', replyToContact);
router.delete('/:id', deleteContact);

export default router;