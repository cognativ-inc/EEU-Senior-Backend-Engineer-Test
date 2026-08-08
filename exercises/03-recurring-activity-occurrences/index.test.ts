import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateActivityOccurrences } from './index.ts';

describe('DAILY frequency', () => {
  test('every day within the range', () => {
    const result = generateActivityOccurrences(
      { frequency: 'DAILY', interval: 1, startDate: '2026-06-01' },
      '2026-06-01',
      '2026-06-05',
    );
    assert.deepEqual(result, ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05']);
  });

  test('every 3rd day', () => {
    const result = generateActivityOccurrences(
      { frequency: 'DAILY', interval: 3, startDate: '2026-06-01' },
      '2026-06-01',
      '2026-06-15',
    );
    assert.deepEqual(result, ['2026-06-01', '2026-06-04', '2026-06-07', '2026-06-10', '2026-06-13']);
  });

  test('narrows to the query range even though the rule produces more occurrences', () => {
    const result = generateActivityOccurrences(
      { frequency: 'DAILY', interval: 1, startDate: '2026-06-01' },
      '2026-06-03',
      '2026-06-04',
    );
    assert.deepEqual(result, ['2026-06-03', '2026-06-04']);
  });
});

describe('WEEKLY frequency without byWeekday', () => {
  test('repeats on the same weekday as startDate, every N weeks', () => {
    // 2026-06-01 is a Monday.
    const result = generateActivityOccurrences(
      { frequency: 'WEEKLY', interval: 2, startDate: '2026-06-01' },
      '2026-06-01',
      '2026-07-15',
    );
    assert.deepEqual(result, ['2026-06-01', '2026-06-15', '2026-06-29', '2026-07-13']);
  });
});

describe('WEEKLY frequency with byWeekday', () => {
  test('fires on each listed weekday; the first week only includes weekdays on/after startDate', () => {
    // 2026-06-03 is a Wednesday. Mon 06-01 is before startDate, so it's excluded from week 1
    // (but Mon 06-08 in week 2 IS included).
    const result = generateActivityOccurrences(
      { frequency: 'WEEKLY', interval: 1, startDate: '2026-06-03', byWeekday: [1, 3, 5] },
      '2026-06-01',
      '2026-06-14',
    );
    assert.deepEqual(result, ['2026-06-03', '2026-06-05', '2026-06-08', '2026-06-10', '2026-06-12']);
  });
});

describe('MONTHLY frequency', () => {
  test('clamps to the last day of shorter months, including leap-year February', () => {
    const result = generateActivityOccurrences(
      { frequency: 'MONTHLY', interval: 1, startDate: '2024-01-31' },
      '2024-01-01',
      '2024-06-30',
    );
    assert.deepEqual(result, [
      '2024-01-31',
      '2024-02-29',
      '2024-03-31',
      '2024-04-30',
      '2024-05-31',
      '2024-06-30',
    ]);
  });
});

describe('count and until bounds', () => {
  test('count caps the total number of occurrences regardless of the query range', () => {
    const result = generateActivityOccurrences(
      { frequency: 'DAILY', interval: 1, startDate: '2026-06-01', count: 3 },
      '2026-06-01',
      '2026-12-31',
    );
    assert.deepEqual(result, ['2026-06-01', '2026-06-02', '2026-06-03']);
  });

  test('until is an inclusive upper bound independent of the query range', () => {
    const result = generateActivityOccurrences(
      { frequency: 'DAILY', interval: 2, startDate: '2026-06-01', until: '2026-06-07' },
      '2026-06-01',
      '2026-12-31',
    );
    assert.deepEqual(result, ['2026-06-01', '2026-06-03', '2026-06-05', '2026-06-07']);
  });

  test('count and until together are rejected', () => {
    assert.throws(() =>
      generateActivityOccurrences(
        { frequency: 'DAILY', interval: 1, startDate: '2026-06-01', count: 3, until: '2026-06-10' },
        '2026-06-01',
        '2026-06-30',
      ),
    );
  });
});

describe('exceptions', () => {
  test('removes specific dates from the output without shifting later occurrences', () => {
    const result = generateActivityOccurrences(
      { frequency: 'DAILY', interval: 1, startDate: '2026-06-01', exceptions: ['2026-06-02'] },
      '2026-06-01',
      '2026-06-03',
    );
    assert.deepEqual(result, ['2026-06-01', '2026-06-03']);
  });
});

describe('validation', () => {
  test('rejects a non-positive or non-integer interval', () => {
    for (const interval of [0, -1, 1.5]) {
      assert.throws(() =>
        generateActivityOccurrences({ frequency: 'DAILY', interval, startDate: '2026-06-01' }, '2026-06-01', '2026-06-30'),
      );
    }
  });

  test('rejects byWeekday on a non-WEEKLY rule', () => {
    assert.throws(() =>
      generateActivityOccurrences(
        { frequency: 'DAILY', interval: 1, startDate: '2026-06-01', byWeekday: [1] },
        '2026-06-01',
        '2026-06-30',
      ),
    );
  });

  test('rejects an empty byWeekday or a value outside 0-6', () => {
    assert.throws(() =>
      generateActivityOccurrences(
        { frequency: 'WEEKLY', interval: 1, startDate: '2026-06-01', byWeekday: [] },
        '2026-06-01',
        '2026-06-30',
      ),
    );
    assert.throws(() =>
      generateActivityOccurrences(
        { frequency: 'WEEKLY', interval: 1, startDate: '2026-06-01', byWeekday: [7] },
        '2026-06-01',
        '2026-06-30',
      ),
    );
  });
});
