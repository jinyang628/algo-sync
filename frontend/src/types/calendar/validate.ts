import { z } from 'zod';

export const timeslotValiditySchema = z.enum([
  'valid',
  'endDateBeforeStartDate',
  'currentDatePastStartDate',
  'booked',
  'outsidePreferredTimeslots',
]);

export type TimeslotValidity = z.infer<typeof timeslotValiditySchema>;
