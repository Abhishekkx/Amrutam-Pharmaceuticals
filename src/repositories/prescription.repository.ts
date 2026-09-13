import { prisma } from './prisma';

export class PrescriptionRepository {
  public async create(data: {
    consultationId: string;
    doctorId: string;
    patientId: string;
    medications: any;
    instructions: string;
    digitalSignature: string;
  }) {
    return prisma.prescription.create({
      data: {
        consultationId: data.consultationId,
        doctorId: data.doctorId,
        patientId: data.patientId,
        medications: data.medications,
        instructions: data.instructions,
        digitalSignature: data.digitalSignature,
      },
      include: {
        doctor: { select: { id: true, userId: true, specialty: true, user: { select: { id: true, profile: true } } } },
        consultation: true,
      },
    });
  }

  public async findByConsultationId(consultationId: string) {
    return prisma.prescription.findUnique({
      where: { consultationId },
      include: {
        doctor: { select: { id: true, userId: true, specialty: true, user: { select: { id: true, profile: true } } } },
        consultation: true,
      },
    });
  }

  public async findByPatient(patientId: string) {
    return prisma.prescription.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { id: true, userId: true, specialty: true, user: { select: { id: true, profile: true } } } },
        consultation: true,
      },
    });
  }
}

export const prescriptionRepository = new PrescriptionRepository();
