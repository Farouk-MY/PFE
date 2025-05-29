import { Router } from 'express';
import { createPanier, addProductToPanier } from '../controllers/panier.controller';

const router = Router();

// Route pour créer un panier
router.post('/', createPanier);

// Route pour ajouter un produit au panier
router.post('/:panier_id/add-product', addProductToPanier);

export default router;