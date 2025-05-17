import { FaGithub } from 'react-icons/fa';

import { toast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import { XCircle } from 'lucide-react';

import Loader from '@/components/shared/loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/toaster';

import { getAccessToken, isAccessTokenValid } from '@/lib/auth';

type AuthenticationStatus = 'no' | 'yes' | 'loading' | 'error';

export default function App() {
  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [authenticationStatus, setAuthenticationStatus] = useState<AuthenticationStatus>('loading');
  const authenticationIcon = (status: AuthenticationStatus) => {
    switch (status) {
      case 'yes':
        return <CheckCircle className="size-8 text-green-500" />;
      case 'no':
        return <XCircle className="size-8 text-red-500" />;
      case 'loading':
        return <Loader isLoading={true} />;
      case 'error':
        return <XCircle className="size-8 text-red-500" />;
      default:
    }
  };

  useEffect(() => {
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

        if (await isAccessTokenValid(accessToken)) {
          setAuthenticationStatus('yes');
        } else {
          setAuthenticationStatus('no');
        }
      } catch (error: unknown) {
        console.error(error);
        setAuthenticationStatus('no');
      }
    };

    setAuthenticationStatus('loading');
    initializeStates();
  }, []);

  useEffect(() => {
    const handleGitHubCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');

      if (!accessToken) {
        return;
      }
      browser.storage.sync.set({ accessToken }).then(() => {
        console.log('Access token saved.');
      });
      window.location.href = '/options.html';
    };
    handleGitHubCallback();
  }, []);

  const authenticateSection = (
    <div className="flex items-center justify-center space-x-2">
      <Button
        className="gap-2"
        disabled={!clientId}
        onClick={() => {
          setAuthenticationStatus('loading');
          getAccessToken({ clientId: clientId });
        }}
      >
        <FaGithub className="size-5" />
        Authenticate with Github
      </Button>
      {authenticationIcon(authenticationStatus)}
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
