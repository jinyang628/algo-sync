import { z } from 'zod';

export const emailMessageSchema = z.object({
  name: z.string(),
  email: z.string(),
  content: z.string(),
});

export type EmailMessage = z.infer<typeof emailMessageSchema>;
