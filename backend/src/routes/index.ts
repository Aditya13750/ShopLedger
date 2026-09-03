import { Router } from 'express';
import authRoutes from './authRoutes';
import customerRoutes from './customerRoutes';
import billRoutes from './billRoutes';
import paymentRoutes from './paymentRoutes';
import reminderRoutes from './reminderRoutes';
import whatsappRoutes from './whatsappRoutes';
import dashboardRoutes from './dashboardRoutes';
import settingsRoutes from './settingsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/bills', billRoutes);
router.use('/payments', paymentRoutes);
router.use('/reminders', reminderRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);

export default router;
