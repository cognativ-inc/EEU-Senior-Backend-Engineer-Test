# EEU — Senior Backend Engineer Exercises

EEU is an activity-tracking product: users schedule activities, complete them day by day, earn XP
and level up, get a push reminder before an event starts, and pay for a subscription that renews
every billing period. These five exercises are taken from that domain.

Each one is a couple of plain functions you implement against a fixed test suite. There is no
architecture to design, no framework to wire, no database and no external library — the whole
test is **TypeScript, plain logic and plain data structures**. Nothing here needs date
arithmetic, rounding, or any numeric trickery; the two hardest exercises take small in-memory
objects (a payment gateway, a store) as ordinary function parameters.

What we are looking at is how you read a set of business rules and turn them into correct,
well-typed, readable code — including the edge cases the rules imply but do not spell out.

The exercises are ordered by difficulty, easiest first:

| # | Exercise | Focus |
|---|----------|-------|
| 1 | [Day Summary](#1-day-summary-warm-up) | Arrays and grouping, warm-up |
| 2 | [Level & Progress](#2-level--progress-easy) | Thresholds, boundaries, validation |
| 3 | [Day Agenda](#3-day-agenda-medium) | Ordering and interval comparison |
| 4 | [Reminder Plan](#4-reminder-plan-mediumhard) | Rule precedence, deduplication, ordering |
| 5 | [Subscription Renewal](#5-subscription-renewal-hard) | Async control flow, retries, idempotency |

## Setup

You need [Node.js](https://nodejs.org) **22.6 or newer** — Node runs TypeScript directly, so
there is no compiler and no build step. From the repository root:

```bash
npm install
```

That installs exactly two `devDependencies`, `typescript` and `@types/node`, used only for
editor type-checking. Nothing in the exercises depends on them and running the tests never
invokes the TypeScript compiler.

## How to work

Each exercise lives in `exercises/NN-name/` and has two files:

- **`index.ts`** — the file you edit. It declares every type and function signature you need,
  each one ending in `throw new Error('Not implemented')`. The comment at the top is the spec:
  read it carefully, it is where the business rules live.
- **`index.test.ts`** — the tests. Don't edit them; they are the executable version of the
  requirements below. Run them to check your progress.

Run one exercise while you work on it:

```bash
npm run test:1   # exercises/01-day-summary
npm run test:2   # exercises/02-level-progress
npm run test:3   # exercises/03-day-agenda
npm run test:4   # exercises/04-reminder-plan
npm run test:5   # exercises/05-subscription-renewal
```

Or run everything at once:

```bash
npm test
```

Optionally, `npm run typecheck` runs `tsc --noEmit` in strict mode over every exercise.

## Ground rules

- Don't change any exported type or function signature — the tests import them by exact name.
- No function may mutate an argument. Anything that "changes" something returns a new value.
- Where a function has to reject bad input, throwing a plain `Error` with a helpful message is
  enough. There is no error hierarchy to build.
- Keep it self-contained: solve each exercise inside the file it belongs to, with the language
  and its standard data structures. You are not expected to build a toolbox of helpers.
- The tests are the contract, but they are not the whole spec — the comments in `index.ts` are.
  Passing them by special-casing the fixtures is not passing them.

---

## 1. Day Summary (Warm-up)

**Files:** `exercises/01-day-summary/`

### Description

An EEU activity produces one occurrence per day it is scheduled for, and each occurrence is
PENDING, COMPLETED, SKIPPED or CANCELLED. The home screen shows a summary of the current day.
Implement `summarizeDay` and `getXpByActivity`.

### Requirements

- `xpReward` is always a non-negative integer.
- A CANCELLED occurrence is not part of the day: it is not scheduled, not pending, and never
  earns XP.
- Only COMPLETED occurrences earn their `xpReward`.
- `allResolved` means there is at least one scheduled occurrence and none of them is PENDING.
- `getXpByActivity` groups XP by activity: several occurrences of the same activity add up, and
  an activity appears only when it has at least one COMPLETED occurrence — even if that adds up
  to 0 XP.
- Neither function mutates its input.

### Expected outcome

`npm run test:1` passes all 9 tests: empty input, per-status counts, the cancelled and
all-resolved edge cases, grouping, and no mutation.

---

## 2. Level & Progress (Easy)

**Files:** `exercises/02-level-progress/`

### Description

Users level up as they earn XP. `LEVEL_THRESHOLDS[i]` is the total XP needed to reach level
`i + 1`, so everyone starts at level 1 with 0 XP. Implement `getLevelProgress` and
`getXpForLevel`.

### Requirements

- `totalXp` must be a non-negative integer; anything else throws an `Error`.
- The user's level is the highest one whose threshold they have reached — landing exactly on a
  threshold already counts as that level.
- `xpIntoLevel` is the XP earned past the threshold of the current level; `xpToNextLevel` is how
  much more is needed to reach the next one.
- The last threshold is the maximum level: past it the level stops growing and there is no next
  level to reach.
- `getXpForLevel` returns the threshold of a level and throws for a level outside the table.

### Expected outcome

`npm run test:2` passes all 8 tests, including exact-threshold boundaries, the maximum-level cap,
and input validation.

---

## 3. Day Agenda (Medium)

**Files:** `exercises/03-day-agenda/`

### Description

The schedule screen renders the occurrences of one day as an ordered agenda and warns the user
when two of them collide. Occurrences are either all-day or scheduled between two `'HH:MM'`
times of that same day — there is no timezone and no date to handle. Implement `buildDayAgenda`
and `findCollisions`.

### Requirements

- Both functions validate every occurrence they are given, including the ones that will not be
  rendered, and throw an `Error` on an inconsistent one: an all-day occurrence carries no times,
  a scheduled one carries both and ends strictly after it starts.
- CANCELLED occurrences are not rendered and never collide. Every other status is rendered.
- The agenda lists all-day occurrences first, then the scheduled ones chronologically. Ties are
  broken deterministically: earlier end time, then title (A→Z), then occurrence id (A→Z).
- Two scheduled occurrences collide when they share at least one minute. Back-to-back
  occurrences do not collide, and an all-day occurrence never collides.
- Each colliding pair is reported once as `[first, second]` in agenda order, and the pairs follow
  the agenda order of their first occurrence, then of their second.
- Neither function mutates its input.

### Expected outcome

`npm run test:3` passes all 13 tests: ordering and tie-breaking, cancelled occurrences,
validation, back-to-back and fully-contained intervals, and no mutation.

---

## 4. Reminder Plan (Medium/Hard)

**Files:** `exercises/04-reminder-plan/`

### Description

EEU pushes a reminder shortly before a scheduled event starts. A worker runs periodically and
decides which occurrences deserve a reminder job right now — and, for the rest, why not, because
those decisions are logged and support uses them to answer "why didn't I get my reminder?".
Implement `planReminders`. Instants are ISO UTC strings, always in the same
`'YYYY-MM-DDTHH:MM:SSZ'` shape, and the fire instant is already computed for you.

### Requirements

- Every candidate ends up in exactly one of the two result lists.
- The conditions are checked in a fixed order and the first one a candidate fails is the reason
  it is skipped with: `NOT_AN_EVENT`, `NOT_PENDING`, `ALL_DAY`, `MISSING_FIRE_TIME`,
  `ALREADY_PAST`, `PUSH_DISABLED`, `DUPLICATE_ACTIVITY`.
- The fire instant must still be ahead of `nowUtc`; an instant equal to it is too late.
- A user with no entry in `pushSettings` counts as enabled — we would rather send a reminder than
  silently drop one for a user we know nothing about.
- One activity gets at most one reminder per run: among the candidates that survive every other
  check, the one firing first wins and the rest are `DUPLICATE_ACTIVITY`. A tie goes to the one
  that arrived first.
- `scheduled` is ordered by fire instant, then by occurrence id. `skipped` keeps arrival order.
- The inputs are not mutated.

### Expected outcome

`npm run test:4` passes all 11 tests: every skip reason, the precedence between them, the
missing-settings default, deduplication and its tie-break, result ordering, and no mutation.

---

## 5. Subscription Renewal (Hard)

**Files:** `exercises/05-subscription-renewal/`

### Description

Every billing period a background job renews each subscription: it charges the saved payment
method and writes down what happened. The job is not guaranteed to run exactly once per
subscription and period — it is retried after a crash, a queue can deliver the same message
twice, an operator can re-run it by hand — and a user must never be charged twice for the same
period. Implement `renewSubscription`. The gateway and the store are small in-memory objects
provided by the tests.

### Requirements

- A CANCELED subscription is returned untouched, with nothing charged, read or written.
- A period already written down in the store was renewed by an earlier run: return the
  subscription untouched, without charging again.
- The gateway is called with the idempotency key `` `${subscription.id}:${period}` ``, identical
  on every attempt of that charge.
- A rejected charge is a transient failure worth retrying, up to `MAX_CHARGE_ATTEMPTS` attempts
  in total. A `DECLINED` result is a business answer, not a failure, and is never retried.
- If every attempt rejects, the last error is rethrown and the store is left untouched so a later
  run can start over.
- An approved charge is written down with its transaction id and leaves the subscription
  `ACTIVE`; a declined one is not written down and leaves it `PAST_DUE`.
- The subscription passed in is never mutated.

### Expected outcome

`npm run test:5` passes all 10 tests: the cancellation short-circuit, the happy path, a decline,
retry-then-succeed, exhausted retries, a same-period re-run being a no-op, the next period
charging again, and no mutation.
