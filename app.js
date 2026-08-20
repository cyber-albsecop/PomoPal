const reminders = [
  { key: 'stretch', icon: '🙆', label: 'Stretch' },
  { key: 'water', icon: '💧', label: 'Drink water' },
  { key: 'squats', icon: '🏋️', label: '20 squats' },
  { key: 'pushups', icon: '💪', label: '20 push-ups' },
  { key: 'crunches', icon: '🕺', label: '20 standing elbow-to-knee crunches' }
];
window.pomo ||= {
  getSettings: async () => ({ focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, cyclesUntilLongBreak: 4, autoStart: true, launchAtLogin: true, sound: false, volume: 80, reminders: { stretch: true, water: true, squats: true, pushups: true, crunches: true } }),
  saveSettings: async (value) => value,
  alert: () => {}
};
const lines = {
  focus: ['Tiny timer. Suspiciously large ambitions.', 'Lock in. The tomato believes in you.', 'One task. Zero dramatic side quests.'],
  break: ['Hands off the keyboard, champion.', 'Your spine has requested a meeting.', 'Hydrate before you disintegrate.'],
  longBreak: ['Big break unlocked. Go be a human.', 'Long break: the deluxe body maintenance pack.']
};

let settings;
let mode = 'focus';
let completedFocusCycles = 0;
let remaining = 0;
let endAt = 0;
let running = false;
let interval;

const $ = (id) => document.getElementById(id);
const timeEl = $('time');
const modeLabel = $('modeLabel');
const toggleButton = $('toggleButton');
const settingsDialog = $('settingsDialog');

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function updateUI() {
  timeEl.textContent = formatTime(remaining);
  modeLabel.textContent = mode === 'focus' ? 'FOCUS TIME' : mode === 'longBreak' ? 'LONG BREAK' : 'BREAK TIME';
  $('cycleLabel').textContent = `Cycle ${(completedFocusCycles % settings.cyclesUntilLongBreak) + 1} of ${settings.cyclesUntilLongBreak}`;
  toggleButton.textContent = running ? 'Pause' : 'Start';
  document.body.dataset.mode = mode;
  renderDots();
}

function renderDots() {
  $('cycleDots').innerHTML = Array.from({ length: settings.cyclesUntilLongBreak }, (_, index) =>
    `<span class="dot ${index < completedFocusCycles % settings.cyclesUntilLongBreak ? 'done' : ''}"></span>`
  ).join('');
}

function start() {
  if (running) return;
  running = true;
  endAt = Date.now() + remaining * 1000;
  interval = setInterval(tick, 250);
  updateUI();
}

function pause() {
  if (!running) return;
  remaining = Math.max(0, (endAt - Date.now()) / 1000);
  running = false;
  clearInterval(interval);
  updateUI();
}

function tick() {
  remaining = Math.max(0, (endAt - Date.now()) / 1000);
  updateUI();
  if (remaining <= 0) completeSession();
}

function reset(autoStart = false) {
  clearInterval(interval);
  running = false;
  remaining = TimerState.durationSeconds(mode, settings);
  $('memeLine').textContent = lines[mode][Math.floor(Math.random() * lines[mode].length)];
  updateUI();
  if (autoStart) start();
}

function enabledReminders() {
  return reminders.filter((item) => settings.reminders[item.key]);
}

function completeSession() {
  clearInterval(interval);
  running = false;
  const completedMode = mode;
  const next = TimerState.nextSession(mode, completedFocusCycles, settings);
  mode = next.mode;
  completedFocusCycles = next.completedFocusCycles;
  const active = enabledReminders();
  const reminder = completedMode === 'focus' && active.length ? active.map((item) => item.label).join(' • ') : 'Back to focus';
  $('alertTitle').textContent = completedMode === 'focus' ? 'YOU DID THE THING!' : 'BREAK COMPLETE!';
  $('alertReminder').textContent = completedMode === 'focus' ? `Break mission: ${reminder}` : reminder;
  $('alertOverlay').hidden = false;
  window.pomo.alert();
  playRing();
  reset(false);
}

function playRing() {
  if (!settings.sound) return;
  const audio = new AudioContext();
  const gain = audio.createGain();
  gain.gain.value = settings.volume / 100 * 0.25;
  gain.connect(audio.destination);
  [0, .22, .44].forEach((delay, index) => {
    const oscillator = audio.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = index === 1 ? 880 : 660;
    oscillator.connect(gain);
    oscillator.start(audio.currentTime + delay);
    oscillator.stop(audio.currentTime + delay + .18);
  });
  setTimeout(() => audio.close(), 1200);
}

function renderReminders() {
  $('reminderList').innerHTML = reminders.map((item) => `
    <label class="reminder"><span class="emoji">${item.icon}</span><span>${item.label}</span>
      <input class="switch reminder-toggle" data-key="${item.key}" type="checkbox" ${settings.reminders[item.key] ? 'checked' : ''}>
    </label>`).join('');
  document.querySelectorAll('.reminder-toggle').forEach((input) => input.addEventListener('change', async () => {
    settings.reminders[input.dataset.key] = input.checked;
    await window.pomo.saveSettings(settings);
  }));
}

function openSettings() {
  ['focusMinutes', 'breakMinutes', 'longBreakMinutes', 'cyclesUntilLongBreak', 'volume'].forEach((key) => $(key).value = settings[key]);
  ['autoStart', 'launchAtLogin', 'sound'].forEach((key) => $(key).checked = settings[key]);
  $('volumeOutput').textContent = `${settings.volume}%`;
  settingsDialog.showModal();
}

async function saveSettings(event) {
  event.preventDefault();
  ['focusMinutes', 'breakMinutes', 'longBreakMinutes', 'cyclesUntilLongBreak', 'volume'].forEach((key) => settings[key] = Number($(key).value));
  ['autoStart', 'launchAtLogin', 'sound'].forEach((key) => settings[key] = $(key).checked);
  await window.pomo.saveSettings(settings);
  renderReminders();
  reset(settings.autoStart);
  settingsDialog.close();
}

async function init() {
  settings = await window.pomo.getSettings();
  renderReminders();
  mode = 'focus';
  reset(settings.autoStart);
  $('settingsButton').addEventListener('click', openSettings);
  $('saveSettings').addEventListener('click', saveSettings);
  $('volume').addEventListener('input', () => $('volumeOutput').textContent = `${$('volume').value}%`);
  toggleButton.addEventListener('click', () => running ? pause() : start());
  $('resetButton').addEventListener('click', () => reset(settings.autoStart));
  $('skipButton').addEventListener('click', completeSession);
  $('dismissAlert').addEventListener('click', () => {
    $('alertOverlay').hidden = true;
    if (settings.autoStart) start();
  });
}

init();
