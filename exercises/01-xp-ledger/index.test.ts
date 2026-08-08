import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getTotalXp, getTotalXpOnDate, type CompletionRecord } from './index.ts';

const sample: CompletionRecord[] = [
  { activityId: 'a1', xpReward: 20, completedAt: '2026-06-01' },
  { activityId: 'a2', xpReward: 15, completedAt: '2026-06-01' },
  { activityId: 'a3', xpReward: 30, completedAt: '2026-06-02' },
];

describe('getTotalXp', () => {
  test('empty list totals 0', () => {
    assert.equal(getTotalXp([]), 0);
  });

  test('sums xpReward across every record', () => {
    assert.equal(getTotalXp(sample), 65);
  });

  test('does not mutate the input', () => {
    const copy = [...sample];
    getTotalXp(sample);
    assert.deepEqual(sample, copy);
  });
});

describe('getTotalXpOnDate', () => {
  test('sums only records matching the given date', () => {
    assert.equal(getTotalXpOnDate(sample, '2026-06-01'), 35);
    assert.equal(getTotalXpOnDate(sample, '2026-06-02'), 30);
  });

  test('returns 0 for a date with no records', () => {
    assert.equal(getTotalXpOnDate(sample, '2026-06-03'), 0);
  });

  test('does not mutate the input', () => {
    const copy = [...sample];
    getTotalXpOnDate(sample, '2026-06-01');
    assert.deepEqual(sample, copy);
  });
});
