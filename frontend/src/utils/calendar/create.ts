import constructEventUrl from '@/utils/calendar/base';

import { CalendarEvent } from '@/types/calendar/base';

import { logger } from '@/lib/logger';

export default async function createCalendarEvent(event: CalendarEvent): Promise<string> {
  logger.info('Creating calendar event:', event.summary);

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await browser.storage.sync.get('accessToken').then((result) => result.accessToken)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Calendar API error response:', errorData);
      throw new Error(`Error creating calendar event with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.id) {
      throw new Error('No google calendar event ID found');
    }

    logger.info('Successfully created calendar event with ID:', data.id);

    return constructEventUrl(data.start.dateTime);
  } catch (error) {
    logger.error('Error creating calendar event:', error as Error);
    throw error;
  }
}
