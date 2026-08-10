import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getLevelProgress, getXpForLevel, LEVEL_THRESHOLDS } from './index.ts';

describe('getLevelProgress', () => {
  test('a brand new user is on level 1', () => {
    assert.deepEqual(getLevelProgress(0), {
      level: 1,
      xpIntoLevel: 0,
      xpToNextLevel: 100,
      isMaxLevel: false,
    });
  });

  test('reports progress inside the current level', () => {
    assert.deepEqual(getLevelProgress(60), {
      level: 1,
      xpIntoLevel: 60,
      xpToNextLevel: 40,
      isMaxLevel: false,
    });
    assert.deepEqual(getLevelProgress(400), {
      level: 3,
      xpIntoLevel: 150,
      xpToNextLevel: 100,
      isMaxLevel: false,
    });
  });

  test('landing exactly on a threshold is already the new level', () => {
    assert.deepEqual(getLevelProgress(100), {
      level: 2,
      xpIntoLevel: 0,
      xpToNextLevel: 150,
      isMaxLevel: false,
    });
    assert.deepEqual(getLevelProgress(99), {
      level: 1,
      xpIntoLevel: 99,
      xpToNextLevel: 1,
      isMaxLevel: false,
    });
  });

  test('the last threshold is the maximum level', () => {
    assert.deepEqual(getLevelProgress(2000), {
      level: LEVEL_THRESHOLDS.length,
      xpIntoLevel: 0,
      xpToNextLevel: null,
      isMaxLevel: true,
    });
  });

  test('xp beyond the maximum level keeps accumulating but does not level up', () => {
    assert.deepEqual(getLevelProgress(9999), {
      level: LEVEL_THRESHOLDS.length,
      xpIntoLevel: 7999,
      xpToNextLevel: null,
      isMaxLevel: true,
    });
  });

});

describe('getXpForLevel', () => {
  test('returns the threshold of each level', () => {
    assert.equal(getXpForLevel(1), 0);
    assert.equal(getXpForLevel(2), 100);
    assert.equal(getXpForLevel(LEVEL_THRESHOLDS.length), 2000);
  });

  test('rejects levels outside the table', () => {
    assert.throws(() => getXpForLevel(0), Error);
    assert.throws(() => getXpForLevel(-3), Error);
    assert.throws(() => getXpForLevel(LEVEL_THRESHOLDS.length + 1), Error);
  });
});
