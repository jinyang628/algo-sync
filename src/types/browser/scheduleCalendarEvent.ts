import { z } from 'zod';

import { errorSchema } from '@/types/browser/base';
import { scheduleEventResponseSchema } from '@/types/calendar/schedule';
import { emailMessageSchema } from '@/types/email';

export const scheduleCalendarEventRequestSchema = z.object({
  messages: z.array(emailMessageSchema),
});

export type ScheduleCalendarEventRequest = z.infer<typeof scheduleCalendarEventRequestSchema>;

export const scheduleCalendarEventResponseSchema = z
  .object({
    response: scheduleEventResponseSchema.optional(),
    error: errorSchema.optional(),
  })
  .refine((data) => data.response || data.error, {
    message: 'Either response or error should be present',
  });

export type ScheduleCalendarEventResponse = z.infer<typeof scheduleCalendarEventResponseSchema>;
