import { StatusCodes } from 'http-status-codes';

import { SERVER_BASE_URL } from '@/lib/constants';

export async function redirectToGithub(clientId: string) {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/api/v1/users/login-url`);
    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Failed to get auth URL:', error);
  }
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
