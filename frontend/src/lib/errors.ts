import { CalendarEvent } from '@/types/calendar/base';

export class TimeSlotBookedError extends Error {
  constructor(
    message: string,
    public newlyProposedCalendarEvent: CalendarEvent,
  ) {
    super(message);
    this.newlyProposedCalendarEvent = newlyProposedCalendarEvent;
  }
}

export class CurrentDatePastStartDateError extends Error {
  constructor(
    message: string,
    public newlyProposedCalendarEvent: CalendarEvent,
  ) {
    super(message);
    this.newlyProposedCalendarEvent = newlyProposedCalendarEvent;
  }
}

export class EndDateBeforeStartDateError extends Error {
  constructor(message: string) {
    super(message);
  }
}
