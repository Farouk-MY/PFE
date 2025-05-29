import { Router } from 'express';
import { submitContact, getContactTypes } from '../controllers/contact.controller';

const router = Router();

// Public routes - no authentication needed
router.post('/', submitContact);
router.get('/types', getContactTypes);

export default router;