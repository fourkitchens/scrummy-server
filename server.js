const WebSocketServer = require('ws').Server;

module.exports = function server(port) {
  process.stdout.write(`websocketing on localhost:${port}\n`);
  return new WebSocketServer({
    port,
  });
};
