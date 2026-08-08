/**
 * Exercise 3 — Recurring Activity Occurrences
 *
 * Full description, requirements, and expected outcomes are in the repository README.
 *
 * EEU lets a user turn an activity into a recurring one ("Meditate every weekday", "Water the
 * plants every 2 weeks"). Whenever the schedule screen asks "what's on my calendar between date
 * A and date B", the backend expands the recurrence rule into concrete calendar dates. That
 * expansion is what this exercise asks you to implement — no database, no timezone handling
 * beyond plain calendar dates ('YYYY-MM-DD', no time-of-day component).
 *
 * Implement `generateActivityOccurrences` below. Do not change the exported type or function
 * signature — the tests in `index.test.ts` depend on them exactly as declared.
 */

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ActivityRecurrenceRule {
  readonly frequency: RecurrenceFrequency;
  /** Repeat every N days / weeks / months, depending on frequency. Must be a positive integer. */
  readonly interval: number;
  /** ISO date ('YYYY-MM-DD') of the first possible occurrence. */
  readonly startDate: string;
  /** Total number of occurrences the rule produces, counted from startDate. Mutually exclusive with `until`. */
  readonly count?: number;
  /** ISO date ('YYYY-MM-DD'), inclusive — the rule produces no occurrence after this date. Mutually exclusive with `count`. */
  readonly until?: string;
  /** WEEKLY only: which weekdays each matching week fires on. 0 = Sunday .. 6 = Saturday. */
  readonly byWeekday?: readonly number[];
  /** ISO dates to exclude from the output even though the rule would otherwise produce them. */
  readonly exceptions?: readonly string[];
}

/**
 * Expands `rule` into every occurrence date that falls within [rangeStart, rangeEnd] (both
 * inclusive), as a sorted array of unique ISO date strings.
 *
 * Rules:
 *   - DAILY: occurrences are startDate, startDate + interval days, + 2*interval days, ...
 *   - WEEKLY without byWeekday: occurrences fall on the same weekday as startDate, every
 *     `interval` weeks.
 *   - WEEKLY with byWeekday: occurrences fall on each listed weekday, in weeks spaced `interval`
 *     apart (the first matching week is the one containing startDate; only weekdays on or after
 *     startDate count in that first week — later matching weeks include every listed weekday).
 *   - MONTHLY: occurrences fall on the same day-of-month as startDate, every `interval` months.
 *     If a target month is too short to have that day (e.g. day 31 in April), use that month's
 *     last day instead (e.g. April 30) — never skip the month or roll into the next one.
 *   - `count`, if present, caps the TOTAL number of occurrences the rule ever produces, counted
 *     from startDate — independent of rangeStart/rangeEnd.
 *   - `until`, if present, is an inclusive upper bound on an occurrence's own date — independent
 *     of rangeStart/rangeEnd. `count` and `until` are mutually exclusive.
 *   - `exceptions` removes specific dates from the output. An excepted date still counts as one
 *     of the rule's `count` occurrences; it is just omitted from the result.
 *
 * Throws a plain Error when:
 *   - interval is not a positive integer.
 *   - both `count` and `until` are present.
 *   - `count` is present and is not a positive integer.
 *   - `byWeekday` is present on a non-WEEKLY rule, is empty, or contains a value outside 0-6.
 */
export function generateActivityOccurrences(
  rule: ActivityRecurrenceRule,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  throw new Error('Not implemented');
}
