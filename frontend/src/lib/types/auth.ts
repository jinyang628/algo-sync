import { z } from 'zod';

export const exchangeOneTimeCodeRequestSchema = z.object({
  otc: z.string(),
});

export type ExchangeOneTimeCodeRequest = z.infer<typeof exchangeOneTimeCodeRequestSchema>;

export const exchangeOneTimeCodeResponseSchema = z.object({
  access_token: z.string(),
});

export type ExchangeOneTimeCodeResponse = z.infer<typeof exchangeOneTimeCodeResponseSchema>;
