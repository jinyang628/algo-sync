(async function () {
  const clientId = await browser.storage.sync.get('clientId').then((result) => result.clientId);
  const redirectUri = chrome.identity.getRedirectURL();

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', 'user');

  try {
    const responseUrl: string = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl.toString(),
          interactive: true,
        },
        (responseUrl) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
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

    // Extract the authorization code from the response URL
    const urlParams = new URLSearchParams(new URL(responseUrl).search);
    const code = urlParams.get('code');

    if (!code) {
      throw new Error('No authorization code found in response');
    }

    // Exchange the code for an access token
    const tokenUrl = 'https://github.com/login/oauth/access_token';
    const clientSecret = await browser.storage.sync
      .get('clientSecret')
      .then((result) => result.clientSecret);

    console.log('TOKEN URL');
    console.log(tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await response.json();

    if (!tokens.access_token) {
      throw new Error('No access token found in response');
    }

    // Save the access token
    chrome.storage.sync.set({ github_access_token: tokens.access_token }, () => {
      console.log('Access token saved.');
    });
  } catch (error) {
    console.error('OAuth error:', error);
  }
})();
