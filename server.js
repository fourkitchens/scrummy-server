const WebSocketServer = require('ws').Server;

function getServer(port) {
  process.stdout.write(`websocketing on localhost:${port}\n`);
  return new WebSocketServer({
    port,
  });
}

module.exports = getServer;
