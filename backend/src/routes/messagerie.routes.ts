import { Router } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import * as messagerieController from '../controllers/messagerie.controller';

export const setupMessagerieRoutes = (io: SocketIOServer): Router => {
    const router = Router();

    // Initialize Socket.io in controller
    messagerieController.initSocket(io);

    // Client sends message to admin
    router.post('/send-message', messagerieController.sendMessageToAdmin);

    // Admin replies to client message
    router.post('/reply-message', messagerieController.replyToClientMessage);

    // Get messages for a specific client
    router.get('/client-messages/:utilisateur_id', messagerieController.getClientMessages);

    // Get all messages for admin view
    router.get('/all-messages', messagerieController.getAllMessagesForAdmin);

    // Mark message as read
    router.patch('/messages/:id/read', messagerieController.markMessageAsRead);

    // Export functions
    router.get('/export-csv', messagerieController.exportClientMessagesToCSV);
    router.get('/export-pdf', messagerieController.exportClientMessagesToPDF);

    // Get admin replies
    router.get('/admin-replies', messagerieController.getAdminReplies);

    return router;
};