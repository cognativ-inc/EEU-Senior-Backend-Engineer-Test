/**
 * Exercise 2 — Level & Progress (easy)
 *
 * EEU users earn XP for what they do in the app, and that XP accumulates into levels. Levelling
 * is defined by a single table: `LEVEL_THRESHOLDS[i]` is the total XP needed to reach level
 * `i + 1`. The first entry is 0, which is why everyone starts at level 1 with no XP, and the last
 * entry is the top of the ladder — there is nothing above it.
 *
 * The profile screen needs more than the level number: it draws a progress bar, so it also needs
 * how far into the current level the user is and how much is still missing for the next one.
 * Implement `getLevelProgress` and `getXpForLevel`.
 *
 * Rules:
 *   - `totalXp` is always a non-negative integer.
 *   - A user's level is the highest level whose threshold they have reached. Reaching a
 *     threshold exactly is enough to be on that level.
 *   - `xpIntoLevel` is the XP earned past the threshold of the level the user is currently on.
 *   - `xpToNextLevel` is how much MORE XP is needed to reach the next level.
 *   - The last threshold is the maximum level. Beyond it there is nothing left to reach: the
 *     level stops growing no matter how much XP is earned, and `xpToNextLevel` has no answer.
 *   - `getXpForLevel` answers "what does level N cost?" for any level in the table. A level below
 *     the first one or above the last one has no answer: throw an `Error` with a helpful message.
 *
 * Worth thinking about: the whole exercise is about reading a position in that table, so the
 * cases that decide whether your answer is right are the ones at its edges — a user sitting
 * exactly on a threshold, and a user past the last one, who is still levelled and still earning
 * XP even though there is no next level to point at. `xpToNextLevel` has to say "there is no next
 * level" in a way the profile screen can distinguish from "one more XP to go".
 */

export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000] as const;

export interface LevelProgress {
  readonly level: number;
  readonly xpIntoLevel: number;
  readonly xpToNextLevel: number | null;
  readonly isMaxLevel: boolean;
}

export function getLevelProgress(totalXp: number): LevelProgress {
  throw new Error('Not implemented');
}

/** Total XP required to reach `level` (1-based). */
export function getXpForLevel(level: number): number {
  throw new Error('Not implemented');
}
