import { z } from 'zod';

export const preferredTimeslotsSchema = z.object({
  earliestStartTime: z.string(),
  latestEndTime: z.string(),
  preferredDays: z.array(z.string()),
  timezone: z.string(),
});

export type PreferredTimeslots = z.infer<typeof preferredTimeslotsSchema>;
