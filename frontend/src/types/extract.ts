import { z } from 'zod';

import { timeslotSchema } from '@/types/calendar/base';

export const extractTimeslotResponseSchema = z.object({
  timeslot: timeslotSchema,
});

export type ExtractTimeslotResponse = z.infer<typeof extractTimeslotResponseSchema>;
