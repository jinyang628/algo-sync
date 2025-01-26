import { SCHEDULE_CALENDAR_EVENT_ACTION } from '@/constants/browser';
import scheduleCalendarEvent from '@/utils/calendar/schedule';
import validateTimeslot from '@/utils/calendar/validate';
import extractTimeslot from '@/utils/extract';

import { errorSchema } from '@/types/browser/base';
import {
  scheduleCalendarEventRequestSchema,
  scheduleCalendarEventResponseSchema,
} from '@/types/browser/scheduleCalendarEvent';
import { PreferredTimeslots, preferredTimeslotsSchema } from '@/types/calendar/preference';
import { ScheduleEventResponse } from '@/types/calendar/schedule';
import { TimeslotValidity, timeslotValiditySchema } from '@/types/calendar/validate';
import { InferenceConfig, defaultInferenceConfig } from '@/types/config';
import { ExtractTimeslotResponse } from '@/types/extract';

import { logger } from '@/lib/logger';

// Currently, we use the default inference config. We can define multiple different configs and choose which one to use here
const INFERENCE_CONFIG: InferenceConfig = defaultInferenceConfig;

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender) => {
    // Return a promise that resolves with our response
    let retryCounter: number = 0;
    switch (message.action) {
      case SCHEDULE_CALENDAR_EVENT_ACTION:
        return (async () => {
          try {
            const input = scheduleCalendarEventRequestSchema.parse(message.input);
            let timeslotValidity: TimeslotValidity;
            let extractTimeslotResponse: ExtractTimeslotResponse;
            let preferredTimeslots: PreferredTimeslots;
            while (true) {
              logger.info('~Extracting Timeslot~');
              extractTimeslotResponse = await extractTimeslot({
                messages: input.messages,
                inferenceConfig: INFERENCE_CONFIG,
              });
              logger.info('~Validating Timeslot~');
              preferredTimeslots = preferredTimeslotsSchema.parse({
                earliestStartTime: await browser.storage.sync
                  .get('startTime')
                  .then((result) => result.startTime)
                  .catch(() => ''),
                latestEndTime: await browser.storage.sync
                  .get('endTime')
                  .then((result) => result.endTime)
                  .catch(() => ''),
                preferredDays: await browser.storage.sync
                  .get('preferredDays')
                  .then((result) => result.preferredDays)
                  .catch(() => []),
                timezone: await browser.storage.sync
                  .get('timezone')
                  .then((result) => result.timezone)
                  .catch(() => ''),
              });
              timeslotValidity = await validateTimeslot({
                proposedTimeslot: extractTimeslotResponse.timeslot,
                preferredTimeslots: preferredTimeslots,
              });
              logger.info(`Calendar Validity: ${timeslotValidity}`);
              if (timeslotValidity === timeslotValiditySchema.Values.endDateBeforeStartDate) {
                if (retryCounter >= INFERENCE_CONFIG.retryAttempts) {
                  throw new Error(
                    `Failed to infer the calendar event after ${INFERENCE_CONFIG.retryAttempts} retries`,
                  );
                }
                retryCounter++;
                logger.info(
                  `Retrying inference request ${retryCounter} of ${INFERENCE_CONFIG.retryAttempts} because LLM gave an end date that is before the start date.`,
                );
                continue;
              }
              break;
            }
            logger.info('~Scheduling Event~');
            const scheduleEventResponse: ScheduleEventResponse = await scheduleCalendarEvent({
              messages: input.messages,
              timeslotValidity: timeslotValidity,
              proposedTimeslot: extractTimeslotResponse.timeslot,
              preferredTimeslots: preferredTimeslots,
              inferenceConfig: INFERENCE_CONFIG,
            });
            logger.info('Schedule Calendar Event response:', scheduleEventResponse);

            const scheduleCalendarEventResponse = scheduleCalendarEventResponseSchema.parse({
              response: scheduleEventResponse,
            });
            logger.info('Schedule Calendar Event response:', scheduleCalendarEventResponse);
            return scheduleCalendarEventResponse;
          } catch (error: unknown) {
            console.error(error);
            if (error instanceof Error) {
              return scheduleCalendarEventResponseSchema.parse({
                error: errorSchema.parse({
                  message: error.message,
                }),
              });
            } else {
              return scheduleCalendarEventResponseSchema.parse({
                error: errorSchema.parse({
                  message: 'Unknown error',
                }),
              });
            }
          }
        })();

      default:
        console.error('Action not recognised in background script');
        return undefined;
    }
  });
});
