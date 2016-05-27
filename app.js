const config = require('config');
const server = require('./server');

const wss = server(config.get('port'));

wss.on('connection', ws => {
  ws.on('message', message => {
    ws.send(message);
  });
});
