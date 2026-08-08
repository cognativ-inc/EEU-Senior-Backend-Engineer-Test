/**
 * Exercise 2 — Level & Progress
 *
 * Full description, requirements, and expected outcomes are in the repository README.
 *
 * EEU users level up as they earn XP. LEVEL_THRESHOLDS[i] is the total XP required to reach level
 * i + 1 (so level 1 starts at 0 XP). Implement getLevelProgress so the tests pass.
 *
 * Business rules:
 *   1. A user's level is the highest level whose threshold is <= their totalXp.
 *   2. xpIntoLevel is how much XP they have past the threshold for their current level.
 *   3. xpToNextLevel is how much MORE XP they need to reach the next level, or null if they are
 *      already at the final level (there is no threshold above LEVEL_THRESHOLDS' last entry).
 *   4. Once totalXp reaches or exceeds the highest threshold, the level is capped there — it
 *      never goes higher no matter how much more XP is earned.
 */

export const LEVEL_THRESHOLDS: readonly number[] = [0, 100, 300, 600, 1000, 1500];

export interface LevelProgress {
  readonly level: number;
  readonly xpIntoLevel: number;
  readonly xpToNextLevel: number | null;
}

export function getLevelProgress(totalXp: number): LevelProgress {
  throw new Error('Not implemented');
}
