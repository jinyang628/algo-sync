import { StatusCodes } from 'http-status-codes';

import { SERVER_BASE_URL } from '@/lib/constants';

interface StoreAuthTokensProps {
  clientId: string;
  clientSecret: string;
}

interface StoreAuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export async function getAuthTokens({
  clientId,
  clientSecret,
}: StoreAuthTokensProps): Promise<StoreAuthTokensResponse> {
  try {
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', `${SERVER_BASE_URL}/api/v1/users/callback`);
    authUrl.searchParams.append('scope', 'user');
    window.location.href = authUrl.toString();

    return {
      accessToken: '',
      refreshToken: '',
    };

    // if (!tokenResponse.ok) {
    //   const errorData = await tokenResponse.json().catch(() => null);
    //   logger.error('Token exchange failed:', {
    //     status: tokenResponse.status,
    //     statusText: tokenResponse.statusText,
    //     error: errorData,
    //   });
    //   throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    // }

    // const tokens = await tokenResponse.json();

    // if (!tokens.access_token || !tokens.refresh_token) {
    //   throw new Error('Missing tokens in response');
    // }

    // return {
    //   accessToken: tokens.access_token,
    //   refreshToken: tokens.refresh_token,
    // };
  } catch (error) {
    console.error('Error getting auth tokens:', error as Error);
    throw new Error('Failed to authenticate with Google Calendar');
  }
}

export function openOAuthPopup() {
  const popupUrl = chrome.runtime.getURL('oauth.html');
  const popupWidth = 700;
  const popupHeight = 700;

  const left = Math.floor((screen.width - popupWidth) / 2);
  const top = Math.floor((screen.height - popupHeight) / 2);

  window.open(
    popupUrl,
    'GitHub OAuth',
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`,
  );
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
    console.error('Error checking access token validity:', error as Error);
    return false;
  }
}
