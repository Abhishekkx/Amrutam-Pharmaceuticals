import { z } from 'zod';

export const createPrescriptionSchema = z.object({
  body: z.object({
    consultationId: z.string().uuid(),
    medications: z.array(
      z.object({
        name: z.string().min(1),
        dosage: z.string().min(1),
        frequency: z.string().min(1),
        duration: z.string().min(1),
      })
    ).min(1, 'At least one medication must be included'),
    instructions: z.string().min(1, 'Instructions are required'),
  }),
});
