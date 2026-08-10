import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  summarizeDay,
  getXpByActivity,
  type DayOccurrence,
} from './index.ts';

const day: DayOccurrence[] = [
  { occurrenceId: 'o1', activityId: 'a1', title: 'Morning run', status: 'COMPLETED', xpReward: 20 },
  { occurrenceId: 'o2', activityId: 'a1', title: 'Evening run', status: 'COMPLETED', xpReward: 15 },
  { occurrenceId: 'o3', activityId: 'a2', title: 'Meditate', status: 'PENDING', xpReward: 10 },
  { occurrenceId: 'o4', activityId: 'a3', title: 'Read', status: 'SKIPPED', xpReward: 30 },
  { occurrenceId: 'o5', activityId: 'a4', title: 'Call mum', status: 'CANCELLED', xpReward: 50 },
];

describe('summarizeDay', () => {
  test('an empty day is all zeros and not resolved', () => {
    assert.deepEqual(summarizeDay([]), {
      scheduled: 0,
      completed: 0,
      pending: 0,
      skipped: 0,
      xpEarned: 0,
      allResolved: false,
    });
  });

  test('counts each status and ignores cancelled occurrences', () => {
    assert.deepEqual(summarizeDay(day), {
      scheduled: 4,
      completed: 2,
      pending: 1,
      skipped: 1,
      xpEarned: 35,
      allResolved: false,
    });
  });

  test('only completed occurrences earn xp', () => {
    const summary = summarizeDay([
      { occurrenceId: 'o1', activityId: 'a1', title: 'Run', status: 'PENDING', xpReward: 20 },
      { occurrenceId: 'o2', activityId: 'a2', title: 'Read', status: 'SKIPPED', xpReward: 30 },
      { occurrenceId: 'o3', activityId: 'a3', title: 'Call', status: 'CANCELLED', xpReward: 40 },
    ]);
    assert.equal(summary.xpEarned, 0);
  });

  test('a day with no pending occurrences left is resolved', () => {
    const summary = summarizeDay([
      { occurrenceId: 'o1', activityId: 'a1', title: 'Run', status: 'COMPLETED', xpReward: 20 },
      { occurrenceId: 'o2', activityId: 'a2', title: 'Read', status: 'SKIPPED', xpReward: 30 },
      { occurrenceId: 'o3', activityId: 'a3', title: 'Call', status: 'CANCELLED', xpReward: 40 },
    ]);
    assert.equal(summary.scheduled, 2);
    assert.equal(summary.allResolved, true);
  });

  test('a day made only of cancelled occurrences is not resolved', () => {
    const summary = summarizeDay([
      { occurrenceId: 'o1', activityId: 'a1', title: 'Call', status: 'CANCELLED', xpReward: 40 },
    ]);
    assert.equal(summary.scheduled, 0);
    assert.equal(summary.allResolved, false);
  });
});

describe('getXpByActivity', () => {
  test('an empty day has no entries', () => {
    assert.deepEqual(getXpByActivity([]), new Map());
  });

  test('adds up the xp of every completed occurrence of the same activity', () => {
    assert.deepEqual(getXpByActivity(day), new Map([['a1', 35]]));
  });

  test('keeps an activity whose completed occurrences add up to 0', () => {
    const result = getXpByActivity([
      { occurrenceId: 'o1', activityId: 'a1', title: 'Stretch', status: 'COMPLETED', xpReward: 0 },
      { occurrenceId: 'o2', activityId: 'a2', title: 'Read', status: 'PENDING', xpReward: 30 },
    ]);
    assert.deepEqual(result, new Map([['a1', 0]]));
  });
});

describe('immutability', () => {
  test('neither function mutates its input', () => {
    const input: DayOccurrence[] = day.map((occurrence) => ({ ...occurrence }));
    const snapshot = JSON.stringify(input);
    summarizeDay(input);
    getXpByActivity(input);
    assert.equal(JSON.stringify(input), snapshot);
  });
});
