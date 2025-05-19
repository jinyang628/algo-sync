import { z } from 'zod';

export const audioRequestSchema = z.object({
  audioDataUrl: z.string(),
});

export type AudioRequest = z.infer<typeof audioRequestSchema>;

export const audioRequestActionSchema = audioRequestSchema.extend({
  action: z.literal('audio'),
});

export type AudioRequestAction = z.infer<typeof audioRequestActionSchema>;
