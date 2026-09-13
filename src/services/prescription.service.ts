import crypto from 'crypto';
import { prescriptionRepository } from '../repositories/prescription.repository';
import { consultationRepository } from '../repositories/consultation.repository';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { ConsultationStatus, Role } from '../constants/enums';
import { auditLogRepository } from '../repositories/auditLog.repository';

export class PrescriptionService {
  public async createPrescription(
    doctorId: string,
    data: {
      consultationId: string;
      medications: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
      instructions: string;
    },
    correlationId?: string,
    ipAddress?: string
  ) {
    const consultation = await consultationRepository.findById(data.consultationId);
    if (!consultation) {
      throw new NotFoundError('Consultation not found');
    }

    if (consultation.doctor.userId !== doctorId) {
      throw new ForbiddenError('Only the assigned doctor can issue a prescription for this consultation');
    }

    if (consultation.status !== ConsultationStatus.IN_PROGRESS && consultation.status !== ConsultationStatus.COMPLETED) {
      throw new BadRequestError('Prescriptions can only be issued for consultations IN_PROGRESS or COMPLETED');
    }

    const signaturePayload = `${consultation.id}:${doctorId}:${JSON.stringify(data.medications)}:${Date.now()}`;
    const digitalSignature = crypto.createHash('sha256').update(signaturePayload).digest('hex');

    const prescription = await prescriptionRepository.create({
      consultationId: data.consultationId,
      doctorId: consultation.doctorId,
      patientId: consultation.patientId,
      medications: data.medications,
      instructions: data.instructions,
      digitalSignature,
    });

    await auditLogRepository.create({
      actorId: doctorId,
      action: 'PRESCRIPTION_CREATED',
      resource: 'Prescription',
      resourceId: prescription.id,
      correlationId,
      ipAddress,
      metadata: { consultationId: data.consultationId },
    });

    return prescription;
  }

  public async getPrescriptionByConsultation(consultationId: string, user: { userId: string; role: Role }) {
    const prescription = await prescriptionRepository.findByConsultationId(consultationId);
    if (!prescription) {
      throw new NotFoundError('Prescription not found for this consultation');
    }

    if (user.role !== Role.ADMIN) {
      const isPatient = user.role === Role.PATIENT && prescription.patientId === user.userId;
      const isDoctor = user.role === Role.DOCTOR && prescription.doctor.userId === user.userId;
      if (!isPatient && !isDoctor) {
        throw new ForbiddenError('You are not authorized to view this prescription');
      }
    }

    return prescription;
  }

  public async getPatientPrescriptions(patientId: string) {
    return prescriptionRepository.findByPatient(patientId);
  }
}

export const prescriptionService = new PrescriptionService();
