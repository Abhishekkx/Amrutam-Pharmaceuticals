import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware';
import { bookSlotSchema } from '../schemas/booking.schema';
import { Role } from '../constants/enums';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(Role.PATIENT, Role.ADMIN),
  idempotencyMiddleware,
  validateRequest(bookSlotSchema),
  bookingController.bookConsultation
);

export default router;
