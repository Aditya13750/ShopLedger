import { Router } from 'express';
import { ReminderController } from '../controllers/reminderController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', ReminderController.getReminders);
router.post('/send', ReminderController.sendManualReminder);
router.post('/trigger-auto', ReminderController.triggerAutomatedReminders);

export default router;
