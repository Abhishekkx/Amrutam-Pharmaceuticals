import { bookingRepository } from '../repositories/booking.repository';
import { redisService } from './redis.service';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { ConflictError } from '../utils/errors';
import { bookingCounter } from '../utils/metrics';

export class BookingService {
  public async bookConsultation(patientId: string, slotId: string, correlationId?: string, ipAddress?: string) {
    const lockKey = `lock:slot:${slotId}`;
    const acquiredLock = await redisService.acquireLock(lockKey, 10);

    if (!acquiredLock) {
      bookingCounter.inc({ status: 'double_booking_prevented' });
      await auditLogRepository.create({
        actorId: patientId,
        action: 'BOOKING_CONCURRENCY_BLOCKED',
        resource: 'AvailabilitySlot',
        resourceId: slotId,
        correlationId,
        ipAddress,
        metadata: { reason: 'Distributed lock acquisition failed' },
      });
      throw new ConflictError('Concurrent booking detected for this slot. Please try another slot.');
    }

    try {
      const consultation = await bookingRepository.bookSlotAtomic(patientId, slotId);

      bookingCounter.inc({ status: 'success' });
      await auditLogRepository.create({
        actorId: patientId,
        action: 'CONSULTATION_BOOKED',
        resource: 'Consultation',
        resourceId: consultation.id,
        correlationId,
        ipAddress,
        metadata: { doctorId: consultation.doctorId, slotId },
      });

      // Clear doctor cache
      await redisService.del(`doctor:${consultation.doctorId}`);

      return consultation;
    } catch (error: any) {
      bookingCounter.inc({ status: 'failed' });
      await auditLogRepository.create({
        actorId: patientId,
        action: 'BOOKING_FAILED',
        resource: 'AvailabilitySlot',
        resourceId: slotId,
        correlationId,
        ipAddress,
        metadata: { error: error.message },
      });
      throw error;
    } finally {
      await redisService.releaseLock(lockKey);
    }
  }
}

export const bookingService = new BookingService();
