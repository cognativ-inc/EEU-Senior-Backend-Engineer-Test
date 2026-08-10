/**
 * Exercise 3 — Day Agenda (medium)
 *
 * The EEU schedule screen shows the occurrences of a single day as an ordered agenda, and warns
 * the user when two of them collide in time. Implement the two functions below.
 *
 * An occurrence is either all-day (no clock times at all) or scheduled between two times of the
 * same day. Times are 24-hour `'HH:MM'` strings, zero-padded, and there is no timezone or
 * date component to deal with — everything happens on the same calendar day.
 *
 * Rules:
 *   - Both functions reject an inconsistent input by throwing an `Error` with a helpful message,
 *     and they check EVERY item they are given — including the ones that will not make it into
 *     the agenda. An all-day occurrence carries no times; a scheduled one carries both, and must
 *     end strictly after it starts.
 *   - A CANCELLED occurrence is not shown and never collides with anything. Every other status
 *     is shown.
 *   - The agenda puts all-day occurrences first, then the scheduled ones in chronological order.
 *     Ties are broken so that the same input always produces the same output, in this order:
 *     the earlier end time first, then the title (A→Z), then the occurrence id (A→Z). All-day
 *     occurrences have no times to compare, so they only use the last two.
 *   - Two scheduled occurrences collide when they share at least one minute. Back-to-back
 *     occurrences (one ends exactly when the next begins) do not collide, and an all-day
 *     occurrence never collides.
 *   - Each colliding pair is reported once, as `[first, second]` in agenda order, and the pairs
 *     themselves follow the agenda order of their first occurrence, then of their second.
 *   - Neither function may mutate the array it is given, nor the objects inside it.
 */

export type OccurrenceStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';

export interface AgendaOccurrence {
  readonly occurrenceId: string;
  readonly title: string;
  readonly status: OccurrenceStatus;
  readonly isAllDay: boolean;
  readonly startTime: string | null;
  readonly endTime: string | null;
}

/** The occurrences to render, in the order they should appear on screen. */
export function buildDayAgenda(occurrences: AgendaOccurrence[]): AgendaOccurrence[] {
  throw new Error('Not implemented');
}

/** Pairs of occurrence ids that collide in time. */
export function findCollisions(occurrences: AgendaOccurrence[]): [string, string][] {
  throw new Error('Not implemented');
}
