import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/summary', DashboardController.getSummary);
router.get('/analytics', DashboardController.getAnalytics);

export default router;
