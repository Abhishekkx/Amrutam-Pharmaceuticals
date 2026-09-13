import { z } from 'zod';

export const bookSlotSchema = z.object({
  body: z.object({
    slotId: z.string().uuid('Invalid slot ID format'),
  }),
});
