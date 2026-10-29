import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, loadState, changeCount, MAX_COUNT, startTimer, pauseTimer, resetTimer, settleTimer, remaining, formatTime, recordRoll, rollDie } from '../src/model.js';

test('counter clamps at zero and the supported maximum', () => {
  const state = initialState();
  changeCount(state, -1); assert.equal(state.count, 0);
  changeCount(state, 1); assert.equal(state.count, 1);
  state.count = MAX_COUNT; changeCount(state, 1); assert.equal(state.count, MAX_COUNT);
});

test('corrupt storage, unknown versions, and missing storage recover safely', () => {
  for (const raw of [null, '', '{oops', 'null', '42', JSON.stringify({ version: 2 })]) assert.deepEqual(loadState(raw), initialState());
});

test('stored state is validated field by field', () => {
  const result = loadState(JSON.stringify({ version: 1, count: -2, rolls: 1.2, sessions: 1e20, minutes: 181, remainingMs: -1, endsAt: '123', dice: [0, 1, 2, 7, '3', 6, null] }));
  assert.equal(result.count, 0); assert.equal(result.rolls, 0); assert.equal(result.sessions, 0);
  assert.equal(result.minutes, 25); assert.equal(result.remainingMs, 1500000); assert.equal(result.endsAt, null);
  assert.deepEqual(result.dice, [1, 2, 6]);
});

test('start is idempotent; pause and resume preserve subsecond remainder', () => {
  const state = initialState();
  resetTimer(state, 5); startTimer(state, 1000); startTimer(state, 4000);
  assert.equal(state.endsAt, 301000);
  assert.equal(remaining(state, 1200), 299800);
  pauseTimer(state, 7500); assert.equal(state.remainingMs, 293500); assert.equal(state.endsAt, null);
  startTimer(state, 10000); assert.equal(state.endsAt, 303500);
});

test('elapsed background timer completes exactly once, including after reload', () => {
  const state = initialState(); resetTimer(state, 1); startTimer(state, 1000);
  const restored = loadState(JSON.stringify(state), 100000);
  assert.equal(remaining(restored, 100000), 0);
  assert.equal(settleTimer(restored, 100000), true);
  assert.equal(restored.sessions, 1); assert.equal(restored.remainingMs, 0);
  assert.equal(settleTimer(restored, 100001), false);
  const again = loadState(JSON.stringify(restored), 100002);
  assert.equal(settleTimer(again, 100002), false); assert.equal(again.sessions, 1);
});

test('pause after deadline records a completed session', () => {
  const state = initialState(); resetTimer(state, 1); startTimer(state, 1);
  pauseTimer(state, 70000);
  assert.equal(state.sessions, 1); assert.equal(state.remainingMs, 0);
  startTimer(state, 70001); assert.equal(state.endsAt, 130001);
});

test('reset cancels the running timer without recording a session', () => {
  const state = initialState(); startTimer(state, 1000); resetTimer(state, 45);
  assert.equal(state.endsAt, null); assert.equal(state.remainingMs, 2700000); assert.equal(state.sessions, 0);
  for (const invalid of [0, 181, 2.5, NaN, '5']) assert.throws(() => resetTimer(state, invalid), RangeError);
});

test('invalid far-future deadlines and overlong remainders are discarded', () => {
  const state = initialState(); state.endsAt = 999999999; state.remainingMs = 999999999;
  const restored = loadState(JSON.stringify(state), 1000);
  assert.equal(restored.endsAt, null); assert.equal(restored.remainingMs, 1500000);
});

test('timer rounds up rather than showing completion early', () => {
  assert.equal(formatTime(60001), '01:01'); assert.equal(formatTime(1), '00:01');
  assert.equal(formatTime(0), '00:00'); assert.equal(formatTime(-1), '00:00'); assert.equal(formatTime(10800000), '180:00');
});

test('dice rejects biased values and maps all six accepted outcomes', () => {
  const sequence = [4294967295, 4294967292, 0, 1, 2, 3, 4, 5];
  const provider = { getRandomValues(array) { array[0] = sequence.shift(); return array; } };
  for (let face = 1; face <= 6; face++) assert.equal(rollDie(provider), face);
  assert.equal(sequence.length, 0);
});

test('dice history retains the ten most recent rolls and persists round trips', () => {
  const state = initialState();
  for (let i = 0; i < 15; i++) recordRoll(state, i % 6 + 1);
  assert.equal(state.dice.length, 10); assert.equal(state.dice[0], 3); assert.equal(state.rolls, 15);
  assert.deepEqual(loadState(JSON.stringify(state)), state);
});
