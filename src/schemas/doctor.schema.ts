import { z } from 'zod';

export const createDoctorProfileSchema = z.object({
  body: z.object({
    specialty: z.string().min(2, 'Specialty is required'),
    experienceYears: z.number().int().min(0),
    consultationFee: z.number().positive('Consultation fee must be positive'),
    bio: z.string().optional(),
  }),
});

export const createSlotSchema = z.object({
  body: z.object({
    startTime: z.string().datetime({ message: 'Invalid ISO start time string' }),
    endTime: z.string().datetime({ message: 'Invalid ISO end time string' }),
  }),
});

export const searchDoctorSchema = z.object({
  query: z.object({
    specialty: z.string().optional(),
    minRating: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    maxFee: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    offset: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  }),
});
