import { Router } from 'express';
import { BillController } from '../controllers/billController';
import { authenticate } from '../middleware/authMiddleware';
import { uploadBillImage } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', BillController.createBill);
router.get('/', BillController.getBills);
router.get('/:id', BillController.getBillById);
router.put('/:id', BillController.updateBill);
router.delete('/:id', BillController.deleteBill);

// Image upload route
router.post('/:id/upload', uploadBillImage.single('billImage'), BillController.uploadImage);

// WhatsApp dispatch route
router.post('/:id/send-whatsapp', BillController.sendWhatsApp);

export default router;
