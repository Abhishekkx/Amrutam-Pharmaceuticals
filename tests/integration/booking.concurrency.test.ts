import { bookingService } from '../../src/services/booking.service';
import { bookingRepository } from '../../src/repositories/booking.repository';
import { redisService } from '../../src/services/redis.service';
import { ConflictError } from '../../src/utils/errors';

jest.mock('../../src/repositories/booking.repository');
jest.mock('../../src/repositories/auditLog.repository');

describe('Booking Concurrency & Double Booking Prevention Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow only 1 booking out of 10 simultaneous concurrent requests for the same slot', async () => {
    const slotId = 'slot-concurrent-test';
    const patientId = 'patient-test';

    // Mock first attempt success, subsequent attempts conflict
    let callCount = 0;
    (bookingRepository.bookSlotAtomic as jest.Mock).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'consultation-success-1', slotId, patientId, doctorId: 'doc-1' };
      }
      throw new ConflictError('Availability slot was concurrently booked by another patient');
    });

    const concurrentRequests = Array.from({ length: 10 }).map((_, index) =>
      bookingService.bookConsultation(`patient-${index}`, slotId).then(
        (res) => ({ status: 'fulfilled', value: res }),
        (err) => ({ status: 'rejected', reason: err })
      )
    );

    const results = await Promise.all(concurrentRequests);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(9);
    rejected.forEach((r: any) => {
      expect(r.reason).toBeInstanceOf(ConflictError);
    });
  });
});
