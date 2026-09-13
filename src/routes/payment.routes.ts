import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  idempotencyMiddleware,
  paymentController.processPayment
);

export default router;
