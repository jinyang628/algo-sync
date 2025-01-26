import createCalendarEvent from '@/utils/calendar/create';
import getCalendarEvents from '@/utils/calendar/get';
import { getInferenceClient } from '@/utils/inference/client';
import {
  RESCHEDULE_TIME_SLOT_SYSTEM_PROMPT,
  VALID_TIME_SLOT_SYSTEM_PROMPT,
} from '@/utils/inference/prompts';

import {
  CalendarEvent,
  Timeslot,
  calendarEventSchema,
  timeslotSchema,
} from '@/types/calendar/base';
import { PreferredTimeslots } from '@/types/calendar/preference';
import {
  EMAIL_REPLY_TEMPLATE,
  ScheduleEventResponse,
  rescheduleTimeSlotResponseSchema,
  scheduleEventResponseSchema,
  validTimeSlotResponseSchema,
} from '@/types/calendar/schedule';
import { TimeslotValidity, timeslotValiditySchema } from '@/types/calendar/validate';
import { InferenceConfig } from '@/types/config';
import { EmailMessage } from '@/types/email';
import { role } from '@/types/inference';

import { logger } from '@/lib/logger';

type ScheduleCalendarEventProps = {
  messages: EmailMessage[];
  timeslotValidity: TimeslotValidity;
  proposedTimeslot: Timeslot;
  preferredTimeslots: PreferredTimeslots;
  inferenceConfig: InferenceConfig;
};

export default async function scheduleCalendarEvent({
  messages,
  timeslotValidity,
  proposedTimeslot,
  preferredTimeslots,
  inferenceConfig,
}: ScheduleCalendarEventProps): Promise<ScheduleEventResponse> {
  const client = await getInferenceClient(inferenceConfig);

  // We always want to schedule an event even if the proposed timeslot is problematic (for manual verification + putting a calendar placeholder so we don't schedule other interviews at the same time)
  let createCalendarEventRequest: CalendarEvent;
  let busyTimeslots: Timeslot[];
  let emailReply: string;
  switch (timeslotValidity) {
    case timeslotValiditySchema.Values.valid:
      const validTimeslotResponse = await client.infer({
        messages: [
          {
            role: role.Values.system,
            content: VALID_TIME_SLOT_SYSTEM_PROMPT,
          },
          {
            role: role.Values.user,
            content: messages
              .map((msg) => `From: ${msg.name} <${msg.email}>\n${msg.content}`)
              .join('\n'),
          },
        ],
        responseFormat: validTimeSlotResponseSchema,
      });
      createCalendarEventRequest = calendarEventSchema.parse({
        summary: validTimeslotResponse.summary,
        description: validTimeslotResponse.description,
        start: proposedTimeslot.start,
        end: proposedTimeslot.end,
      });
      emailReply = validTimeslotResponse.reply;
      break;
    case timeslotValiditySchema.Values.endDateBeforeStartDate:
      // This error should have been caught beforehand and not reached here
      throw new Error('End date cannot be before start date');
    case timeslotValiditySchema.Values.currentDatePastStartDate:
    case timeslotValiditySchema.Values.booked:
    case timeslotValiditySchema.Values.outsidePreferredTimeslots:
      busyTimeslots = await getAdjacentBusyTimeslots({
        initialTimeslot: proposedTimeslot,
      });
      logger.info('~Inferring timeslots to reschedule to~');
      const rescheduleTimeslotResponse = await client.infer({
        messages: [
          {
            role: role.Values.system,
            content: RESCHEDULE_TIME_SLOT_SYSTEM_PROMPT({
              busyTimeslots: busyTimeslots,
              preferredTimeslots: preferredTimeslots,
            }),
          },
          {
            role: role.Values.user,
            content: messages
              .map((msg) => `From: ${msg.name} <${msg.email}>\n${msg.content}`)
              .join('\n'),
          },
        ],
        responseFormat: rescheduleTimeSlotResponseSchema,
      });
      createCalendarEventRequest = calendarEventSchema.parse({
        summary: rescheduleTimeslotResponse.summary,
        description: rescheduleTimeslotResponse.description,
        start: rescheduleTimeslotResponse.timeslot.start,
        end: rescheduleTimeslotResponse.timeslot.end,
      });
      emailReply = rescheduleTimeslotResponse.reply;
      break;
    default:
      throw new Error('Invalid calendar event validity');
  }
  console.log('Create Calendar Event Request', createCalendarEventRequest);
  const eventUrl: string = await createCalendarEvent(createCalendarEventRequest);
  return scheduleEventResponseSchema.parse({
    eventUrl: eventUrl,
    reply: EMAIL_REPLY_TEMPLATE({
      name: await browser.storage.sync.get('name').then((result) => result.name),
      content: emailReply,
    }),
  });
}

type ProposeAlternativeTimeslotProps = {
  initialTimeslot: Timeslot;
};

async function getAdjacentBusyTimeslots({
  initialTimeslot,
}: ProposeAlternativeTimeslotProps): Promise<Timeslot[]> {
  const startDateBoundary = new Date(
    new Date(initialTimeslot.start.dateTime).getTime() - 36 * 60 * 60 * 1000,
  );
  const endDateBoundary = new Date(
    new Date(initialTimeslot.end.dateTime).getTime() + 36 * 60 * 60 * 1000,
  );
  const events: CalendarEvent[] = await getCalendarEvents({ startDateBoundary, endDateBoundary });
  const busyTimeslots: Timeslot[] = events.map((event) =>
    timeslotSchema.parse({
      start: event.start,
      end: event.end,
    }),
  );
  return busyTimeslots;
}
