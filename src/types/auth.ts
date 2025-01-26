import { z } from 'zod';

export const exchangeTokenRequestSchema = z.object({
  code: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
});

export type ExchangeTokenRequest = z.infer<typeof exchangeTokenRequestSchema>;

export const exchangeTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type ExchangeTokenResponse = z.infer<typeof exchangeTokenResponseSchema>;
