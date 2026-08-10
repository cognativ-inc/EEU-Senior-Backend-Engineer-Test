/**
 * Exercise 2 — Level & Progress (easy)
 *
 * EEU users earn XP and level up. `LEVEL_THRESHOLDS[i]` is the total XP needed to reach level
 * `i + 1`, so every user starts at level 1 with 0 XP. Implement the two functions below.
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
