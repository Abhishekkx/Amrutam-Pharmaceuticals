import { v4 as uuidv4 } from 'uuid';
import { paymentRepository } from '../repositories/payment.repository';
import { consultationRepository } from '../repositories/consultation.repository';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { PaymentStatus } from '../constants/enums';
import { auditLogRepository } from '../repositories/auditLog.repository';

export class PaymentService {
  public async processPayment(
    userId: string,
    data: { consultationId: string; amount: number; idempotencyKey?: string },
    correlationId?: string,
    ipAddress?: string
  ) {
    if (data.idempotencyKey) {
      const existing = await paymentRepository.findByIdempotencyKey(data.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    const consultation = await consultationRepository.findById(data.consultationId);
    if (!consultation) {
      throw new NotFoundError('Consultation not found');
    }

    if (consultation.patientId !== userId) {
      throw new BadRequestError('Payment user must match consultation patient');
    }

    const existingPayment = await paymentRepository.findByConsultationId(data.consultationId);
    if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
      throw new ConflictError('Consultation is already paid for');
    }

    const transactionRef = `TXN-${uuidv4().substring(0, 8).toUpperCase()}`;

    const payment = await paymentRepository.create({
      consultationId: data.consultationId,
      userId,
      amount: data.amount,
      transactionRef,
      idempotencyKey: data.idempotencyKey,
    });

    const updatedPayment = await paymentRepository.updateStatus(payment.id, PaymentStatus.COMPLETED);

    await auditLogRepository.create({
      actorId: userId,
      action: 'PAYMENT_COMPLETED',
      resource: 'Payment',
      resourceId: updatedPayment.id,
      correlationId,
      ipAddress,
      metadata: { amount: data.amount, transactionRef },
    });

    return updatedPayment;
  }
}

export const paymentService = new PaymentService();
