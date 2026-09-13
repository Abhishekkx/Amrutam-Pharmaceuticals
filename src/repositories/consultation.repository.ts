import { prisma } from './prisma';
import { ConsultationStatus } from '../constants/enums';

export class ConsultationRepository {
  public async findById(id: string) {
    return prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, email: true, profile: true } },
        doctor: { select: { id: true, userId: true, specialty: true, user: { select: { profile: true } } } },
        slot: true,
        prescription: true,
        payment: true,
      },
    });
  }

  public async findByPatient(patientId: string) {
    return prisma.consultation.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { specialty: true, user: { select: { profile: true } } } },
        slot: true,
        prescription: true,
        payment: true,
      },
    });
  }

  public async findByDoctor(doctorId: string) {
    return prisma.consultation.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { email: true, profile: true } },
        slot: true,
        prescription: true,
        payment: true,
      },
    });
  }

  public async updateStatus(id: string, status: ConsultationStatus, notes?: string) {
    return prisma.consultation.update({
      where: { id },
      data: {
        status,
        ...(notes ? { notes } : {}),
      },
      include: {
        slot: true,
        patient: true,
        doctor: true,
      },
    });
  }
}

export const consultationRepository = new ConsultationRepository();
