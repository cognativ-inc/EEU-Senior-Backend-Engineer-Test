/**
 * Exercise 3 — Day Agenda (medium)
 *
 * The EEU schedule screen shows one day at a time. Some occurrences happen at a fixed time —
 * "Standup, 09:00 to 09:15" — and some are all-day: things the user wants to get done that day
 * without committing to an hour. Both kinds are listed together, all-day ones at the top, and
 * the screen also warns the user when two timed occurrences fight for the same minutes.
 *
 * Implement `buildDayAgenda`, which answers "what does this day look like, in the order it should
 * be rendered?", and `findCollisions`, which answers "which of them clash?".
 *
 * Times are 24-hour `'HH:MM'` strings, always zero-padded, and everything happens on the same
 * calendar day — there is no date and no timezone to deal with here.
 *
 * Rules:
 *   - Both functions reject an inconsistent input by throwing an `Error` with a helpful message,
 *     and they check EVERY occurrence they are given — including the ones that will not be
 *     rendered. An all-day occurrence carries no times; a scheduled one carries both, and must
 *     end strictly after it starts.
 *   - A CANCELLED occurrence is not shown and never collides with anything. Every other status
 *     is shown.
 *   - The agenda puts all-day occurrences first, then the scheduled ones in chronological order.
 *     Ties are broken so that the same input always renders the same way, in this order: the
 *     earlier end time first, then the title (A→Z), then the occurrence id (A→Z). All-day
 *     occurrences have no times to compare, so they only use the last two.
 *   - Two scheduled occurrences collide when they share at least one minute. Back-to-back
 *     occurrences (one ends exactly when the next begins) do not collide, and an all-day
 *     occurrence never collides.
 *   - Each colliding pair is reported once, as `[first, second]` in agenda order, and the pairs
 *     themselves follow the agenda order of their first occurrence, then of their second.
 *   - Neither function may mutate the array it is given, nor the objects inside it.
 *
 * Worth thinking about: the two functions are asked about the same day, filtered and ordered the
 * same way, so most of the work of the second one is already done by the first. On the times, a
 * zero-padded 'HH:MM' compares the same way chronologically and alphabetically, which is why the
 * exercise never asks you to convert one into a number. And the case that separates a correct
 * collision check from an approximate one is the boundary: sharing an instant is not the same as
 * sharing a minute.
 */

export type OccurrenceStatus =
  | "PENDING"
  | "COMPLETED"
  | "SKIPPED"
  | "CANCELLED";

export interface AgendaOccurrence {
  readonly occurrenceId: string;
  readonly title: string;
  readonly status: OccurrenceStatus;
  readonly isAllDay: boolean;
  readonly startTime: string | null;
  readonly endTime: string | null;
}

type ScheduledOccurrence = AgendaOccurrence & {
  startTime: string;
  endTime: string;
};

function invalidOccurrence(occurrence: AgendaOccurrence) {
  if (occurrence.isAllDay) {
    if (occurrence.startTime !== null || occurrence.endTime !== null) {
      throw new Error("all day occurrence cannot have start or end time");
    }
    return;
  }

  if (occurrence.startTime === null || occurrence.endTime === null) {
    throw new Error("regular ccurrence must have start or end time");
  }

  if (occurrence.startTime >= occurrence.endTime) {
    throw new Error("start must be strictly less than end time");
  }
}

function isValidSchedule(a: AgendaOccurrence): a is ScheduledOccurrence {
  return a.startTime !== null && a.endTime !== null;
}

function compare(a: string, b: string) {
  return a === b ? 0 : a < b ? -1 : 1;
}

/** The occurrences to render, in the order they should appear on screen. */
export function buildDayAgenda(
  occurrences: AgendaOccurrence[],
): AgendaOccurrence[] {
  for (const occurrence of occurrences) {
    invalidOccurrence(occurrence);
  }

  return occurrences
    .filter((x) => x.status !== "CANCELLED")
    .sort((a, b) => {
      if (a.isAllDay || b.isAllDay) {
        return a.isAllDay ? -1 : 1;
      }

      if (isValidSchedule(a) && isValidSchedule(b)) {
        const checkStartTime = compare(a.startTime, a.startTime);
        if (checkStartTime != 0) return checkStartTime;

        const checkEndTime = compare(a.endTime, a.endTime);
        if (checkEndTime != 0) return checkEndTime;
      }

      const checkTitle = compare(a.title, a.title);
      if (checkTitle != 0) return checkTitle;

      return compare(a.occurrenceId, b.occurrenceId);
    });
}

/** Pairs of occurrence ids that collide in time. */
export function findCollisions(
  occurrences: AgendaOccurrence[],
): [string, string][] {
  const dayByAgenda = buildDayAgenda(occurrences).filter(isValidSchedule);
  const res: [string, string][] = [];

  for (const [firstIdx, first] of dayByAgenda.entries()) {
    for (const second of dayByAgenda.slice(firstIdx + 1)) {
      const isOverlapping =
        first.startTime < second.endTime && second.startTime < first.endTime;
      if (isOverlapping) {
        res.push([first.occurrenceId, second.occurrenceId]);
      }
    }
  }

  return res;
}
