export const STORAGE_KEY = 'duo-pocket-lab:v1';
export const MAX_COUNT = 999999;
export const MAX_SESSIONS = 999999;
export const validMinutes = value => Number.isInteger(value) && value >= 1 && value <= 180;
const integer = (value, fallback, max) => Number.isInteger(value) && value >= 0 && value <= max ? value : fallback;

export function initialState() {
  return { version: 1, count: 0, dice: [], rolls: 0, minutes: 25, remainingMs: 25 * 60000, endsAt: null, sessions: 0 };
}

export function loadState(raw, now = Date.now()) {
  const clean = initialState();
  try {
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 1) return clean;
    clean.count = integer(saved.count, 0, MAX_COUNT);
    clean.rolls = integer(saved.rolls, 0, MAX_COUNT);
    clean.sessions = integer(saved.sessions, 0, MAX_SESSIONS);
    clean.dice = Array.isArray(saved.dice) ? saved.dice.filter(x => Number.isInteger(x) && x >= 1 && x <= 6).slice(0, 10) : [];
    clean.minutes = validMinutes(saved.minutes) ? saved.minutes : 25;
    const duration = clean.minutes * 60000;
    clean.remainingMs = typeof saved.remainingMs === 'number' && Number.isFinite(saved.remainingMs) && saved.remainingMs >= 0 && saved.remainingMs <= duration ? saved.remainingMs : duration;
    // A saved deadline may be in the past, but never more than one session ahead.
    if (Number.isSafeInteger(saved.endsAt) && saved.endsAt > 0 && saved.endsAt <= now + duration) clean.endsAt = saved.endsAt;
  } catch { /* Invalid or unavailable storage starts with safe defaults. */ }
  return clean;
}

export function changeCount(state, delta) {
  state.count = Math.min(MAX_COUNT, Math.max(0, state.count + delta));
}

export function remaining(state, now = Date.now()) {
  return state.endsAt === null ? state.remainingMs : Math.max(0, state.endsAt - now);
}

export function startTimer(state, now = Date.now()) {
  if (state.endsAt !== null) return;
  if (state.remainingMs <= 0) state.remainingMs = state.minutes * 60000;
  state.endsAt = now + state.remainingMs;
}

export function settleTimer(state, now = Date.now()) {
  if (state.endsAt === null || state.endsAt > now) return false;
  state.endsAt = null;
  state.remainingMs = 0;
  state.sessions = Math.min(MAX_SESSIONS, state.sessions + 1);
  return true;
}

export function pauseTimer(state, now = Date.now()) {
  if (settleTimer(state, now)) return;
  state.remainingMs = remaining(state, now);
  state.endsAt = null;
}

export function resetTimer(state, minutes = state.minutes) {
  if (!validMinutes(minutes)) throw new RangeError('Minutes must be an integer from 1 to 180.');
  state.minutes = minutes;
  state.remainingMs = minutes * 60000;
  state.endsAt = null;
}

// Reject the top four uint32 values to avoid modulo bias.
export function rollDie(cryptoProvider = globalThis.crypto) {
  const value = new Uint32Array(1);
  do { cryptoProvider.getRandomValues(value); } while (value[0] >= 4294967292);
  return value[0] % 6 + 1;
}

export function recordRoll(state, face) {
  state.dice = [face, ...state.dice].slice(0, 10);
  state.rolls = Math.min(MAX_COUNT, state.rolls + 1);
}

export function formatTime(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
