# EEU — Senior Backend Engineer Exercises

Five self-contained exercises about EEU, a habit/activity-tracking product: users earn XP for
completing activities, level up, schedule recurring activities, and renew a subscription each
billing period. Each exercise is a couple of plain functions you implement against a fixed test
suite — there is no architecture to design here. The point is to assess **TypeScript and
problem-solving ability**: reading precise business rules and translating them into correct,
well-typed code — not to assess how you'd layer a backend service.

Everything is **pure TypeScript**: no database, no HTTP framework, no external runtime libraries.
The two hardest exercises take small in-memory mock objects as plain function parameters (a
payment gateway, a store) — never a real dependency-injection setup.

The exercises are ordered by difficulty, easiest first:

| # | Exercise | Focus |
|---|----------|-------|
| 1 | [Daily XP Total](#1-daily-xp-total-easy) | Arrays, filtering, warm-up |
| 2 | [Level & Progress](#2-level--progress-easymedium) | Precise business-rule translation |
| 3 | [Recurring Activity Occurrences](#3-recurring-activity-occurrences-medium) | Date/calendar algorithms, edge cases |
| 4 | [Batch XP Awards](#4-batch-xp-awards-mediumhard) | Aggregation, ordering, immutability |
| 5 | [Idempotent Subscription Renewal](#5-idempotent-subscription-renewal-hard) | Async control flow, retries, idempotency |

## Setup

You need [Node.js](https://nodejs.org) **22.6 or newer** (Node runs TypeScript directly — no
compiler, no `ts-node`, no build step). From the repository root:

```bash
npm install
```

That installs exactly two `devDependencies` — `typescript` and `@types/node` — used only for
editor/IDE type-checking (`npm run typecheck`). Nothing in the exercises depends on them; running
the tests never invokes the TypeScript compiler.

## How to work

Each exercise lives in `exercises/NN-name/` and has three files:

- **`index.ts`** — the file you edit. It declares every type and function signature you need,
  each ending in `throw new Error('Not implemented')`. Read the comment above each function —
  it's the spec.
- **`index.test.ts`** — the tests. Don't edit this; it's the executable version of the
  requirements below. Run it to check your progress.
- **`index.solution.ts`** — a reference solution. It's `.gitignore`d (see below) so it never ends
  up in a fork or a candidate's clone.

Run one exercise's tests while you work on it:

```bash
npm run test:1   # exercises/01-xp-ledger
npm run test:2   # exercises/02-level-progress
npm run test:3   # exercises/03-recurring-activity-occurrences
npm run test:4   # exercises/04-batch-xp-awards
npm run test:5   # exercises/05-subscription-renewal-job
```

Or run everything at once:

```bash
npm test
```

Optional: `npm run typecheck` runs `tsc --noEmit` in strict mode across every exercise, if you
want editor-grade type-checking beyond what Node's runtime type-stripping catches.

## Ground rules

- Any function that "changes" something must return a **new** value and leave its input
  untouched — none of these functions should mutate an argument.
- Don't change any exported type or function signature in `index.ts` — the tests import them by
  exact name.
- Where a function needs to reject bad input, throwing a plain `Error` (with a helpful message)
  is enough — there's no custom error hierarchy to build.

---

## 1. Daily XP Total (Easy)

**Files:** `exercises/01-xp-ledger/`

### Description

Every time a user completes an activity in EEU, it's recorded as a `CompletionRecord`. Implement
two small aggregation functions over an array of records.

### Requirements

- `xpReward` is always a non-negative integer; `completedAt` is an ISO calendar date
  (`'YYYY-MM-DD'`, no time component).
- `getTotalXp(records)`: sum of `xpReward` across every record. An empty list totals `0`.
- `getTotalXpOnDate(records, isoDate)`: sum of `xpReward` across only the records whose
  `completedAt` equals `isoDate` exactly.
- Neither function may mutate the `records` array.

### Expected outcome

`npm run test:1` passes all 6 tests: empty input, summing, exact-date filtering, and
no-mutation checks.

---

## 2. Level & Progress (Easy/Medium)

**Files:** `exercises/02-level-progress/`

### Description

EEU users level up as they earn XP. `LEVEL_THRESHOLDS[i]` is the total XP required to reach level
`i + 1` (so level 1 starts at 0 XP). Implement `getLevelProgress(totalXp)`.

### Requirements

1. A user's level is the highest level whose threshold is `<= totalXp`.
2. `xpIntoLevel` is how much XP they have past the threshold for their current level.
3. `xpToNextLevel` is how much MORE XP they need to reach the next level, or `null` if they are
   already at the final level (there is no threshold above `LEVEL_THRESHOLDS`' last entry).
4. Once `totalXp` reaches or exceeds the highest threshold, the level is capped there — it never
   goes higher no matter how much more XP is earned.

### Expected outcome

`npm run test:2` passes all 5 tests, including exact-threshold boundaries and the max-level cap.

---

## 3. Recurring Activity Occurrences (Medium)

**Files:** `exercises/03-recurring-activity-occurrences/`

### Description

EEU lets a user turn an activity into a recurring one ("Meditate every weekday", "Water the
plants every 2 weeks"). Whenever the schedule screen asks "what's on my calendar between date A
and date B", the backend expands the recurrence rule into concrete calendar dates. That
expansion is `generateActivityOccurrences`. Dates are plain `'YYYY-MM-DD'` calendar dates — no
time-of-day, no timezone handling.

### Requirements

- `DAILY`: occurrences at `startDate`, `startDate + interval` days, `+ 2*interval` days, …
- `WEEKLY` without `byWeekday`: same weekday as `startDate`, every `interval` weeks.
- `WEEKLY` with `byWeekday`: fires on each listed weekday (`0` = Sunday … `6` = Saturday), in weeks
  spaced `interval` apart. The first matching week only includes weekdays on/after `startDate`;
  later matching weeks include every listed weekday.
- `MONTHLY`: same day-of-month as `startDate`, every `interval` months. If a target month is too
  short for that day (e.g. day 31 in April), clamp to that month's last day — never skip or roll
  into the next month. Must also handle leap-year February correctly.
- `count` caps the **total** number of occurrences the rule ever produces, counted from
  `startDate`, independent of the query range. `until` is an inclusive upper bound on an
  occurrence's own date, independent of the query range. `count` and `until` are mutually
  exclusive.
- `exceptions` removes specific dates from the output; an excepted date still consumes one of the
  rule's `count` occurrences, it's just omitted from the result.
- The result is every occurrence inside `[rangeStart, rangeEnd]` (both inclusive), sorted,
  deduplicated.
- Throws a plain `Error` for a non-positive/non-integer `interval`, `count` and `until` both
  present, an invalid `count`, or `byWeekday` used on a non-`WEEKLY` rule / empty / outside `0–6`.

### Expected outcome

`npm run test:3` passes all 13 tests: every frequency, month-end clamping across a leap year,
`count`/`until` bounds, exceptions, range narrowing, and rule validation.

---

## 4. Batch XP Awards (Medium/Hard)

**Files:** `exercises/04-batch-xp-awards/`

### Description

A nightly job collects every XP award earned during the day (one per completed activity) and
applies them to each user's running total in a single batch. Implement
`applyXpAwards(users, awards)`.

### Requirements

1. Process awards in the order given. If the same `userId` appears in more than one award, their
   `xpToAward` amounts accumulate.
2. A `userId` that doesn't appear in `users` starts from `totalXp` 0.
3. An award whose `xpToAward` is not a positive integer is **rejected**: it does not affect any
   total, and is returned in `rejected` instead (in the order it appeared in `awards`).
4. `users` in the result is a **new** array (the input arrays must not be mutated), containing
   every user from the input plus any new user introduced by an award, with `totalXp` fully
   updated. Order: the original `users` order first, then newly-introduced users in the order
   their first accepted award appears in `awards`.
5. `leveledUp` contains one entry for every user whose level increased (using the same
   `LEVEL_THRESHOLDS` table as exercise 2), in the same order as `users` in the result. A user
   who received no accepted awards, or whose awards didn't cross a threshold, is not included —
   even if they crossed several thresholds in one batch, they get exactly one entry spanning the
   full jump.

### Expected outcome

`npm run test:4` passes all 7 tests: accumulation, new-user creation, rejection without side
effects, a multi-threshold single-entry level-up, result ordering, and no-mutation of the inputs.

---

## 5. Idempotent Subscription Renewal (Hard)

**Files:** `exercises/05-subscription-renewal-job/`

### Description

Every billing period, a background job renews each active EEU subscription: it charges the
user's saved payment method for the renewal fee and updates the subscription's status
accordingly. The job **can run more than once** for the same subscription and period — retries,
an operator re-running it, a crash halfway through — so it must be safe: a user must be charged
**at most once** per subscription per period. Implement
`renewSubscription(subscription, period, gateway, store)`.

The gateway and store are mocked (in-memory) in the tests. Notes on their contract:

- `gateway.charge()` can reject to simulate a transient network failure.
- A `'DECLINED'` result is a real business outcome, not a crash — handle it distinctly from a
  rejected promise.

### Requirements

1. If `subscription.status` is `'CANCELED'`, return it unchanged. Never call the gateway or the
   store.
2. **Idempotent retry:** if `store.hasRenewalRecord(subscription.id, period)` is already `true`
   (a previous run already renewed this exact period), return the subscription unchanged. Never
   call the gateway.
3. Otherwise, charge the gateway: `gateway.charge(idempotencyKey, subscription.renewalFeeCents)`,
   where `idempotencyKey` is `` `${subscription.id}:${period}` ``. Use the **same** idempotency
   key on every attempt for this call.
4. The gateway call can reject to simulate a transient failure. Retry up to **3 total attempts**.
   If every attempt rejects, rethrow the last error, and do **not** call `store.recordRenewal` —
   a future run should retry the whole thing from scratch.
5. If the (eventual) charge result is `'APPROVED'`: call
   `store.recordRenewal(subscription.id, period, transactionId)`, then return
   `{ ...subscription, status: 'ACTIVE' }`.
6. If the charge result is `'DECLINED'`: do **not** call `store.recordRenewal` (so a future run
   retries the charge), and return `{ ...subscription, status: 'PAST_DUE' }`.
7. Never mutate the `subscription` object passed in.

### Expected outcome

`npm run test:5` passes all 8 tests: cancellation short-circuit, the happy path, a declined
charge, retry-then-succeed, exhausting retries and rethrowing, a same-period double-run being a
no-op, a different period charging again, and no-mutation of the input.

---

## For interviewers: reference solutions

Every exercise's `index.solution.ts` is a complete reference implementation, matched line-for-line
against `index.test.ts`. They're excluded via `.gitignore` (`*.solution.ts`) so they never end up
in a candidate's clone or fork. To check a solution against its tests without editing the
gitignore, run something like:

```bash
cd exercises/01-xp-ledger
sed 's/\.\/index\.ts/.\/index.solution.ts/' index.test.ts > /tmp/verify.test.ts
node --test /tmp/verify.test.ts
rm /tmp/verify.test.ts
```
