import { z } from 'zod';

export const languageEnum = z.enum(['Python', 'Java', 'Javascript', 'Typescript', 'Sql']);
export const languageSuffixMap: Record<Language, string> = {
  Python: 'py',
  Java: 'java',
  Javascript: 'js',
  Typescript: 'ts',
  Sql: 'sql',
};
export type Language = z.infer<typeof languageEnum>;
