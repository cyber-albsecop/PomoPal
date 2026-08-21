const test = require('node:test');
const assert = require('node:assert/strict');
const { startupExecutable } = require('./startup-path');

test('registers the original portable file instead of its temporary extraction', () => {
  assert.equal(startupExecutable({ PORTABLE_EXECUTABLE_FILE: 'C:\\Apps\\PomoPal.exe' }, 'C:\\Temp\\PomoPal.exe'), 'C:\\Apps\\PomoPal.exe');
  assert.equal(startupExecutable({}, 'C:\\Program Files\\PomoPal\\PomoPal.exe'), 'C:\\Program Files\\PomoPal\\PomoPal.exe');
});
