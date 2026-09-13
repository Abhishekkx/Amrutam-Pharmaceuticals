import { z } from 'zod';
import { ConsultationStatus } from '../constants/enums';

export const updateConsultationStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(ConsultationStatus),
    notes: z.string().optional(),
  }),
});
