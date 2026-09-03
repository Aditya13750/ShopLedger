import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsappController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public webhook endpoints for Meta WhatsApp Cloud API verification and delivery receipts
router.get('/webhook', WhatsAppController.verifyWebhook);
router.post('/webhook', WhatsAppController.handleWebhook);

// Protected endpoints
router.post('/send-bill', authenticate, WhatsAppController.sendBill);
router.post('/send-reminder', authenticate, WhatsAppController.sendReminder);
router.get('/history', authenticate, WhatsAppController.getHistory);

export default router;
