import { z } from 'zod';

export const languageEnum = z.enum(['py', 'java', 'sql']);
export type Language = z.infer<typeof languageEnum>;
