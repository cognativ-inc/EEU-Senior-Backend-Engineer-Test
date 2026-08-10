import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  renewSubscription,
  MAX_CHARGE_ATTEMPTS,
  type ChargeResult,
  type Subscription,
} from './index.ts';

const subscription: Subscription = {
  id: 'sub-1',
  userId: 'u1',
  status: 'ACTIVE',
  renewalFeeCents: 999,
};

const approved: ChargeResult = { outcome: 'APPROVED', transactionId: 'tx-1' };
const declined: ChargeResult = { outcome: 'DECLINED', declineCode: 'insufficient_funds' };

/** Replays `script` one entry per charge; an Error entry rejects. The last entry repeats. */
function createGateway(script: (ChargeResult | Error)[]) {
  const keys: string[] = [];
  const amounts: number[] = [];

  return {
    keys,
    amounts,
    async charge(idempotencyKey: string, amountCents: number): Promise<ChargeResult> {
      const step = script[keys.length] ?? script[script.length - 1];
      keys.push(idempotencyKey);
      amounts.push(amountCents);
      if (step instanceof Error) throw step;
      return step!;
    },
  };
}

function createStore(initial: string[] = []) {
  const records = new Map<string, string>();
  for (const key of initial) records.set(key, 'tx-old');
  const calls: string[] = [];

  return {
    records,
    calls,
    async hasRenewal(subscriptionId: string, period: string): Promise<boolean> {
      calls.push(`hasRenewal(${subscriptionId},${period})`);
      return records.has(`${subscriptionId}:${period}`);
    },
    async saveRenewal(subscriptionId: string, period: string, transactionId: string): Promise<void> {
      calls.push(`saveRenewal(${subscriptionId},${period},${transactionId})`);
      records.set(`${subscriptionId}:${period}`, transactionId);
    },
  };
}

describe('renewSubscription', () => {
  test('leaves a canceled subscription alone without touching gateway or store', async () => {
    const gateway = createGateway([approved]);
    const store = createStore();
    const canceled: Subscription = { ...subscription, status: 'CANCELED' };

    const result = await renewSubscription(canceled, '2026-06', gateway, store);

    assert.deepEqual(result, canceled);
    assert.equal(gateway.keys.length, 0);
    assert.deepEqual(store.calls, []);
  });

  test('charges the renewal fee and activates the subscription when approved', async () => {
    const gateway = createGateway([approved]);
    const store = createStore();

    const result = await renewSubscription(
      { ...subscription, status: 'TRIALING' },
      '2026-06',
      gateway,
      store,
    );

    assert.equal(result.status, 'ACTIVE');
    assert.deepEqual(gateway.keys, ['sub-1:2026-06']);
    assert.deepEqual(gateway.amounts, [999]);
    assert.deepEqual(store.calls, [
      'hasRenewal(sub-1,2026-06)',
      'saveRenewal(sub-1,2026-06,tx-1)',
    ]);
  });

  test('marks the subscription past due and records nothing when declined', async () => {
    const gateway = createGateway([declined]);
    const store = createStore();

    const result = await renewSubscription(subscription, '2026-06', gateway, store);

    assert.equal(result.status, 'PAST_DUE');
    assert.equal(gateway.keys.length, 1);
    assert.equal(store.records.size, 0);
    assert.deepEqual(store.calls, ['hasRenewal(sub-1,2026-06)']);
  });

  test('retries a rejected charge with the same idempotency key', async () => {
    const gateway = createGateway([new Error('socket hang up'), new Error('timeout'), approved]);
    const store = createStore();

    const result = await renewSubscription(subscription, '2026-06', gateway, store);

    assert.equal(result.status, 'ACTIVE');
    assert.deepEqual(gateway.keys, ['sub-1:2026-06', 'sub-1:2026-06', 'sub-1:2026-06']);
    assert.equal(store.records.get('sub-1:2026-06'), 'tx-1');
  });

  test('gives up after the maximum number of attempts and rethrows the last error', async () => {
    const gateway = createGateway([
      new Error('first'),
      new Error('second'),
      new Error('third'),
      approved,
    ]);
    const store = createStore();

    await assert.rejects(
      () => renewSubscription(subscription, '2026-06', gateway, store),
      /third/,
    );
    assert.equal(gateway.keys.length, MAX_CHARGE_ATTEMPTS);
    assert.equal(store.records.size, 0);
    assert.deepEqual(store.calls, ['hasRenewal(sub-1,2026-06)']);
  });

  test('does not retry a declined charge', async () => {
    const gateway = createGateway([declined, approved]);
    const store = createStore();

    const result = await renewSubscription(subscription, '2026-06', gateway, store);

    assert.equal(result.status, 'PAST_DUE');
    assert.equal(gateway.keys.length, 1);
  });

  test('running twice for the same period only charges once', async () => {
    const gateway = createGateway([approved]);
    const store = createStore();

    const first = await renewSubscription(subscription, '2026-06', gateway, store);
    const second = await renewSubscription(first, '2026-06', gateway, store);

    assert.equal(gateway.keys.length, 1);
    assert.deepEqual(second, first);
    assert.equal(
      store.calls.filter((call) => call.startsWith('saveRenewal')).length,
      1,
    );
  });

  test('a subscription already renewed by an earlier run is returned untouched', async () => {
    const gateway = createGateway([approved]);
    const store = createStore(['sub-1:2026-06']);
    const pastDue: Subscription = { ...subscription, status: 'PAST_DUE' };

    const result = await renewSubscription(pastDue, '2026-06', gateway, store);

    assert.deepEqual(result, pastDue);
    assert.equal(gateway.keys.length, 0);
  });

  test('the next period is charged again', async () => {
    const gateway = createGateway([approved, { outcome: 'APPROVED', transactionId: 'tx-2' }]);
    const store = createStore();

    await renewSubscription(subscription, '2026-06', gateway, store);
    await renewSubscription(subscription, '2026-07', gateway, store);

    assert.deepEqual(gateway.keys, ['sub-1:2026-06', 'sub-1:2026-07']);
    assert.equal(store.records.get('sub-1:2026-07'), 'tx-2');
  });

  test('does not mutate the subscription it is given', async () => {
    const gateway = createGateway([approved]);
    const store = createStore();
    const input: Subscription = { ...subscription, status: 'PAST_DUE' };
    const snapshot = JSON.stringify(input);

    await renewSubscription(input, '2026-06', gateway, store);

    assert.equal(JSON.stringify(input), snapshot);
  });
});
