import { StatusCodes } from 'http-status-codes';

import { logger } from '@/lib/logger';

interface StoreAuthTokensProps {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  interactive: boolean;
}

interface StoreAuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export async function getAuthTokens({
  clientId,
  clientSecret,
  scopes,
  interactive,
}: StoreAuthTokensProps): Promise<StoreAuthTokensResponse> {
  try {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', chrome.identity.getRedirectURL());
    authUrl.searchParams.append('scope', scopes.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    logger.info('Auth URL:', authUrl.toString());

    const responseUrl = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl.toString(),
          interactive: interactive,
        },
        (responseUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!responseUrl) {
            reject(new Error('No response URL'));
            return;
          }
          resolve(responseUrl);
        },
      );
    });

    // Extract the authorization code
    const urlParams = new URLSearchParams(new URL(responseUrl).search);
    const code = urlParams.get('code');

    if (!code) {
      throw new Error('No authorization code found in response');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: chrome.identity.getRedirectURL(),
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => null);
      logger.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
      });
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Missing tokens in response');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  } catch (error) {
    logger.error('Error getting auth tokens:', error as Error);
    throw new Error('Failed to authenticate with Google Calendar');
  }
}

interface RefreshAccessTokenProps {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export async function refreshAccessToken({
  clientId,
  clientSecret,
  refreshToken,
}: RefreshAccessTokenProps): Promise<string> {
  if (!refreshToken) {
    throw new Error('No refresh token found so access token cannot be refreshed');
  }
  if (!clientId) {
    throw new Error('No client ID found so access token cannot be refreshed');
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.log('REFRESH RESPONSE');
      console.log(await response.json());
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}

export async function isAccessTokenValid(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`,
    );
    return response.status === StatusCodes.OK;
  } catch (error: unknown) {
    logger.error('Error checking access token validity:', error as Error);
    return false;
  }
}
