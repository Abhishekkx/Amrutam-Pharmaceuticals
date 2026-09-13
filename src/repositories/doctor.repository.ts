import { prisma } from './prisma';

export interface DoctorFilter {
  specialty?: string;
  minRating?: number;
  maxFee?: number;
  limit?: number;
  offset?: number;
}

export class DoctorRepository {
  public async createDoctorProfile(data: {
    userId: string;
    specialty: string;
    experienceYears: number;
    consultationFee: number;
    bio?: string;
  }) {
    return prisma.doctor.create({
      data: {
        userId: data.userId,
        specialty: data.specialty,
        experienceYears: data.experienceYears,
        consultationFee: data.consultationFee,
        bio: data.bio,
      },
      include: {
        user: {
          select: {
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  public async findByUserId(userId: string) {
    return prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, profile: true } },
        availabilitySlots: {
          where: { isBooked: false, startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  public async findById(id: string) {
    return prisma.doctor.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, profile: true } },
        availabilitySlots: {
          where: { isBooked: false, startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  public async findMany(filter: DoctorFilter) {
    const where: any = { isVerified: true };

    if (filter.specialty) {
      where.specialty = { contains: filter.specialty, mode: 'insensitive' };
    }
    if (filter.minRating) {
      where.rating = { gte: filter.minRating };
    }
    if (filter.maxFee) {
      where.consultationFee = { lte: filter.maxFee };
    }

    return prisma.doctor.findMany({
      where,
      take: filter.limit || 20,
      skip: filter.offset || 0,
      orderBy: { rating: 'desc' },
      include: {
        user: { select: { email: true, profile: true } },
        availabilitySlots: {
          where: { isBooked: false, startTime: { gte: new Date() } },
          take: 5,
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  public async createAvailabilitySlot(data: { doctorId: string; startTime: Date; endTime: Date }) {
    return prisma.availabilitySlot.create({
      data: {
        doctorId: data.doctorId,
        startTime: data.startTime,
        endTime: data.endTime,
        isBooked: false,
      },
    });
  }

  public async getAvailableSlots(doctorId: string) {
    return prisma.availabilitySlot.findMany({
      where: {
        doctorId,
        isBooked: false,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}

export const doctorRepository = new DoctorRepository();
