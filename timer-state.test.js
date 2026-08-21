const test = require('node:test');
const assert = require('node:assert/strict');
const { nextSession, durationSeconds } = require('./timer-state');

const settings = { focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, cyclesUntilLongBreak: 4 };

test('alternates focus and break with a long break every fourth focus', () => {
  assert.deepEqual(nextSession('focus', 0, settings), { mode: 'break', completedFocusCycles: 1 });
  assert.deepEqual(nextSession('break', 1, settings), { mode: 'focus', completedFocusCycles: 1 });
  assert.deepEqual(nextSession('focus', 3, settings), { mode: 'longBreak', completedFocusCycles: 4 });
  assert.deepEqual(nextSession('longBreak', 4, settings), { mode: 'focus', completedFocusCycles: 4 });
});

test('uses the configured duration for every session type', () => {
  assert.equal(durationSeconds('focus', settings), 1500);
  assert.equal(durationSeconds('break', settings), 300);
  assert.equal(durationSeconds('longBreak', settings), 900);
});
