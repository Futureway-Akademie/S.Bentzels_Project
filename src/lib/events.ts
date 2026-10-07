import { registeredGuests, type EventItem } from '../data'

export function isPast(event: EventItem, now: number): boolean {
  return new Date(event.endsAt).getTime() < now
}

export function freeSeats(event: EventItem): number {
  return Math.max(0, event.capacity - (registeredGuests[event.id] ?? 0))
}
