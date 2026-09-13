import { Router } from 'express';
import { prescriptionController } from '../controllers/prescription.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createPrescriptionSchema } from '../schemas/prescription.schema';
import { Role } from '../constants/enums';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(Role.DOCTOR, Role.ADMIN),
  validateRequest(createPrescriptionSchema),
  prescriptionController.createPrescription
);

router.get('/my', authenticate, prescriptionController.getMyPrescriptions);
router.get('/consultation/:consultationId', authenticate, prescriptionController.getByConsultation);

export default router;
