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
there is no compiler and no build step. Older versions (Node 20 and below) cannot run the test
suite at all: they don't understand `.ts` files and will fail with an "Unknown file extension
.ts" error.

Check what you have:

```bash
node --version
```

If that prints something below `v22.6.0`, install or upgrade Node first.

**Recommended: use a version manager.** It lets you install Node without touching your system
package manager and switch versions per-project.

- [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm install 22
  nvm use 22
  ```
- [fnm](https://github.com/Schniz/fnm):
  ```bash
  fnm install 22
  fnm use 22
  ```

Already have `nvm` or `fnm` installed but on an older Node? The same `install`/`use` commands
upgrade you — no uninstall step needed.

**Without a version manager:**

- macOS: `brew install node` (or `brew upgrade node` if you already have it via Homebrew)
- Windows/Linux: download the latest LTS installer from [nodejs.org](https://nodejs.org)

Once `node --version` reports `v22.6.0` or newer, install dependencies from the repository root:

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
- Inputs arrive well-formed unless a rule says otherwise: there is no defensive type checking to
  write. Where a rule does ask you to reject something, throwing a plain `Error` with a helpful
  message is enough — there is no error hierarchy to build.
- Keep it self-contained: solve each exercise inside the file it belongs to, with the language
  and its standard data structures. You are not expected to build a toolbox of helpers.
- The tests are the contract, but they are not the whole spec — the comments in `index.ts` are.
  Passing them by special-casing the fixtures is not passing them.

---

## 1. Day Summary (Warm-up)

**Files:** `exercises/01-day-summary/`

### Description

An EEU activity produces one occurrence per day it is scheduled for, and the user resolves each
one during the day: they complete it, they skip it, or they cancel it outright. Skipping and
cancelling look similar but mean different things — a skipped occurrence was part of the day and
the user chose not to do it, while a cancelled one was called off and counts as if it had never
been scheduled.

The home screen turns that list into a summary of how the day is going, plus a breakdown of where
today's XP came from. Implement `summarizeDay` and `getXpByActivity`.

Every number in the summary can be decided from one occurrence at a time; the second function
differs less in difficulty than in what it keys its answer on. Watch the distinction between an
activity that is absent from the breakdown and one that is there but worth 0 XP.

### Requirements

- `xpReward` is always a non-negative integer.
- A CANCELLED occurrence is not part of the day: it is not scheduled, not pending, and never
  earns XP.
- Only COMPLETED occurrences earn their `xpReward`.
- `allResolved` means there is at least one scheduled occurrence and none of them is PENDING.
- `getXpByActivity` groups XP by activity into a `Map`: several occurrences of the same activity
  add up, and an activity appears only when it has at least one COMPLETED occurrence — even if
  that adds up to 0 XP.
- Neither function mutates its input.

### Expected outcome

`npm run test:1` passes all 9 tests: empty input, per-status counts, the cancelled and
all-resolved edge cases, grouping, and no mutation.

---

## 2. Level & Progress (Easy)

**Files:** `exercises/02-level-progress/`

### Description

Users earn XP for what they do in the app, and that XP accumulates into levels defined by a
single table: `LEVEL_THRESHOLDS[i]` is the total XP needed to reach level `i + 1`. The first entry
is 0, which is why everyone starts at level 1 with no XP, and the last entry is the top of the
ladder — there is nothing above it.

The profile screen needs more than the level number: it draws a progress bar, so it also needs how
far into the current level the user is and how much is still missing for the next one. Implement
`getLevelProgress` and `getXpForLevel`.

The whole exercise is about reading a position in that table, so what decides whether your answer
is right are its edges: a user sitting exactly on a threshold, and a user past the last one — who
is still levelled and still earning XP even though there is no next level to point at.

### Requirements

- `totalXp` is always a non-negative integer; there is no input validation to write here.
- The user's level is the highest one whose threshold they have reached — landing exactly on a
  threshold already counts as that level.
- `xpIntoLevel` is the XP earned past the threshold of the current level; `xpToNextLevel` is how
  much more is needed to reach the next one.
- The last threshold is the maximum level: past it the level stops growing and there is no next
  level to reach.
- `getXpForLevel` returns the threshold of a level and throws an `Error` for a level below the
  first one or above the last one.

### Expected outcome

`npm run test:2` passes all 7 tests, including exact-threshold boundaries, the maximum-level cap,
and out-of-range levels.

---

## 3. Day Agenda (Medium)

**Files:** `exercises/03-day-agenda/`

### Description

The schedule screen shows one day at a time. Some occurrences happen at a fixed time — "Standup,
09:00 to 09:15" — and some are all-day: things the user wants to get done that day without
committing to an hour. Both kinds are listed together, all-day ones at the top, and the screen
also warns the user when two timed occurrences fight for the same minutes.

Implement `buildDayAgenda`, which answers "what does this day look like, in the order it should be
rendered?", and `findCollisions`, which answers "which of them clash?". Times are 24-hour `'HH:MM'`
strings, always zero-padded, and everything happens on the same calendar day — no dates, no
timezones.

Both functions are asked about the same day, filtered and ordered the same way, so most of the
work of the second one is already done by the first. A zero-padded `'HH:MM'` compares the same way
chronologically and alphabetically, which is why nothing here asks you to turn one into a number.
The case that separates a correct collision check from an approximate one is the boundary:
sharing an instant is not the same as sharing a minute.

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
decides which occurrences deserve a reminder job right now.

Most of them don't, for all sorts of ordinary reasons: the activity is not the kind that reminds,
the user already ticked it off, the moment to send has gone by, push is switched off on that
account. Every rejection has to come back with the reason for it, because these decisions are
logged and support reads them back to answer "why didn't I get my reminder?" — "not eligible" is
not an answer anyone can act on. Implement `planReminders`. Instants are ISO UTC strings, always
in the same `'YYYY-MM-DDTHH:MM:SSZ'` shape, and the fire instant is already computed for you.

The order of the checks is part of the contract, not an implementation detail: an occurrence that
fails several of them has one reason on the log, and it is the first. Six of the seven reasons can
be decided by looking at a candidate on its own; one cannot, because it depends on the other
candidates of the same activity — including ones you have not looked at yet when you first meet
it. That rule can therefore change a decision you have already taken.

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
method and writes down what happened.

The job is not guaranteed to run exactly once per subscription and period. It is retried after a
crash, a queue can deliver the same message twice, an operator can re-run it by hand — so the same
subscription and period can reach this function several times, possibly after an earlier run died
halfway through its work. What must never happen is charging a user twice for the same period, and
the money is the one part of this that cannot be undone from here. Implement `renewSubscription`;
the gateway and the store are small in-memory objects provided by the tests.

Two separate mechanisms guard against taking a second payment, and they cover different accidents:
one stops a run that happens after an earlier one finished, the other stops a second charge inside
a run that is still going. Not every failure is the same kind of failure either — some mean "we
don't know what happened to the money", some mean "the bank answered, and the answer was no". The
most useful question to keep asking is what the next run would see: for each way this function can
end, decide what it leaves written down, and check that a run starting from there does the right
thing.

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
