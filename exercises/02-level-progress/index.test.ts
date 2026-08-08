import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLevelProgress } from './index.ts';

test('starts at level 1 with zero XP', () => {
  assert.deepEqual(getLevelProgress(0), { level: 1, xpIntoLevel: 0, xpToNextLevel: 100 });
});

test('tracks progress within level 1', () => {
  assert.deepEqual(getLevelProgress(50), { level: 1, xpIntoLevel: 50, xpToNextLevel: 50 });
  assert.deepEqual(getLevelProgress(99), { level: 1, xpIntoLevel: 99, xpToNextLevel: 1 });
});

test('reaches a level exactly at its threshold', () => {
  assert.deepEqual(getLevelProgress(100), { level: 2, xpIntoLevel: 0, xpToNextLevel: 200 });
  assert.deepEqual(getLevelProgress(600), { level: 4, xpIntoLevel: 0, xpToNextLevel: 400 });
});

test('tracks progress mid-level', () => {
  assert.deepEqual(getLevelProgress(250), { level: 2, xpIntoLevel: 150, xpToNextLevel: 50 });
  assert.deepEqual(getLevelProgress(999), { level: 4, xpIntoLevel: 399, xpToNextLevel: 1 });
});

test('caps at the final level with no further xpToNextLevel', () => {
  assert.deepEqual(getLevelProgress(1500), { level: 6, xpIntoLevel: 0, xpToNextLevel: null });
  assert.deepEqual(getLevelProgress(5000), { level: 6, xpIntoLevel: 3500, xpToNextLevel: null });
});
