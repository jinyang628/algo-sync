export default function constructEventUrl(eventStartDateTime: string): string {
  const date = eventStartDateTime.split('T')[0];
  const [year, month, day] = date.split('-');
  return `https://calendar.google.com/calendar/u/1/r/day/${year}/${month}/${day}`;
}
