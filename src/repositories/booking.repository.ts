import { prisma } from './prisma';
import { ConflictError, NotFoundError } from '../utils/errors';
import { ConsultationStatus } from '../constants/enums';

export class BookingRepository {
  public async bookSlotAtomic(patientId: string, slotId: string) {
    return prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw new NotFoundError('Availability slot not found');
      }

      if (slot.isBooked) {
        throw new ConflictError('Availability slot is already booked');
      }

      const updatedSlotCount = await tx.availabilitySlot.updateMany({
        where: {
          id: slotId,
          isBooked: false,
          version: slot.version,
        },
        data: {
          isBooked: true,
          version: { increment: 1 },
        },
      });

      if (updatedSlotCount.count === 0) {
        throw new ConflictError('Availability slot was concurrently booked by another patient');
      }

      const consultation = await tx.consultation.create({
        data: {
          patientId,
          doctorId: slot.doctorId,
          slotId: slot.id,
          status: ConsultationStatus.SCHEDULED,
        },
        include: {
          patient: { select: { email: true, profile: true } },
          doctor: { select: { specialty: true, consultationFee: true, user: { select: { profile: true } } } },
          slot: true,
        },
      });

      return consultation;
    });
  }
}

export const bookingRepository = new BookingRepository();
