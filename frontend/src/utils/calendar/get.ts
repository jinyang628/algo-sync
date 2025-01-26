import { z } from 'zod';

import { CalendarEvent, calendarEventSchema } from '@/types/calendar/base';

import { logger } from '@/lib/logger';

type CalendarEventFilterParameters = {
  startDateBoundary: Date;
  endDateBoundary: Date;
};

export default async function getCalendarEvents({
  startDateBoundary,
  endDateBoundary,
}: CalendarEventFilterParameters): Promise<CalendarEvent[]> {
  /**
   * Retrieves all calendar events between the start date and end date boundaries.
   */

  const params = new URLSearchParams({
    timeMin: startDateBoundary.toISOString(),
    timeMax: endDateBoundary.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${await browser.storage.sync.get('accessToken').then((result) => result.accessToken)}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    logger.error('Calendar API error response:', errorData);
    throw new Error(`Error getting calendar events with status: ${response.status}`);
  }

  const data = await response.json();
  const parsedEvents = z.array(calendarEventSchema).parse(data.items);
  return parsedEvents;
}
