import { StatusCodes } from 'http-status-codes';

import { SERVER_BASE_URL } from '@/lib/constants';

import {
  ExchangeOneTimeCodeRequest,
  ExchangeOneTimeCodeResponse,
  exchangeOneTimeCodeResponseSchema,
} from './types/auth';

export async function redirectToGithub() {
  try {
    console.log('Redirecting to GitHub...');
    const response = await fetch(`${SERVER_BASE_URL}/api/v1/users/login-url`);
    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Failed to get auth URL:', error);
  }
}

export async function exchangeOneTimeCode(
  exchangeRequest: ExchangeOneTimeCodeRequest,
): Promise<ExchangeOneTimeCodeResponse> {
  const response = await fetch(`${SERVER_BASE_URL}/api/v1/users/token/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: exchangeRequest.otc }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to exchange token');
  }

  const data = await response.json();
  return exchangeOneTimeCodeResponseSchema.parse(data);
}

export async function isAccessTokenValid(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return response.status === StatusCodes.OK;
  } catch (error: unknown) {
    console.error('Error checking access token validity:', error as Error);

    return false;
  }
}
