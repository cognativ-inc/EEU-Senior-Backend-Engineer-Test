/**
 * Exercise 5 — Subscription Renewal (hard)
 *
 * EEU subscriptions renew every billing period. A background job walks the subscriptions of the
 * period, charges the saved payment method, and writes down what happened. The job is not
 * guaranteed to run exactly once per subscription and period: it is retried after a crash, a
 * queue can deliver the same message twice, and an operator can re-run it by hand. What must
 * never happen is charging a user twice for the same period. Implement `renewSubscription`.
 *
 * The gateway and the store are small in-memory objects in the tests — there is no real
 * infrastructure here, just their contract:
 *   - `charge` rejects when the call itself failed (network, timeout). Nothing is known about
 *     the money in that case.
 *   - `charge` resolves with `DECLINED` when the call succeeded and the bank said no. That is an
 *     answer, not a failure.
 *   - `hasRenewal` tells whether a renewal was already written down for that subscription and
 *     period; `saveRenewal` writes it down.
 *
 * Rules:
 *   - A CANCELED subscription is not renewed and is returned untouched. Nothing is charged and
 *     nothing is read or written.
 *   - A period already written down in the store was renewed by an earlier run: return the
 *     subscription untouched, without charging again.
 *   - The idempotency key handed to the gateway is `` `${subscription.id}:${period}` `` and it is
 *     the same on every attempt of that charge, so that the gateway can recognise a retry
 *     instead of taking a second payment.
 *   - A rejected charge is transient and worth retrying, up to `MAX_CHARGE_ATTEMPTS` attempts in
 *     total. A DECLINED charge is never retried.
 *   - If every attempt rejects, the error of the last one is rethrown and the store is left
 *     exactly as it was, so a later run can start the whole renewal over.
 *   - An approved charge is written down together with its transaction id, and leaves the
 *     subscription ACTIVE.
 *   - A declined charge is not written down — a later run has to be able to charge again — and
 *     leaves the subscription PAST_DUE.
 *   - The subscription passed in is never mutated.
 */

export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

export interface Subscription {
  readonly id: string;
  readonly userId: string;
  readonly status: SubscriptionStatus;
  readonly renewalFeeCents: number;
}

export type ChargeResult =
  | { readonly outcome: 'APPROVED'; readonly transactionId: string }
  | { readonly outcome: 'DECLINED'; readonly declineCode: string };

export interface PaymentGateway {
  charge(idempotencyKey: string, amountCents: number): Promise<ChargeResult>;
}

export interface RenewalStore {
  hasRenewal(subscriptionId: string, period: string): Promise<boolean>;
  saveRenewal(subscriptionId: string, period: string, transactionId: string): Promise<void>;
}

export const MAX_CHARGE_ATTEMPTS = 3;

/** `period` identifies the billing period, e.g. '2026-06'. */
export async function renewSubscription(
  subscription: Subscription,
  period: string,
  gateway: PaymentGateway,
  store: RenewalStore,
): Promise<Subscription> {
  throw new Error('Not implemented');
}
