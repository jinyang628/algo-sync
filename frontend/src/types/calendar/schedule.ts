import { z } from 'zod';

import { timeslotSchema } from '@/types/calendar/base';

export const scheduleEventResponseSchema = z.object({
  reply: z.string(),
  eventUrl: z.string(),
});

export type ScheduleEventResponse = z.infer<typeof scheduleEventResponseSchema>;

export const validTimeSlotResponseSchema = z.object({
  summary: z.string().describe('The one-line title of the calendar event'),
  description: z
    .string()
    .describe(
      'The details of the interview such as the microsoft/zoom/google meeting link, hackerrank/codepair link, nature of the interview (if any), etc.',
    ),
  reply: z.string().describe('The reply to the sender acknowledging attendance of the interview'),
});

export const rescheduleTimeSlotResponseSchema = z.object({
  summary: z.string().describe('The one-line title of the calendar event'),
  description: z
    .string()
    .describe(
      'The details of the interview such as the microsoft/zoom/google meeting link, hackerrank/codepair link, nature of the interview (if any), etc.',
    ),
  timeslot: timeslotSchema,
  reply: z
    .string()
    .describe(
      'The reply to the sender thanking them for the interview opportunity, apologising to them that I am unavailable during that timeslot, and proposing a new date and time for the meeting',
    ),
});

export type ValidTimeSlotResponse = z.infer<typeof validTimeSlotResponseSchema>;

type EmailReplyProps = { name: string; content: string };
export const EMAIL_REPLY_TEMPLATE = ({ name, content }: EmailReplyProps) => `${content}

Best regards,
${name}`;
