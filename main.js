const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { startupExecutable } = require('./startup-path');

let win;
const hasSingleInstanceLock = app.requestSingleInstanceLock();
const defaults = {
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  cyclesUntilLongBreak: 4,
  autoStart: true,
  launchAtLogin: true,
  sound: true,
  volume: 80,
  reminders: { stretch: true, water: true, squats: true, pushups: true, crunches: true }
};

const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');

function readSettings() {
  try {
    const saved = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
    return { ...defaults, ...saved, reminders: { ...defaults.reminders, ...saved.reminders } };
  } catch {
    return defaults;
  }
}

function saveSettings(settings) {
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2));
  setLaunchAtLogin(settings.launchAtLogin);
}

function setLaunchAtLogin(enabled) {
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    path: startupExecutable(),
    args: []
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 920,
    minHeight: 650,
    backgroundColor: '#fff2ad',
    title: 'PomoPal',
    icon: path.join(__dirname, 'assets', 'pomopal-mascot.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

if (!hasSingleInstanceLock) {
  app.quit();
} else app.whenReady().then(() => {
  setLaunchAtLogin(readSettings().launchAtLogin);
  ipcMain.handle('settings:get', readSettings);
  ipcMain.handle('settings:save', (_event, settings) => {
    saveSettings(settings);
    return settings;
  });
  ipcMain.on('timer:alert', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.maximize();
    win.setAlwaysOnTop(true);
    win.focus();
    setTimeout(() => win?.setAlwaysOnTop(false), 1500);
  });
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length || createWindow());
});

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
