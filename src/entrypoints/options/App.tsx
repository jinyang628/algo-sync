import { FaGoogle } from 'react-icons/fa';

import { DAY_OPTIONS, TIMEZONE_OPTIONS, TIME_OPTIONS, isValidTime } from '@/constants/calendar';
import { toast } from '@/hooks/use-toast';
import { getAuthTokens, isAccessTokenValid, refreshAccessToken } from '@/utils/auth';
import { CheckCircle } from 'lucide-react';
import { XCircle } from 'lucide-react';

import IndividualSelectDropdown from '@/components/shared/individual-select-dropdown';
import Loader from '@/components/shared/loader';
import MultipleSelectDropdown from '@/components/shared/multiple-select-dropdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/toaster';

type AuthenticationStatus = 'no' | 'yes' | 'loading' | 'error';

export default function App() {
  const [name, setName] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [timezone, setTimezone] = useState<string>('');
  const [authenticationStatus, setAuthenticationStatus] = useState<AuthenticationStatus>('loading');

  useEffect(() => {
    const initializeStates = async () => {
      browser.storage.sync.get('name').then((result) => {
        setName(result.name || '');
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
  }, []);

  const handleAuthentication = async () => {
    try {
      const { accessToken, refreshToken } = await getAuthTokens({
        clientId: clientId,
        clientSecret: clientSecret,
        scopes: ['https://www.googleapis.com/auth/calendar'],
        interactive: true,
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
        <FaGoogle className="size-5" />
        Authenticate with Google
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
        browser.storage.sync.set({ name: name });
        browser.storage.sync.set({ preferredDays: preferredDays });
        browser.storage.sync.set({ timezone: timezone });
        if (startTime && endTime) {
          if (!isValidTime(startTime, endTime)) {
            toast({
              title: 'Invalid timings',
              description: 'Please enter a valid start and end time',
              duration: 1500,
            });
            return;
          }

          browser.storage.sync.set({ startTime: startTime });
          browser.storage.sync.set({ endTime: endTime });
        }

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
          <p className="text-base font-semibold">Your Name:</p>
          <Input
            type="text"
            onChange={(e) => setName(e.target.value)}
            value={name}
            placeholder="This will be used to sign off your email reply"
          />
          <p className="text-base font-semibold">Preferred Interview Timings:</p>
          <div className="flex justify-around">
            <div className="flex w-[40%] justify-center space-x-4">
              <IndividualSelectDropdown
                name="Earliest Start Time"
                items={TIME_OPTIONS}
                selectedItem={startTime}
                onSelectItem={(item) => setStartTime(item)}
              />
              <p>-</p>
              <IndividualSelectDropdown
                name="Latest End Time"
                items={TIME_OPTIONS}
                selectedItem={endTime}
                onSelectItem={(item) => setEndTime(item)}
              />
            </div>
            <MultipleSelectDropdown
              name="Preferred Days"
              items={DAY_OPTIONS}
              selectedItems={preferredDays}
              onSelectItems={(items) => setPreferredDays(items)}
              order={DAY_OPTIONS}
            />
            <IndividualSelectDropdown
              name="Timezone"
              items={TIMEZONE_OPTIONS}
              selectedItem={timezone}
              onSelectItem={(item) => setTimezone(item)}
            />
          </div>
          {authenticateSection}
          {saveButton}
        </Card>
      </div>
    </div>
  );
}
