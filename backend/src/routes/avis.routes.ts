import { Router } from 'express';
import {
    createAvis,
    getAllAvis,
    getAvisById,
    updateAvis,
    deleteAvis,
    getAvisStats,
    getAvisProduit
} from '../controllers/avis.controller';

const router = Router();

router.post('/', createAvis); // Créer un avis (notation produit)
router.get('/', getAllAvis);
router.get('/stats', getAvisStats); // Statistiques des notes produits
router.get('/produit/:produit_id', getAvisProduit); // Avis d'un produit spécifique
router.get('/:id', getAvisById);
router.put('/:id', updateAvis);
router.delete('/:id', deleteAvis);

export default router;