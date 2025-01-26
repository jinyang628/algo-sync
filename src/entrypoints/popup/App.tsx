import { IoReload } from 'react-icons/io5';

import { EXTRACT_HTML_ACTION, SCHEDULE_CALENDAR_EVENT_ACTION } from '@/constants/browser';
import { extractEmail } from '@/utils/email';

import CopyableText from '@/components/shared/copyable-text';
import Loader from '@/components/shared/loader';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { extractHtmlResponseSchema } from '@/types/browser/extractHtml';
import {
  ScheduleCalendarEventResponse,
  scheduleCalendarEventRequestSchema,
  scheduleCalendarEventResponseSchema,
} from '@/types/browser/scheduleCalendarEvent';
import { EmailMessage } from '@/types/email';

import { logger } from '@/lib/logger';

import '@/styles/globals.css';

type SchedulingStatus = 'idle' | 'loading' | 'success' | 'error';

export default function App() {
  const [scheduleCalendarEventResponse, setScheduleCalendarEventResponse] =
    useState<ScheduleCalendarEventResponse | null>(null);
  const [schedulingStatus, setSchedulingStatus] = useState<SchedulingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const canBookMeeting = async (): Promise<boolean> => {
    let msg: string = '';
    const accessToken: string = await browser.storage.sync
      .get('accessToken')
      .then((result) => result.accessToken)
      .catch(() => '');

    const isValid: boolean = await isAccessTokenValid(accessToken);
    if (!isValid) {
      msg = 'User is not authenticated';
      logger.error(msg);
      setErrorMessage(msg);
      return false;
    }
    if (await browser.storage.sync.get('clientId').then((result) => !result.clientId)) {
      msg = 'Client ID is not set';
      logger.error(msg);
      setErrorMessage(msg);
      return false;
    }
    if (await browser.storage.sync.get('name').then((result) => !result.name)) {
      msg = 'Name is not set';
      logger.error(msg);
      setErrorMessage(msg);
      return false;
    }
    if (await browser.storage.sync.get('openAiKey').then((result) => !result.openAiKey)) {
      msg = 'OpenAI API key is not set';
      logger.error(msg);
      setErrorMessage(msg);
      return false;
    }

    setErrorMessage(msg);
    return true;
  };

  const bookMeeting = async () => {
    if (!(await canBookMeeting())) {
      return;
    }

    setSchedulingStatus('loading');
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      const extractHtmlResponse = extractHtmlResponseSchema.parse(
        await browser.tabs.sendMessage(tab.id!, {
          action: EXTRACT_HTML_ACTION,
        }),
      );
      const messages: EmailMessage[] = extractEmail(extractHtmlResponse.html);

      const input = scheduleCalendarEventRequestSchema.parse({
        messages: messages,
      });
      const scheduleCalendarEventResponse = scheduleCalendarEventResponseSchema.parse(
        await browser.runtime.sendMessage({
          action: SCHEDULE_CALENDAR_EVENT_ACTION,
          input: input,
        }),
      );
      setScheduleCalendarEventResponse(scheduleCalendarEventResponse);
      setSchedulingStatus('success');
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        console.error(error);
      }
      setSchedulingStatus('error');
    }
  };

  return (
    // This should be the only container with hard coded width and height
    <div className="flex h-[400px] w-[400px] flex-col items-center justify-center space-y-5">
      {['idle', 'loading', 'error'].includes(schedulingStatus) ? (
        <>
          <Button onClick={bookMeeting}>Book Meeting!</Button>
          <p
            className={`text-sm italic text-red-500 ${errorMessage ? 'opacity-100' : 'opacity-0'}`}
          >
            {errorMessage || 'No error'}
          </p>
          <Loader isLoading={schedulingStatus === 'loading'} />
        </>
      ) : (
        <>
          {/* TODO: Add refresh functionality (might need to rework the expected UI of diff schedulingStatus) */}
          {/* <IoReload /> */}
          <ScrollArea className="h-[80%] w-[80%]">
            <CopyableText text={scheduleCalendarEventResponse?.response!.reply || ''} />
          </ScrollArea>
        </>
      )}

      <div
        className="text-center"
        style={{ opacity: ['success', 'error'].includes(schedulingStatus) ? 1 : 0 }}
      >
        <p
          className={`text-base font-semibold ${schedulingStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}
        >
          {schedulingStatus === 'success' ? 'Meeting Booked!' : 'Error scheduling meeting!'}
        </p>
        <p className="text-sm">
          {schedulingStatus === 'success' ? (
            <>
              Meeting details are in your{' '}
              <a
                href={scheduleCalendarEventResponse?.response!.eventUrl || ''}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                calendar
              </a>
              .
            </>
          ) : (
            'Refresh the page and try again.'
          )}
        </p>
      </div>
    </div>
  );
}
