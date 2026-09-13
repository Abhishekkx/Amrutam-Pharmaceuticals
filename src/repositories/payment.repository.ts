import { prisma } from './prisma';
import { PaymentStatus } from '../constants/enums';

export class PaymentRepository {
  public async create(data: {
    consultationId: string;
    userId: string;
    amount: number;
    currency?: string;
    transactionRef: string;
    idempotencyKey?: string;
  }) {
    return prisma.payment.create({
      data: {
        consultationId: data.consultationId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency || 'INR',
        status: PaymentStatus.PENDING,
        transactionRef: data.transactionRef,
        idempotencyKey: data.idempotencyKey || null,
      },
    });
  }

  public async updateStatus(id: string, status: PaymentStatus) {
    return prisma.payment.update({
      where: { id },
      data: { status },
    });
  }

  public async findByIdempotencyKey(idempotencyKey: string) {
    return prisma.payment.findUnique({
      where: { idempotencyKey },
    });
  }

  public async findByConsultationId(consultationId: string) {
    return prisma.payment.findUnique({
      where: { consultationId },
    });
  }
}

export const paymentRepository = new PaymentRepository();
