import { doctorRepository, DoctorFilter } from '../repositories/doctor.repository';
import { userRepository } from '../repositories/user.repository';
import { redisService } from './redis.service';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { Role } from '../constants/enums';

export class DoctorService {
  public async createDoctorProfile(userId: string, data: {
    specialty: string;
    experienceYears: number;
    consultationFee: number;
    bio?: string;
  }) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role !== Role.DOCTOR && user.role !== Role.ADMIN) {
      throw new ForbiddenError('Only users registered with DOCTOR role can create doctor profiles');
    }

    const doctor = await doctorRepository.createDoctorProfile({
      userId,
      ...data,
    });

    await redisService.del('doctors:search:*');

    return doctor;
  }

  public async getDoctorById(id: string) {
    const cacheKey = `doctor:${id}`;
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const doctor = await doctorRepository.findById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found');
    }

    await redisService.set(cacheKey, JSON.stringify(doctor), 300);
    return doctor;
  }

  public async searchDoctors(filter: DoctorFilter) {
    const cacheKey = `doctors:search:${JSON.stringify(filter)}`;
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const doctors = await doctorRepository.findMany(filter);
    await redisService.set(cacheKey, JSON.stringify(doctors), 60);
    return doctors;
  }

  public async createAvailabilitySlot(userId: string, data: { startTime: string; endTime: string }) {
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found for this user');
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid startTime or endTime ISO timestamp');
    }

    if (start >= end) {
      throw new BadRequestError('startTime must be earlier than endTime');
    }

    if (start < new Date()) {
      throw new BadRequestError('Cannot create availability slot in the past');
    }

    const slot = await doctorRepository.createAvailabilitySlot({
      doctorId: doctor.id,
      startTime: start,
      endTime: end,
    });

    await redisService.del(`doctor:${doctor.id}`);

    return slot;
  }

  public async getDoctorSlots(doctorId: string) {
    return doctorRepository.getAvailableSlots(doctorId);
  }
}

export const doctorService = new DoctorService();
