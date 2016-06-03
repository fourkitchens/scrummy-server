const WebSocketServer = require('ws').Server;

const logger = require('./util/_logger');

module.exports = function server(port) {
  logger(`websocketing on localhost:${port}\n`);
  return new WebSocketServer({
    port,
  });
};
