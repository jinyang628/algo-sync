import { z } from 'zod';

export const languageEnum = z.enum(['py', 'java']);
export type Language = z.infer<typeof languageEnum>;
