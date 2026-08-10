/**
 * Exercise 1 — Day Summary (warm-up)
 *
 * In EEU an activity produces one occurrence per day it is scheduled for, and the user resolves
 * each one during the day: they complete it, they skip it, or they cancel it outright. Skipping
 * and cancelling look similar but mean different things — a skipped occurrence was part of the
 * day and the user chose not to do it, while a cancelled one was called off and should count as
 * if it had never been scheduled.
 *
 * The home screen turns that list into two things: a summary of how the day is going, and a
 * breakdown of where today's XP came from. Implement `summarizeDay` and `getXpByActivity`.
 *
 * Rules:
 *   - `xpReward` is always a non-negative integer.
 *   - A CANCELLED occurrence is not part of the day at all: it is not scheduled, it is not
 *     pending, and it never earns XP.
 *   - Only a COMPLETED occurrence earns its `xpReward`. PENDING and SKIPPED earn nothing.
 *   - `scheduled` counts every occurrence that is still part of the day.
 *   - `allResolved` drives a "you're done for today" state on the home screen: it means there is
 *     at least one scheduled occurrence and none of them is still PENDING.
 *   - `getXpByActivity` reports XP per activity, not per occurrence: the same `activityId` can
 *     appear in several occurrences of the same day and their XP adds up. An activity is only
 *     present in the result when it has at least one COMPLETED occurrence — even if that adds up
 *     to 0 XP.
 *   - Neither function may mutate the array it is given.
 *
 * Worth thinking about: every number in `DaySummary` can be decided from one occurrence at a
 * time, so the two functions differ less in difficulty than in what they key their answer on.
 * And in `getXpByActivity`, an activity that is absent and an activity worth 0 XP are two
 * different answers — make sure yours can tell them apart.
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
