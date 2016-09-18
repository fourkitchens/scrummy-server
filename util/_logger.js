const loggingEnabled = require('config').logging;

module.exports = (message) => {
  if (loggingEnabled) {
    process.stdout.write(message);
  }
};
