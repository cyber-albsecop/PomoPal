(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TimerState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function nextSession(mode, completedFocusCycles, settings) {
    if (mode !== 'focus') return { mode: 'focus', completedFocusCycles };
    const cycles = completedFocusCycles + 1;
    return {
      mode: cycles % settings.cyclesUntilLongBreak === 0 ? 'longBreak' : 'break',
      completedFocusCycles: cycles
    };
  }

  function durationSeconds(mode, settings) {
    const key = mode === 'focus' ? 'focusMinutes' : mode === 'longBreak' ? 'longBreakMinutes' : 'breakMinutes';
    return Math.max(1, Number(settings[key])) * 60;
  }

  return { nextSession, durationSeconds };
});
