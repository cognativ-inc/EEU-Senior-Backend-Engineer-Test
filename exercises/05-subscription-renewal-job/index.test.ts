import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  renewSubscription,
  type Subscription,
  type PaymentGateway,
  type RenewalStore,
} from './index.ts';

// ---------------------------------------------------------------------------
// Mocks modelling the dependency CONTRACT. (You may read these but don't need to change them.)

function createGateway(opts: { failTimes?: number; decline?: boolean } = {}) {
  let failsLeft = opts.failTimes ?? 0;
  let counter = 0;
  const calls: Array<{ idempotencyKey: string; amountCents: number }> = [];

  const gateway: PaymentGateway & { calls: typeof calls } = {
    async charge(idempotencyKey, amountCents) {
      calls.push({ idempotencyKey, amountCents });
      if (failsLeft > 0) {
        failsLeft -= 1;
        throw new Error('network error');
      }
      counter += 1;
      return { transactionId: `txn_${counter}`, status: opts.decline ? 'DECLINED' : 'APPROVED' };
    },
    calls,
  };
  return gateway;
}

function createStore() {
  const renewedPeriods = new Set<string>();
  const records: Array<{ subscriptionId: string; period: string; transactionId: string }> = [];

  const store: RenewalStore & { records: typeof records } = {
    async hasRenewalRecord(subscriptionId, period) {
      return renewedPeriods.has(`${subscriptionId}:${period}`);
    },
    async recordRenewal(subscriptionId, period, transactionId) {
      renewedPeriods.add(`${subscriptionId}:${period}`);
      records.push({ subscriptionId, period, transactionId });
    },
    records,
  };
  return store;
}

const activeSubscription: Subscription = { id: 'sub_1', status: 'ACTIVE', renewalFeeCents: 2000 };

describe('renewSubscription', () => {
  test('a CANCELED subscription is returned unchanged and never charged', async () => {
    const canceled: Subscription = { id: 'sub_1', status: 'CANCELED', renewalFeeCents: 2000 };
    const gateway = createGateway();
    const store = createStore();

    const result = await renewSubscription(canceled, '2026-06', gateway, store);

    assert.deepEqual(result, canceled);
    assert.equal(gateway.calls.length, 0);
  });

  test('happy path charges once and marks the subscription ACTIVE', async () => {
    const gateway = createGateway();
    const store = createStore();

    const result = await renewSubscription(activeSubscription, '2026-06', gateway, store);

    assert.equal(result.status, 'ACTIVE');
    assert.equal(gateway.calls.length, 1);
    assert.equal(gateway.calls[0]?.idempotencyKey, 'sub_1:2026-06');
    assert.equal(gateway.calls[0]?.amountCents, 2000);
    assert.deepEqual(store.records, [{ subscriptionId: 'sub_1', period: '2026-06', transactionId: 'txn_1' }]);
  });

  test('a DECLINED charge marks the subscription PAST_DUE and records nothing', async () => {
    const gateway = createGateway({ decline: true });
    const store = createStore();

    const result = await renewSubscription(activeSubscription, '2026-06', gateway, store);

    assert.equal(result.status, 'PAST_DUE');
    assert.equal(store.records.length, 0);
  });

  test('retries transient gateway failures using the same idempotency key, then succeeds', async () => {
    const gateway = createGateway({ failTimes: 2 });
    const store = createStore();

    const result = await renewSubscription(activeSubscription, '2026-06', gateway, store);

    assert.equal(result.status, 'ACTIVE');
    assert.equal(gateway.calls.length, 3);
    for (const call of gateway.calls) {
      assert.equal(call.idempotencyKey, 'sub_1:2026-06');
    }
  });

  test('gives up after 3 attempts, rethrows, and records nothing', async () => {
    const gateway = createGateway({ failTimes: 5 });
    const store = createStore();

    await assert.rejects(() => renewSubscription(activeSubscription, '2026-06', gateway, store));
    assert.equal(gateway.calls.length, 3);
    assert.equal(store.records.length, 0);
  });

  test('a second run for the same subscription and period is a no-op', async () => {
    const gateway = createGateway();
    const store = createStore();

    await renewSubscription(activeSubscription, '2026-06', gateway, store);
    const second = await renewSubscription(activeSubscription, '2026-06', gateway, store);

    assert.deepEqual(second, activeSubscription);
    assert.equal(gateway.calls.length, 1, 'the gateway must not be charged twice for the same period');
  });

  test('a renewal for a different period charges again', async () => {
    const gateway = createGateway();
    const store = createStore();

    await renewSubscription(activeSubscription, '2026-06', gateway, store);
    await renewSubscription(activeSubscription, '2026-07', gateway, store);

    assert.equal(gateway.calls.length, 2);
  });

  test('does not mutate the input subscription', async () => {
    const gateway = createGateway();
    const store = createStore();
    const copy = { ...activeSubscription };

    await renewSubscription(activeSubscription, '2026-06', gateway, store);

    assert.deepEqual(activeSubscription, copy);
  });
});
