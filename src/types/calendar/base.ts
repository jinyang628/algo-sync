import { z } from 'zod';

const dateTimeSchema = z.object({
  dateTime: z.string(),
});

export const timeslotSchema = z.object({
  start: dateTimeSchema.describe('The dateTime value of the start of the event'),
  end: dateTimeSchema.describe('The dateTime value of the end of the event'),
});

export type Timeslot = z.infer<typeof timeslotSchema>;

// It has to be this convoluted to follow the model shape of Google Calendar in the API

export const calendarEventSchema = timeslotSchema.extend({
  summary: z.string(),
  description: z.string().default(''),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;
