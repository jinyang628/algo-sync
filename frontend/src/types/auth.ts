import { z } from 'zod';

import { EXCHANGE_TOKEN_ACTION } from '@/lib/constants';

export const exchangeTokenRequestInputSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  scopes: z.array(z.string()),
});

export type ExchangeTokenRequestInput = z.infer<typeof exchangeTokenRequestInputSchema>;

export const exchangeTokenMessageRequestSchema = z.object({
  action: z.literal(EXCHANGE_TOKEN_ACTION),
  input: exchangeTokenRequestInputSchema,
});

export type ExchangeTokenMessageRequestSchema = z.infer<typeof exchangeTokenMessageRequestSchema>;

export const exchangeTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type ExchangeTokenResponse = z.infer<typeof exchangeTokenResponseSchema>;
