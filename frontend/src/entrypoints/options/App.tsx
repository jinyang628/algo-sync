import { FaGithub } from 'react-icons/fa';

import { toast } from '@/hooks/use-toast';
import { getAuthTokens, isAccessTokenValid, refreshAccessToken } from '@/utils/auth';
import { CheckCircle } from 'lucide-react';
import { XCircle } from 'lucide-react';

import Loader from '@/components/shared/loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/toaster';

type AuthenticationStatus = 'no' | 'yes' | 'loading' | 'error';

export default function App() {
  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [authenticationStatus, setAuthenticationStatus] = useState<AuthenticationStatus>('loading');

  useEffect(() => {
    const handleGitHubCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      console.log('Access Token:', accessToken);
      console.log('Refresh Token:', refreshToken);

      if (accessToken && refreshToken) {
        chrome.storage.sync.set({ accessToken: accessToken }, () => {
          console.log('Access token saved.');
        });
        chrome.storage.sync.set({ refreshToken: refreshToken }, () => {
          console.log('Refresh token saved.');
        });
        // Redirect the user to the main app page
        window.location.href = '/';
      }
    };

    const initializeStates = async () => {
      browser.storage.sync.get('clientId').then((result) => {
        setClientId(result.clientId || '');
      });
      browser.storage.sync.get('clientSecret').then((result) => {
        setClientSecret(result.clientSecret || '');
      });
      try {
        const accessToken: string = await browser.storage.sync
          .get('accessToken')
          .then((result) => result.accessToken)
          .catch(() => '');

        const isValid: boolean = await isAccessTokenValid(accessToken);
        if (isValid) {
          setAuthenticationStatus('yes');
          return;
        }

        await browser.storage.sync.set({
          accessToken: await refreshAccessToken({
            refreshToken: await browser.storage.sync
              .get('refreshToken')
              .then((result) => result.refreshToken)
              .catch(() => ''),
            clientId: await browser.storage.sync
              .get('clientId')
              .then((result) => result.clientId)
              .catch(() => ''),
            clientSecret: await browser.storage.sync
              .get('clientSecret')
              .then((result) => result.clientSecret)
              .catch(() => ''),
          }),
        });
        setAuthenticationStatus('yes');
      } catch (error: unknown) {
        console.error(error);
        setAuthenticationStatus('no');
      }
    };

    setAuthenticationStatus('loading');
    initializeStates();
    handleGitHubCallback();
  }, []);

  const handleAuthentication = async () => {
    try {
      const { accessToken, refreshToken } = await getAuthTokens({
        clientId: clientId,
        clientSecret: clientSecret,
      });
      await browser.storage.sync.set({
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
      setAuthenticationStatus('yes');
    } catch (error) {
      console.error(error);
      setAuthenticationStatus('error');
    }
  };

  const authenticateSection = (
    <div className="flex items-center justify-center space-x-2">
      <Button className="gap-2" disabled={!clientId} onClick={handleAuthentication}>
        <FaGithub className="size-5" />
        Authenticate with Github
      </Button>
      {authenticationStatus === 'yes' ? (
        <CheckCircle className="size-8 text-green-500" />
      ) : authenticationStatus === 'no' || authenticationStatus === 'error' ? (
        <XCircle className="size-8 text-red-500" />
      ) : authenticationStatus === 'loading' ? (
        <Loader isLoading={true} />
      ) : null}
    </div>
  );

  const saveButton = (
    <Button
      onClick={() => {
        browser.storage.sync.set({
          clientId: clientId,
        });
        browser.storage.sync.set({
          clientSecret: clientSecret,
        });

        toast({
          title: 'Settings saved!',
          duration: 1500,
        });
      }}
    >
      Save
    </Button>
  );

  return (
    <div className="flex h-screen w-full justify-center p-8">
      <Toaster />
      <div className="mx-auto flex max-h-[600px] w-full max-w-[750px] flex-col justify-center space-y-4 p-4">
        <Card className="mx-auto flex w-full max-w-[auto] flex-col justify-center space-y-4 p-4 align-middle">
          <p className="text-base font-semibold">Github OAuth App Client ID:</p>
          <Input
            type="password"
            onChange={(e) => setClientId(e.target.value)}
            value={clientId}
            placeholder="Enter your Github OAuth App's Client ID"
          />
          <p className="text-base font-semibold">Github OAuth App Client Secret:</p>
          <Input
            type="password"
            onChange={(e) => setClientSecret(e.target.value)}
            value={clientSecret}
            placeholder="Enter your Github OAuth App's Client Secret"
          />
          {authenticateSection}
          {saveButton}
        </Card>
      </div>
    </div>
  );
}
