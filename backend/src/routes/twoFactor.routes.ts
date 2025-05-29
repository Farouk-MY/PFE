import { Router } from 'express';
import {
    setupTwoFactor,
    verifyAndEnableTwoFactor,
    disableTwoFactor,
    verifyTwoFactorToken,
    getTwoFactorStatus,
    generateNewBackupCodes
} from '../controllers/twoFactor.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Routes that require authentication
router.get('/status', authenticate, getTwoFactorStatus);
router.post('/setup', authenticate, setupTwoFactor);
router.post('/verify', authenticate, verifyAndEnableTwoFactor);
router.post('/disable', authenticate, disableTwoFactor);
router.post('/backup-codes', authenticate, generateNewBackupCodes);

// Public route for verifying 2FA during login
router.post('/verify-login', verifyTwoFactorToken);

export default router;