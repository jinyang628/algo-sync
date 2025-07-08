import { z } from 'zod';

export const languageEnum = z.enum(['py', 'java', 'javascript', 'sql']);
export type Language = z.infer<typeof languageEnum>;
