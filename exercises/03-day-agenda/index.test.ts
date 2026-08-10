import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildDayAgenda, findCollisions, type AgendaOccurrence } from './index.ts';

function timed(
  occurrenceId: string,
  title: string,
  startTime: string,
  endTime: string,
  status: AgendaOccurrence['status'] = 'PENDING',
): AgendaOccurrence {
  return { occurrenceId, title, status, isAllDay: false, startTime, endTime };
}

function allDay(
  occurrenceId: string,
  title: string,
  status: AgendaOccurrence['status'] = 'PENDING',
): AgendaOccurrence {
  return { occurrenceId, title, status, isAllDay: true, startTime: null, endTime: null };
}

const day: AgendaOccurrence[] = [
  timed('o1', 'Standup', '09:00', '09:15'),
  timed('o2', 'Deep work', '09:00', '11:00'),
  allDay('o3', 'Water plants'),
  timed('o4', 'Lunch', '13:00', '14:00', 'COMPLETED'),
  timed('o5', 'Dentist', '09:30', '10:00', 'CANCELLED'),
  allDay('o6', 'Anytime reading'),
];

const idsOf = (items: AgendaOccurrence[]): string[] =>
  items.map((item) => item.occurrenceId);

describe('buildDayAgenda', () => {
  test('an empty day has an empty agenda', () => {
    assert.deepEqual(buildDayAgenda([]), []);
  });

  test('puts all-day occurrences first, then the scheduled ones by start time', () => {
    assert.deepEqual(idsOf(buildDayAgenda(day)), ['o6', 'o3', 'o1', 'o2', 'o4']);
  });

  test('leaves cancelled occurrences out', () => {
    assert.equal(
      buildDayAgenda(day).some((item) => item.occurrenceId === 'o5'),
      false,
    );
  });

  test('breaks ties by end time, then title, then id', () => {
    const agenda = buildDayAgenda([
      timed('o3', 'Alpha', '08:00', '09:00'),
      timed('o1', 'Beta', '08:00', '08:30'),
      timed('o2', 'Alpha', '08:00', '09:00'),
      allDay('b2', 'Zeta'),
      allDay('b1', 'Zeta'),
    ]);
    assert.deepEqual(idsOf(agenda), ['b1', 'b2', 'o1', 'o2', 'o3']);
  });

  test('keeps the occurrence objects as they are', () => {
    const agenda = buildDayAgenda([timed('o1', 'Standup', '09:00', '09:15')]);
    assert.deepEqual(agenda[0], timed('o1', 'Standup', '09:00', '09:15'));
  });

  test('rejects inconsistent occurrences, cancelled ones included', () => {
    assert.throws(
      () => buildDayAgenda([{ ...allDay('o1', 'Water plants'), startTime: '09:00' }]),
      Error,
    );
    assert.throws(
      () => buildDayAgenda([{ ...timed('o1', 'Standup', '09:00', '09:15'), endTime: null }]),
      Error,
    );
    assert.throws(() => buildDayAgenda([timed('o1', 'Standup', '09:00', '09:00')]), Error);
    assert.throws(() => buildDayAgenda([timed('o1', 'Standup', '10:00', '09:00')]), Error);
    assert.throws(
      () => buildDayAgenda([timed('o1', 'Dentist', '10:00', '09:00', 'CANCELLED')]),
      Error,
    );
  });

  test('does not mutate its input', () => {
    const input = day.map((item) => ({ ...item }));
    const snapshot = JSON.stringify(input);
    buildDayAgenda(input);
    assert.equal(JSON.stringify(input), snapshot);
  });
});

describe('findCollisions', () => {
  test('reports overlapping scheduled occurrences once, in agenda order', () => {
    assert.deepEqual(findCollisions(day), [['o1', 'o2']]);
  });

  test('back-to-back occurrences do not collide', () => {
    const collisions = findCollisions([
      timed('o1', 'Standup', '09:00', '10:00'),
      timed('o2', 'Deep work', '10:00', '11:00'),
    ]);
    assert.deepEqual(collisions, []);
  });

  test('an occurrence fully inside another one collides', () => {
    const collisions = findCollisions([
      timed('o2', 'Coffee', '10:00', '10:30'),
      timed('o1', 'Deep work', '09:00', '12:00'),
    ]);
    assert.deepEqual(collisions, [['o1', 'o2']]);
  });

  test('all-day occurrences never collide', () => {
    const collisions = findCollisions([
      allDay('o1', 'Water plants'),
      allDay('o2', 'Anytime reading'),
      timed('o3', 'Standup', '09:00', '09:15'),
    ]);
    assert.deepEqual(collisions, []);
  });

  test('reports every colliding pair of a busy morning', () => {
    const collisions = findCollisions([
      timed('o1', 'Deep work', '09:00', '12:00'),
      timed('o2', 'Standup', '09:30', '10:00'),
      timed('o3', 'Review', '09:45', '10:15'),
      timed('o4', 'Lunch', '13:00', '14:00'),
    ]);
    assert.deepEqual(collisions, [
      ['o1', 'o2'],
      ['o1', 'o3'],
      ['o2', 'o3'],
    ]);
  });

  test('does not mutate its input', () => {
    const input = day.map((item) => ({ ...item }));
    const snapshot = JSON.stringify(input);
    findCollisions(input);
    assert.equal(JSON.stringify(input), snapshot);
  });
});
