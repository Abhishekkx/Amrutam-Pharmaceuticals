import { Router } from 'express';
import { consultationController } from '../controllers/consultation.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { updateConsultationStatusSchema } from '../schemas/consultation.schema';

const router = Router();

router.get('/my', authenticate, consultationController.getMyConsultations);
router.get('/:id', authenticate, consultationController.getConsultation);
router.patch('/:id/status', authenticate, validateRequest(updateConsultationStatusSchema), consultationController.updateStatus);

export default router;
