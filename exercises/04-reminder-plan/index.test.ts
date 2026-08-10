import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  planReminders,
  type ReminderCandidate,
  type UserPushSettings,
} from './index.ts';

const NOW = '2026-06-01T08:00:00Z';

function candidate(
  occurrenceId: string,
  overrides: Partial<ReminderCandidate> = {},
): ReminderCandidate {
  return {
    occurrenceId,
    activityId: `activity-${occurrenceId}`,
    userId: 'u1',
    type: 'EVENT',
    status: 'PENDING',
    isAllDay: false,
    fireAtUtc: '2026-06-01T09:00:00Z',
    ...overrides,
  };
}

const settings: UserPushSettings[] = [
  { userId: 'u1', pushEnabled: true },
  { userId: 'u2', pushEnabled: false },
];

describe('planReminders', () => {
  test('an empty run plans nothing', () => {
    assert.deepEqual(planReminders([], settings, NOW), { scheduled: [], skipped: [] });
  });

  test('schedules an eligible occurrence', () => {
    const plan = planReminders([candidate('o1')], settings, NOW);
    assert.deepEqual(plan.scheduled, [
      { occurrenceId: 'o1', userId: 'u1', fireAtUtc: '2026-06-01T09:00:00Z' },
    ]);
    assert.deepEqual(plan.skipped, []);
  });

  test('skips each ineligible occurrence with its reason', () => {
    const plan = planReminders(
      [
        candidate('o1', { type: 'SESSION' }),
        candidate('o2', { status: 'COMPLETED' }),
        candidate('o3', { status: 'CANCELLED' }),
        candidate('o4', { isAllDay: true }),
        candidate('o5', { fireAtUtc: null }),
        candidate('o6', { fireAtUtc: '2026-06-01T07:59:59Z' }),
        candidate('o7', { userId: 'u2' }),
      ],
      settings,
      NOW,
    );
    assert.deepEqual(plan.scheduled, []);
    assert.deepEqual(plan.skipped, [
      { occurrenceId: 'o1', reason: 'NOT_AN_EVENT' },
      { occurrenceId: 'o2', reason: 'NOT_PENDING' },
      { occurrenceId: 'o3', reason: 'NOT_PENDING' },
      { occurrenceId: 'o4', reason: 'ALL_DAY' },
      { occurrenceId: 'o5', reason: 'MISSING_FIRE_TIME' },
      { occurrenceId: 'o6', reason: 'ALREADY_PAST' },
      { occurrenceId: 'o7', reason: 'PUSH_DISABLED' },
    ]);
  });

  test('a fire instant equal to now is already past', () => {
    const plan = planReminders([candidate('o1', { fireAtUtc: NOW })], settings, NOW);
    assert.deepEqual(plan.skipped, [{ occurrenceId: 'o1', reason: 'ALREADY_PAST' }]);
  });

  test('reports the first failed check when several fail', () => {
    const plan = planReminders(
      [
        candidate('o1', { type: 'SESSION', status: 'SKIPPED', isAllDay: true, fireAtUtc: null }),
        candidate('o2', { status: 'SKIPPED', isAllDay: true, userId: 'u2' }),
        candidate('o3', { isAllDay: true, fireAtUtc: null }),
      ],
      settings,
      NOW,
    );
    assert.deepEqual(plan.skipped, [
      { occurrenceId: 'o1', reason: 'NOT_AN_EVENT' },
      { occurrenceId: 'o2', reason: 'NOT_PENDING' },
      { occurrenceId: 'o3', reason: 'ALL_DAY' },
    ]);
  });

  test('a user without push settings still gets reminders', () => {
    const plan = planReminders([candidate('o1', { userId: 'u9' })], settings, NOW);
    assert.deepEqual(plan.scheduled, [
      { occurrenceId: 'o1', userId: 'u9', fireAtUtc: '2026-06-01T09:00:00Z' },
    ]);
  });

  test('keeps only the earliest reminder of an activity', () => {
    const plan = planReminders(
      [
        candidate('o1', { activityId: 'a1', fireAtUtc: '2026-06-01T12:00:00Z' }),
        candidate('o2', { activityId: 'a1', fireAtUtc: '2026-06-01T10:00:00Z' }),
        candidate('o3', { activityId: 'a1', fireAtUtc: '2026-06-01T11:00:00Z' }),
      ],
      settings,
      NOW,
    );
    assert.deepEqual(plan.scheduled, [
      { occurrenceId: 'o2', userId: 'u1', fireAtUtc: '2026-06-01T10:00:00Z' },
    ]);
    assert.deepEqual(plan.skipped, [
      { occurrenceId: 'o1', reason: 'DUPLICATE_ACTIVITY' },
      { occurrenceId: 'o3', reason: 'DUPLICATE_ACTIVITY' },
    ]);
  });

  test('a tie between two reminders of an activity goes to the first one given', () => {
    const plan = planReminders(
      [
        candidate('o2', { activityId: 'a1', fireAtUtc: '2026-06-01T10:00:00Z' }),
        candidate('o1', { activityId: 'a1', fireAtUtc: '2026-06-01T10:00:00Z' }),
      ],
      settings,
      NOW,
    );
    assert.deepEqual(plan.scheduled, [
      { occurrenceId: 'o2', userId: 'u1', fireAtUtc: '2026-06-01T10:00:00Z' },
    ]);
    assert.deepEqual(plan.skipped, [{ occurrenceId: 'o1', reason: 'DUPLICATE_ACTIVITY' }]);
  });

  test('an ineligible occurrence never blocks another one of the same activity', () => {
    const plan = planReminders(
      [
        candidate('o1', { activityId: 'a1', fireAtUtc: '2026-06-01T07:00:00Z' }),
        candidate('o2', { activityId: 'a1', fireAtUtc: '2026-06-01T10:00:00Z' }),
      ],
      settings,
      NOW,
    );
    assert.deepEqual(plan.scheduled, [
      { occurrenceId: 'o2', userId: 'u1', fireAtUtc: '2026-06-01T10:00:00Z' },
    ]);
    assert.deepEqual(plan.skipped, [{ occurrenceId: 'o1', reason: 'ALREADY_PAST' }]);
  });

  test('orders the plan by fire instant and keeps the skipped ones in arrival order', () => {
    const candidates: ReminderCandidate[] = [
      candidate('o1', { fireAtUtc: '2026-06-01T09:00:00Z' }),
      candidate('o2', { type: 'SESSION' }),
      candidate('o3', { fireAtUtc: '2026-06-01T08:30:00Z' }),
      candidate('o4', { status: 'SKIPPED' }),
      candidate('zz', { fireAtUtc: '2026-06-01T08:30:00Z' }),
      candidate('o5', { userId: 'u2' }),
    ];
    const plan = planReminders(candidates, settings, NOW);
    assert.deepEqual(
      plan.scheduled.map((reminder) => reminder.occurrenceId),
      ['o3', 'zz', 'o1'],
    );
    assert.deepEqual(plan.skipped, [
      { occurrenceId: 'o2', reason: 'NOT_AN_EVENT' },
      { occurrenceId: 'o4', reason: 'NOT_PENDING' },
      { occurrenceId: 'o5', reason: 'PUSH_DISABLED' },
    ]);
  });

  test('does not mutate its inputs', () => {
    const candidates: ReminderCandidate[] = [
      candidate('o1', { activityId: 'a1', fireAtUtc: '2026-06-01T12:00:00Z' }),
      candidate('o2', { activityId: 'a1', fireAtUtc: '2026-06-01T10:00:00Z' }),
      candidate('o3', { type: 'SESSION' }),
    ];
    const candidatesSnapshot = JSON.stringify(candidates);
    const settingsSnapshot = JSON.stringify(settings);
    planReminders(candidates, settings, NOW);
    assert.equal(JSON.stringify(candidates), candidatesSnapshot);
    assert.equal(JSON.stringify(settings), settingsSnapshot);
  });
});
