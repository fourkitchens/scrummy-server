const WebSocketServer = require('uws').Server;

const logger = require('./util/_logger');

module.exports = function server(port) {
  logger.info(`websocketing on port ${port}`);
  return new WebSocketServer({
    port,
  });
};
