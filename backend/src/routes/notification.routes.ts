import { Router } from 'express';
import {
    sendNotificationToAllClients,
    markNotificationAsRead,
    getClientsWhoDidNotReadNotification,
    getClientsWhoReadNotification,
    exportNotificationStatus
} from '../controllers/notification.controller';

const router = Router();

// Route pour envoyer une notification à tous les clients
router.post('/send-to-all-clients', sendNotificationToAllClients);

// Route pour marquer une notification comme lue
router.put('/:notificationId/mark-as-read', markNotificationAsRead);

// Route pour récupérer les clients qui ont lu la notification
router.get('/read', getClientsWhoReadNotification);

// Route pour récupérer les clients qui n'ont pas lu la notification
router.get('/unread', getClientsWhoDidNotReadNotification);

// Route pour exporter le statut des notifications
router.get('/export-notification-status', exportNotificationStatus);

export default router;