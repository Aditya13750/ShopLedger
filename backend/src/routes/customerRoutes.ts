import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all customer routes with authentication
router.use(authenticate);

router.post('/', CustomerController.createCustomer);
router.get('/', CustomerController.getCustomers);
router.get('/:id', CustomerController.getCustomerById);
router.put('/:id', CustomerController.updateCustomer);
router.delete('/:id', CustomerController.deleteCustomer);
router.get('/:id/ledger', CustomerController.getCustomerLedger);
router.post('/:id/recalculate', CustomerController.recalculateTotals);

export default router;
