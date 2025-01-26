import { Timeslot } from '@/types/calendar/base';
import { PreferredTimeslots } from '@/types/calendar/preference';

export const VALID_TIME_SLOT_SYSTEM_PROMPT = `You have 2 tasks.

1. Extract the calendar event information given the context of the email content. If a zoom/microsoft/google meeting link or hackkerank/codepair link is specified in the email, you must include it clearly in the description of your response.

2. Provide a short, polite email reply to the sender acknowledging the date and time of the meeting. Note the following:
  a) INCLUDE the "Dear [SENDER NAME],\n" prefix 
  b) OMIT the "Best regards..." suffix in your reply.`;

export type RescheduleTimeSlotSystemPromptArgs = {
  busyTimeslots: Timeslot[];
  preferredTimeslots: PreferredTimeslots;
};
export const RESCHEDULE_TIME_SLOT_SYSTEM_PROMPT = ({
  busyTimeslots,
  preferredTimeslots,
}: RescheduleTimeSlotSystemPromptArgs) => `You have 2 tasks.

1. Extract the calendar event information given the context of the email content. Do NOT include the start date and end date of the meeting as part of the description (because we are rescheduling the meeting).

2. Provide a polite email reply to the sender thanking them for the interview opportunity and apologise to him/her that I am unavailable during that timeslot. Propose a new date and time for the meeting in your reply. You should INCLUDE the "Dear [SENDER NAME],\n" prefix but OMIT the "Best regards..." suffix in your reply.

Your newly proposed date and time should abide by the following rules:
1. It should fall within the reasonable working hours of the sender (try to infer the sender's working hours from the email content, job location, company HQ, etc.).
2. The date should fall on a weekday and not on a public holiday of the sender.
3. You are given some timeslots when I am busy below, and you should schedule the meeting at a time that is at least 30 minutes away from the busy periods.
4. The sender might list a couple of timeslots in the email content or suggest some dates/times to choose from. Prioritise those timeslots as much as possible.  
5. You should state your proposed date and time in the timezone of the sender and state that timezone explicitly in your reply.
6. Double check that your proposed date and day is correct!

My busy periods:
${busyTimeslots.join('\n')}

My preferred days:
${preferredTimeslots.preferredDays.join(', ')}

My preferred timeslots:
${preferredTimeslots.earliestStartTime}-${preferredTimeslots.latestEndTime}
`;
