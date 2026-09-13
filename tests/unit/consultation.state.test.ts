import { consultationService } from '../../src/services/consultation.service';
import { consultationRepository } from '../../src/repositories/consultation.repository';
import { ConsultationStatus, Role } from '../../src/constants/enums';
import { BadRequestError } from '../../src/utils/errors';

jest.mock('../../src/repositories/consultation.repository');
jest.mock('../../src/repositories/auditLog.repository');

describe('Consultation State Machine Unit Tests', () => {
  const mockConsultation = {
    id: 'consultation-1',
    patientId: 'patient-1',
    doctorId: 'doc-1',
    slotId: 'slot-1',
    status: ConsultationStatus.SCHEDULED,
    doctor: { userId: 'doc-user-1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject invalid status transition from SCHEDULED directly to COMPLETED', async () => {
    (consultationRepository.findById as jest.Mock).mockResolvedValue(mockConsultation);

    await expect(
      consultationService.updateStatus(
        'consultation-1',
        ConsultationStatus.COMPLETED,
        undefined,
        { userId: 'doc-user-1', role: Role.DOCTOR }
      )
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow valid status transition from SCHEDULED to IN_PROGRESS', async () => {
    (consultationRepository.findById as jest.Mock).mockResolvedValue(mockConsultation);
    (consultationRepository.updateStatus as jest.Mock).mockResolvedValue({
      ...mockConsultation,
      status: ConsultationStatus.IN_PROGRESS,
    });

    const result = await consultationService.updateStatus(
      'consultation-1',
      ConsultationStatus.IN_PROGRESS,
      'Starting consultation',
      { userId: 'doc-user-1', role: Role.DOCTOR }
    );

    expect(result.status).toBe(ConsultationStatus.IN_PROGRESS);
  });
});
