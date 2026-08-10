/**
 * Exercise 4 — Reminder Plan (medium/hard)
 *
 * EEU pushes a reminder to the user's phone shortly before a scheduled event starts. A worker
 * runs periodically, looks at the occurrences it knows about, and decides which ones deserve a
 * reminder job right now. Whatever it rejects has to be rejected with a reason, because those
 * decisions are logged and support uses them to answer "why didn't I get my reminder?".
 * Implement `planReminders`.
 *
 * `fireAtUtc` is the instant the push should be sent — already computed for you — and so is
 * `nowUtc`. Both are ISO instants in UTC, always in the same `'YYYY-MM-DDTHH:MM:SSZ'` shape.
 *
 * Rules:
 *   - Every candidate ends up in exactly one of the two lists, never in both, never in neither.
 *   - A candidate is checked against the conditions below IN THIS ORDER, and the first one it
 *     fails is the reason it is skipped with:
 *       1. `NOT_AN_EVENT`      — only EVENT activities remind; a SESSION never does.
 *       2. `NOT_PENDING`       — the user already resolved this occurrence.
 *       3. `ALL_DAY`           — an all-day occurrence has no start to remind about.
 *       4. `MISSING_FIRE_TIME` — there is no instant to fire at.
 *       5. `ALREADY_PAST`      — the fire instant must still be ahead of `nowUtc`. An instant
 *                                equal to `nowUtc` is too late.
 *       6. `PUSH_DISABLED`     — the user turned push notifications off. A user with no entry in
 *                                `pushSettings` counts as enabled: we would rather send a
 *                                reminder than silently drop one for a user we know nothing
 *                                about.
 *       7. `DUPLICATE_ACTIVITY` — see below.
 *   - One activity gets at most one reminder per run. When several candidates of the same
 *     activity make it past check 6, the one firing first wins and the rest are skipped as
 *     `DUPLICATE_ACTIVITY`. Two candidates firing at the very same instant are settled by the
 *     order they arrived in.
 *   - `scheduled` is ordered by fire instant, earliest first, ties broken by occurrence id
 *     (A→Z). `skipped` keeps the order the candidates arrived in.
 *   - The inputs may not be mutated.
 */

export type OccurrenceStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
export type ActivityType = 'SESSION' | 'EVENT';

export interface ReminderCandidate {
  readonly occurrenceId: string;
  readonly activityId: string;
  readonly userId: string;
  readonly type: ActivityType;
  readonly status: OccurrenceStatus;
  readonly isAllDay: boolean;
  readonly fireAtUtc: string | null;
}

export interface UserPushSettings {
  readonly userId: string;
  readonly pushEnabled: boolean;
}

export type SkipReason =
  | 'NOT_AN_EVENT'
  | 'NOT_PENDING'
  | 'ALL_DAY'
  | 'MISSING_FIRE_TIME'
  | 'ALREADY_PAST'
  | 'PUSH_DISABLED'
  | 'DUPLICATE_ACTIVITY';

export interface ScheduledReminder {
  readonly occurrenceId: string;
  readonly userId: string;
  readonly fireAtUtc: string;
}

export interface SkippedReminder {
  readonly occurrenceId: string;
  readonly reason: SkipReason;
}

export interface ReminderPlan {
  readonly scheduled: ScheduledReminder[];
  readonly skipped: SkippedReminder[];
}

export function planReminders(
  candidates: ReminderCandidate[],
  pushSettings: UserPushSettings[],
  nowUtc: string,
): ReminderPlan {
  throw new Error('Not implemented');
}
