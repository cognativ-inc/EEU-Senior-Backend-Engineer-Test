/**
 * Exercise 4 — Reminder Plan (medium/hard)
 *
 * EEU pushes a reminder to the user's phone shortly before a scheduled event starts. A worker
 * runs periodically, looks at the occurrences it knows about, and decides which of them deserve a
 * reminder job right now.
 *
 * Most of them don't, for all sorts of ordinary reasons: the activity is not the kind that
 * reminds, the user already ticked it off, the moment to send has gone by, push is switched off
 * on that account. Every rejection has to come back with the reason for it, because these
 * decisions are logged and support reads them back to answer "why didn't I get my reminder?" —
 * "not eligible" is not an answer anyone can act on. Implement `planReminders`.
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
 *
 * Worth thinking about: the order of the checks is part of the contract, not an implementation
 * detail — an occurrence that fails several of them has one reason on the log, and it is the
 * first. Note too that six of the seven reasons can be decided by looking at a candidate on its
 * own, and one cannot: it depends on the other candidates of the same activity, including ones
 * you have not looked at yet when you first meet it. That last rule can therefore change a
 * decision you have already taken, which is worth settling before you start writing. Instants
 * compare the same way chronologically and alphabetically in the shape they arrive in, so none of
 * them needs parsing.
 */

export type OccurrenceStatus =
  | "PENDING"
  | "COMPLETED"
  | "SKIPPED"
  | "CANCELLED";
export type ActivityType = "SESSION" | "EVENT";

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
  | "NOT_AN_EVENT"
  | "NOT_PENDING"
  | "ALL_DAY"
  | "MISSING_FIRE_TIME"
  | "ALREADY_PAST"
  | "PUSH_DISABLED"
  | "DUPLICATE_ACTIVITY";

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

type Eligible = {
  candidate: ReminderCandidate;
  idx: number;
  fireAtUtc: string;
};

export function planReminders(
  candidates: ReminderCandidate[],
  pushSettings: UserPushSettings[],
  nowUtc: string,
): ReminderPlan {
  const skipped = new Array<SkippedReminder | null>(candidates.length).fill(
    null,
  );

  const eligibles: Eligible[] = [];

  for (const [idx, candidate] of candidates.entries()) {
    let reason: SkipReason;
    if (candidate.type !== "EVENT") {
      reason = "NOT_AN_EVENT";
    } else if (candidate.status !== "PENDING") {
      reason = "NOT_PENDING";
    } else if (candidate.isAllDay) {
      reason = "ALL_DAY";
    } else if (!candidate.fireAtUtc) {
      reason = "MISSING_FIRE_TIME";
    } else if (candidate.fireAtUtc <= nowUtc) {
      reason = "ALREADY_PAST";
    } else if (
      pushSettings.find((x) => x.userId === candidate.userId && !x.pushEnabled)
    ) {
      reason = "PUSH_DISABLED";
    } else {
      eligibles.push({
        candidate,
        idx,
        fireAtUtc: candidate.fireAtUtc,
      });
      continue;
    }

    skipped[idx] = {
      occurrenceId: candidate.occurrenceId,
      reason,
    };
  }

  const winnersByActivity = new Map<string, Eligible>();
  for (const e of eligibles) {
    const winner = winnersByActivity.get(e.candidate.activityId);

    if (winner === undefined) {
      winnersByActivity.set(e.candidate.activityId, e);
    } else if (e.fireAtUtc < winner.fireAtUtc) {
      winnersByActivity.set(e.candidate.activityId, e);
      skipped[winner.idx] = {
        occurrenceId: winner.candidate.occurrenceId,
        reason: "DUPLICATE_ACTIVITY",
      };
    } else {
      skipped[e.idx] = {
        occurrenceId: e.candidate.occurrenceId,
        reason: "DUPLICATE_ACTIVITY",
      };
    }
  }

  const scheduled = [...winnersByActivity.values()]
    .sort((a, b) => {
      if (a.fireAtUtc < b.fireAtUtc) return -1;
      if (a.fireAtUtc > b.fireAtUtc) return 1;

      if (a.candidate.occurrenceId < b.candidate.occurrenceId) return -1;
      if (a.candidate.occurrenceId > b.candidate.occurrenceId) return 1;

      return 0;
    })
    .map((x) => {
      return {
        occurrenceId: x.candidate.occurrenceId,
        userId: x.candidate.userId,
        fireAtUtc: x.fireAtUtc,
      };
    });

  return { skipped: skipped.filter((x) => x !== null), scheduled };
}
