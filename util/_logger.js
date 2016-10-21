const { Logger, transports: { Console } } = require('winston');

module.exports = new Logger({
  transports: [
    new Console({ colorize: true }),
  ],
});
