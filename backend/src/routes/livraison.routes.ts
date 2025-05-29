import { Router } from 'express';
import { 
    createLivraison, 
    getAllLivraisons, 
    updateLivraison 
} from '../controllers/livraison.controller';

const router = Router();

router.post('/', createLivraison);  // Changed from '/livraisons' to '/'
router.get('/', getAllLivraisons);  // Changed from '/livraisons' to '/'
router.put('/:id', updateLivraison);  // Changed from '/livraisons/:id' to '/:id'

export default router;