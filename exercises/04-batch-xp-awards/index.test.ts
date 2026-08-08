import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { applyXpAwards, type UserXp, type XpAward } from './index.ts';

describe('applyXpAwards', () => {
  test('applies a single award to an existing user without leveling up', () => {
    const result = applyXpAwards([{ userId: 'u1', totalXp: 10 }], [{ userId: 'u1', xpToAward: 5 }]);
    assert.deepEqual(result, {
      users: [{ userId: 'u1', totalXp: 15 }],
      leveledUp: [],
      rejected: [],
    });
  });

  test('accumulates multiple awards for the same user', () => {
    const result = applyXpAwards(
      [{ userId: 'u1', totalXp: 0 }],
      [
        { userId: 'u1', xpToAward: 10 },
        { userId: 'u1', xpToAward: 15 },
      ],
    );
    assert.equal(result.users[0]?.totalXp, 25);
  });

  test('creates a new user starting from 0 XP when an award references an unknown userId', () => {
    const result = applyXpAwards([], [{ userId: 'new-user', xpToAward: 40 }]);
    assert.deepEqual(result.users, [{ userId: 'new-user', totalXp: 40 }]);
  });

  test('rejects non-positive or non-integer awards without affecting totals or creating users', () => {
    const result = applyXpAwards(
      [{ userId: 'u1', totalXp: 10 }],
      [
        { userId: 'u1', xpToAward: -5 },
        { userId: 'u1', xpToAward: 0 },
        { userId: 'u1', xpToAward: 2.5 },
        { userId: 'never-created', xpToAward: -1 },
      ],
    );
    assert.deepEqual(result.users, [{ userId: 'u1', totalXp: 10 }]);
    assert.deepEqual(result.rejected, [
      { userId: 'u1', xpToAward: -5 },
      { userId: 'u1', xpToAward: 0 },
      { userId: 'u1', xpToAward: 2.5 },
      { userId: 'never-created', xpToAward: -1 },
    ]);
  });

  test('reports exactly one leveledUp entry even when a user crosses several thresholds across multiple awards', () => {
    const users: UserXp[] = [{ userId: 'u1', totalXp: 90 }];
    const awards: XpAward[] = [
      { userId: 'u1', xpToAward: 20 }, // 90 -> 110, crosses level 1 -> 2
      { userId: 'u1', xpToAward: 600 }, // 110 -> 710, crosses level 2 -> 4
    ];
    const result = applyXpAwards(users, awards);
    assert.deepEqual(result.leveledUp, [{ userId: 'u1', previousLevel: 1, newLevel: 4 }]);
    assert.equal(result.users[0]?.totalXp, 710);
  });

  test('orders result users as original users first, then newly-introduced users by first accepted award', () => {
    const result = applyXpAwards(
      [
        { userId: 'u1', totalXp: 90 },
        { userId: 'u2', totalXp: 0 },
      ],
      [
        { userId: 'u1', xpToAward: 20 },
        { userId: 'u2', xpToAward: 5 },
        { userId: 'u3', xpToAward: 50 },
        { userId: 'u1', xpToAward: -1 }, // rejected, does not affect anything
        { userId: 'u4', xpToAward: 2.5 }, // rejected, u4 must not appear anywhere in `users`
        { userId: 'u1', xpToAward: 600 },
      ],
    );

    assert.deepEqual(result.users, [
      { userId: 'u1', totalXp: 710 },
      { userId: 'u2', totalXp: 5 },
      { userId: 'u3', totalXp: 50 },
    ]);
    assert.deepEqual(result.leveledUp, [{ userId: 'u1', previousLevel: 1, newLevel: 4 }]);
    assert.deepEqual(result.rejected, [
      { userId: 'u1', xpToAward: -1 },
      { userId: 'u4', xpToAward: 2.5 },
    ]);
  });

  test('does not mutate the input arrays', () => {
    const users: UserXp[] = [{ userId: 'u1', totalXp: 10 }];
    const awards: XpAward[] = [{ userId: 'u1', xpToAward: 5 }];
    const usersCopy = structuredClone(users);
    const awardsCopy = structuredClone(awards);

    applyXpAwards(users, awards);

    assert.deepEqual(users, usersCopy);
    assert.deepEqual(awards, awardsCopy);
  });
});
