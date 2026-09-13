import { Response } from 'express';
import { CustomRequest } from '../middlewares/correlation.middleware';
import { paymentService } from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';

export class PaymentController {
  public processPayment = asyncHandler(async (req: CustomRequest, res: Response) => {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    const payment = await paymentService.processPayment(
      req.user!.userId,
      { ...req.body, idempotencyKey },
      req.correlationId,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: payment,
    });
  });
}

export const paymentController = new PaymentController();
