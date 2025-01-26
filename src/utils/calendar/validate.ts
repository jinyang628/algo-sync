import getCalendarEvents from '@/utils/calendar/get';

import { CalendarEvent, Timeslot } from '@/types/calendar/base';
import { PreferredTimeslots } from '@/types/calendar/preference';
import { TimeslotValidity, timeslotValiditySchema } from '@/types/calendar/validate';

import { logger } from '@/lib/logger';

type IsProposedTimeslotPreferredProps = {
  proposedTimeslot: Timeslot;
  preferredTimeslots: PreferredTimeslots;
};

function isProposedTimeslotPreferred({
  proposedTimeslot,
  preferredTimeslots,
}: IsProposedTimeslotPreferredProps): boolean {
  // TODO: Implement this function
  return true;
}

type ValidateTimeslotProps = {
  proposedTimeslot: Timeslot;
  preferredTimeslots: PreferredTimeslots;
};

export default async function validateTimeslot({
  proposedTimeslot,
  preferredTimeslots,
}: ValidateTimeslotProps): Promise<TimeslotValidity> {
  const startDate = new Date(proposedTimeslot.start.dateTime);
  const endDate = new Date(proposedTimeslot.end.dateTime);
  const currentDate = new Date();

  if (endDate <= startDate) {
    return timeslotValiditySchema.Values.endDateBeforeStartDate;
  }

  if (currentDate >= startDate) {
    return timeslotValiditySchema.Values.currentDatePastStartDate;
  }

  const events: CalendarEvent[] = await getCalendarEvents({
    startDateBoundary: startDate,
    endDateBoundary: endDate,
  });

  if (events.length > 0) {
    return timeslotValiditySchema.Values.booked;
  }

  if (
    !preferredTimeslots.earliestStartTime ||
    !preferredTimeslots.latestEndTime ||
    !preferredTimeslots.timezone ||
    preferredTimeslots.preferredDays.length === 0
  ) {
    logger.info('Preferred timeslots are not set', preferredTimeslots);
    return timeslotValiditySchema.Values.valid;
  }

  if (
    !isProposedTimeslotPreferred({
      proposedTimeslot: proposedTimeslot,
      preferredTimeslots: preferredTimeslots,
    })
  ) {
    logger.info('Proposed timeslot is not within preferred timeslots');
    return timeslotValiditySchema.Values.outsidePreferredTimeslots;
  }

  return timeslotValiditySchema.Values.valid;
}
