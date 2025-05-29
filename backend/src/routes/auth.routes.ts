import { Router } from 'express';
import {
    resetPassword,
    verifyResetToken,
    login,
    adminLogin, // Add this import
    verifyEmail,
    resendVerificationEmail,
    checkEmail,
    changePassword
} from '../controllers/auth.controller';
import twoFactorRoutes from '../routes/twoFactor.routes';
import {authenticate} from "../middleware/auth.middleware";

const router = Router();
router.post('/login', login);
router.post('/admin/login', adminLogin); // Add this new route

// Email verification routes
router.get('/verify-email', verifyEmail);

// Password reset routes
router.post('/reset-password', resetPassword);
router.post('/verify-reset-token', verifyResetToken);
// Ajoutez cette route à votre router
router.get('/check-email', checkEmail);
router.post('/resend-verification', resendVerificationEmail);

router.post('/change-password', authenticate, changePassword);

// Two-factor authentication routes
router.use('/2fa', twoFactorRoutes);

export default router;