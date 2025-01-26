import { StatusCodes } from 'http-status-codes';

import { SERVER_BASE_URL } from '@/lib/constants';

interface StoreAuthTokensProps {
  clientId: string;
}

export async function getAccessToken({ clientId }: StoreAuthTokensProps) {
  try {
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', `${SERVER_BASE_URL}/api/v1/users/callback`);
    authUrl.searchParams.append('scope', 'user');
    console.log('Auth URL:', authUrl);
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('Error getting auth tokens:', error as Error);
    throw new Error('Failed to authenticate with Google Calendar');
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
