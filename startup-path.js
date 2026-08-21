function startupExecutable(env = process.env, execPath = process.execPath) {
  return env.PORTABLE_EXECUTABLE_FILE || execPath;
}

module.exports = { startupExecutable };
