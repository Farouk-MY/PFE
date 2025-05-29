import { Router } from 'express';
import {   getUsers, getUserById, searchUsers
} from '../controllers/user.controller';

const router = Router();


router.get('/all', getUsers); // Route pour récupérer tous les utilisateurs
router.get('/search', searchUsers); // Route pour rechercher des utilisateurs
router.get('/:id', getUserById); // Route pour récupérer un utilisateur par son ID
export default router;