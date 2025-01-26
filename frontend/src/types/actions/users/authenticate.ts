import { z } from 'zod';

export const authenticateRequestSchema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
});

export type AuthenticateRequest = z.infer<typeof authenticateRequestSchema>;

export const authenticateResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthenticateResponse = z.infer<typeof authenticateResponseSchema>;
