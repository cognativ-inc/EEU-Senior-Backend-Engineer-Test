/**
 * Exercise 5 — Idempotent Subscription Renewal
 *
 * Full description, requirements, and expected outcomes are in the repository README.
 *
 * Every billing period, a background job renews each active EEU subscription: it charges the
 * user's saved payment method for the renewal fee and updates the subscription's status
 * accordingly. The job CAN run more than once for the same subscription and period — retries, an
 * operator re-running it, a crash halfway through — so it must be safe: a user must be charged AT
 * MOST ONCE per subscription per period.
 *
 * Implement `renewSubscription` so the tests in `index.test.ts` pass.
 *
 * Business rules:
 *   1. If subscription.status is 'CANCELED', return it unchanged. Never call the gateway or the
 *      store.
 *   2. IDEMPOTENT RETRY: if `store.hasRenewalRecord(subscription.id, period)` is already true (a
 *      previous run already renewed this exact period), return the subscription unchanged.
 *      Never call the gateway.
 *   3. Otherwise, charge the gateway with `gateway.charge(idempotencyKey, subscription.renewalFeeCents)`,
 *      where idempotencyKey is `${subscription.id}:${period}`. Use the SAME idempotency key on
 *      every attempt for this call.
 *   4. The gateway call can reject to simulate a transient failure. Retry up to 3 total attempts.
 *      If every attempt rejects, rethrow the last error, and do NOT call
 *      `store.recordRenewal` — a future run should retry the whole thing from scratch.
 *   5. If the (eventual) charge result has status 'APPROVED': call
 *      `store.recordRenewal(subscription.id, period, transactionId)`, then return
 *      `{ ...subscription, status: 'ACTIVE' }`.
 *   6. If the charge result has status 'DECLINED': do NOT call `store.recordRenewal` (so a future
 *      run retries the charge), and return `{ ...subscription, status: 'PAST_DUE' }`.
 *   7. Never mutate the `subscription` object passed in.
 *
 * The gateway and store below are mocked (in-memory). Notes on their CONTRACT:
 *   - gateway.charge() can reject to simulate a transient network failure.
 *   - A 'DECLINED' result is a real business outcome, not a crash — handle it distinctly from a
 *     rejected promise.
 */

export interface Subscription {
  readonly id: string;
  readonly status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  readonly renewalFeeCents: number;
}

export interface GatewayChargeResult {
  readonly transactionId: string;
  readonly status: 'APPROVED' | 'DECLINED';
}

export interface PaymentGateway {
  charge(idempotencyKey: string, amountCents: number): Promise<GatewayChargeResult>;
}

export interface RenewalStore {
  hasRenewalRecord(subscriptionId: string, period: string): Promise<boolean>;
  recordRenewal(subscriptionId: string, period: string, transactionId: string): Promise<void>;
}

export async function renewSubscription(
  subscription: Subscription,
  period: string,
  gateway: PaymentGateway,
  store: RenewalStore,
): Promise<Subscription> {
  throw new Error('Not implemented');
}
