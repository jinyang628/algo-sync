import { StatusCodes } from 'http-status-codes';


import { OAUTH_POPUP_HEIGHT, OAUTH_POPUP_WIDTH } from '@/lib/constants';

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
    browser.storage.sync.set({ clientId: clientId });
    browser.storage.sync.set({ clientSecret: clientSecret });

    await openOAuthPopup();

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

async function openOAuthPopup() {
  const popupUrl = chrome.runtime.getURL('oauth.html');
  const popupWidth = OAUTH_POPUP_WIDTH;
  const popupHeight = OAUTH_POPUP_HEIGHT;

  const left = Math.floor((screen.width - popupWidth) / 2);
  const top = Math.floor((screen.height - popupHeight) / 2);

  await chrome.windows.create({
    url: popupUrl,
    type: 'popup',
    width: popupWidth,
    height: popupHeight,
    left,
    top,
  });
}
