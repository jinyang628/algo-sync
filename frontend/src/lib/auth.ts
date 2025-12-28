import { StatusCodes } from 'http-status-codes';

import { SERVER_BASE_URL } from '@/lib/constants';

export async function redirectToGithub(clientId: string) {
  try {
    // Generate a random state for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', `${SERVER_BASE_URL}/api/v1/users/callback`);
    authUrl.searchParams.append('scope', 'user repo public_repo');
    authUrl.searchParams.append('state', state);

    // Redirect the user to GitHub
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('Error starting GitHub auth:', error);
    throw new Error('Failed to initiate authentication');
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
