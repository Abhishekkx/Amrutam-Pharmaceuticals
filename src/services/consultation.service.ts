import { consultationRepository } from '../repositories/consultation.repository';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { ConsultationStatus, Role } from '../constants/enums';
import { auditLogRepository } from '../repositories/auditLog.repository';

const VALID_TRANSITIONS: Record<ConsultationStatus, ConsultationStatus[]> = {
  [ConsultationStatus.SCHEDULED]: [ConsultationStatus.IN_PROGRESS, ConsultationStatus.CANCELLED],
  [ConsultationStatus.IN_PROGRESS]: [ConsultationStatus.COMPLETED, ConsultationStatus.CANCELLED],
  [ConsultationStatus.COMPLETED]: [],
  [ConsultationStatus.CANCELLED]: [],
};

export class ConsultationService {
  public async getConsultation(id: string, user: { userId: string; role: Role }) {
    const consultation = await consultationRepository.findById(id);
    if (!consultation) {
      throw new NotFoundError('Consultation not found');
    }

    if (user.role !== Role.ADMIN) {
      const isPatient = user.role === Role.PATIENT && consultation.patientId === user.userId;
      const isDoctor = user.role === Role.DOCTOR && consultation.doctor.userId === user.userId;
      if (!isPatient && !isDoctor) {
        throw new ForbiddenError('You do not have permission to view this consultation');
      }
    }

    return consultation;
  }

  public async getUserConsultations(user: { userId: string; role: Role }) {
    if (user.role === Role.PATIENT) {
      return consultationRepository.findByPatient(user.userId);
    } else if (user.role === Role.DOCTOR) {
      return consultationRepository.findByDoctor(user.userId);
    } else {
      return [];
    }
  }

  public async updateStatus(
    id: string,
    newStatus: ConsultationStatus,
    notes: string | undefined,
    user: { userId: string; role: Role },
    correlationId?: string,
    ipAddress?: string
  ) {
    const consultation = await consultationRepository.findById(id);
    if (!consultation) {
      throw new NotFoundError('Consultation not found');
    }

    if (user.role !== Role.ADMIN) {
      const isDoctor = user.role === Role.DOCTOR && consultation.doctor.userId === user.userId;
      const isPatient = user.role === Role.PATIENT && consultation.patientId === user.userId;
      if (!isDoctor && !isPatient) {
        throw new ForbiddenError('You are not authorized to update this consultation state');
      }
    }

    if (user.role === Role.PATIENT && newStatus !== ConsultationStatus.CANCELLED) {
      throw new ForbiddenError('Patients are only allowed to cancel scheduled consultations');
    }

    const allowed = VALID_TRANSITIONS[consultation.status as ConsultationStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from ${consultation.status} to ${newStatus}`
      );
    }

    const updated = await consultationRepository.updateStatus(id, newStatus, notes);

    await auditLogRepository.create({
      actorId: user.userId,
      action: 'CONSULTATION_STATUS_UPDATED',
      resource: 'Consultation',
      resourceId: id,
      correlationId,
      ipAddress,
      metadata: { from: consultation.status, to: newStatus },
    });

    return updated;
  }
}

export const consultationService = new ConsultationService();
