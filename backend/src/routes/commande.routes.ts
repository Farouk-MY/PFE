import { Router } from 'express';
import { 
    validatePanierAndCreateCommande,
    downloadInvoice,
    confirmCardPayment,confirmLivraison
} from '../controllers/commande.controller';

const router = Router();

router.post('/', validatePanierAndCreateCommande);
router.post('/confirm-payment', confirmCardPayment);
router.get('/:id/facture', downloadInvoice);
router.post('/:id/confirm-livraison', confirmLivraison);


export default router;