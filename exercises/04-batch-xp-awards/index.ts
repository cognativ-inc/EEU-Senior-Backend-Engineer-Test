/**
 * Exercise 4 — Batch XP Awards
 *
 * Full description, requirements, and expected outcomes are in the repository README.
 *
 * A nightly job collects every XP award earned during the day (one per completed activity) and
 * applies them to each user's running total in a single batch. Implement `applyXpAwards` so the
 * tests in `index.test.ts` pass.
 *
 * Business rules:
 *   1. Process awards in the order given. If the same userId appears in more than one award,
 *      their xpToAward amounts accumulate.
 *   2. A userId that doesn't appear in `users` starts from totalXp 0.
 *   3. An award whose xpToAward is not a positive integer is REJECTED: it does not affect any
 *      total, and is returned in `rejected` instead (in the order it appeared in `awards`).
 *   4. `users` in the result is a NEW array (the input arrays must not be mutated), containing
 *      every user from the input plus any new user introduced by an award, with totalXp fully
 *      updated. Order: the original `users` order first, then newly-introduced users in the
 *      order their first (accepted) award appears in `awards`.
 *   5. `leveledUp` contains one entry for every user whose level increased (using
 *      LEVEL_THRESHOLDS below), in the same order as `users` in the result. A user who received
 *      no accepted awards, or whose awards didn't cross a threshold, is not included — even if
 *      they crossed several thresholds in one batch, they get exactly one entry spanning the
 *      full jump.
 */

export const LEVEL_THRESHOLDS: readonly number[] = [0, 100, 300, 600, 1000, 1500];

export interface UserXp {
  readonly userId: string;
  readonly totalXp: number;
}

export interface XpAward {
  readonly userId: string;
  readonly xpToAward: number;
}

export interface LevelUp {
  readonly userId: string;
  readonly previousLevel: number;
  readonly newLevel: number;
}

export interface BatchResult {
  readonly users: UserXp[];
  readonly leveledUp: LevelUp[];
  readonly rejected: XpAward[];
}

export function applyXpAwards(users: UserXp[], awards: XpAward[]): BatchResult {
  throw new Error('Not implemented');
}
