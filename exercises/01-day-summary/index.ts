/**
 * Exercise 1 — Day Summary (warm-up)
 *
 * In EEU an activity produces one "occurrence" per day it is scheduled for. The home screen
 * shows a summary of the current day: how many occurrences there are, how many are done, and
 * how much XP the user earned. Implement the two functions below.
 *
 * Rules:
 *   - `xpReward` is always a non-negative integer.
 *   - A CANCELLED occurrence is not part of the day at all: it is not scheduled, it is not
 *     pending, and it never earns XP.
 *   - Only a COMPLETED occurrence earns its `xpReward`. PENDING and SKIPPED earn nothing.
 *   - `scheduled` counts every occurrence that is still part of the day.
 *   - `allResolved` means the user has nothing left to do today: there is at least one
 *     scheduled occurrence and none of them is still PENDING.
 *   - `getXpByActivity` reports XP per activity, not per occurrence: the same `activityId` can
 *     appear in several occurrences and their XP adds up. An activity is only present in the
 *     result when it has at least one COMPLETED occurrence — even if that adds up to 0 XP.
 *   - Neither function may mutate the array it is given.
 */

export type OccurrenceStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';

export interface DayOccurrence {
  readonly occurrenceId: string;
  readonly activityId: string;
  readonly title: string;
  readonly status: OccurrenceStatus;
  readonly xpReward: number;
}

export interface DaySummary {
  readonly scheduled: number;
  readonly completed: number;
  readonly pending: number;
  readonly skipped: number;
  readonly xpEarned: number;
  readonly allResolved: boolean;
}

/** Counts and XP for a single day. An empty day is all zeros and `allResolved: false`. */
export function summarizeDay(occurrences: DayOccurrence[]): DaySummary {
  throw new Error('Not implemented');
}

/** XP earned today, grouped by activity. Keys are activity ids. */
export function getXpByActivity(occurrences: DayOccurrence[]): Map<string, number> {
  throw new Error('Not implemented');
}
