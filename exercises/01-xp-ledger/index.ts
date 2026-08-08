/**
 * Exercise 1 — Daily XP Total
 *
 * Full description, requirements, and expected outcomes are in the repository README.
 *
 * Every time a user completes an activity in EEU, it's recorded as a CompletionRecord. Implement
 * the two functions below so the tests in `index.test.ts` pass.
 *
 *   - xpReward is always a non-negative integer.
 *   - completedAt is an ISO calendar date, 'YYYY-MM-DD' (no time component).
 *   - Neither function may mutate the `records` array it's given.
 *
 * @format
 */

export interface CompletionRecord {
  readonly activityId: string;
  readonly xpReward: number;
  readonly completedAt: string;
}

/** Sum of xpReward across every record. An empty list totals 0. */
export function getTotalXp(records: CompletionRecord[]): number {
  let total = 0;
  for (const record of records) {
    total += record.xpReward;
  }
  return total;
}

export function getTotalXpOnDate(
  records: CompletionRecord[],
  isoDate: string,
): number {
  return getTotalXp(records.filter(record => record.completedAt === isoDate));
}
