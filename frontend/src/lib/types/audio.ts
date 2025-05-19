import { z } from 'zod';

export const audioRequestSchema = z.object({
  audioDataUrl: z.string(),
  code: z.string(),
  problemName: z.string(),
  problemDescription: z.string(),
});

export type AudioRequest = z.infer<typeof audioRequestSchema>;

export const audioRequestActionSchema = audioRequestSchema.extend({
  action: z.literal('audio'),
});

export type AudioRequestAction = z.infer<typeof audioRequestActionSchema>;

export const textToSpeechRequestActionSchema = z.object({
  action: z.literal('textToSpeech'),
  text: z.string(),
});

export type TextToSpeechRequestAction = z.infer<typeof textToSpeechRequestActionSchema>;
