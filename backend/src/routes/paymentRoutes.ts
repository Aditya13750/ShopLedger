import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', PaymentController.recordPayment);
router.get('/', PaymentController.getPayments);
router.get('/:id', PaymentController.getPaymentById);
router.delete('/:id', PaymentController.deletePayment);

export default router;
