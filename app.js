const config = require('config');
const server = require('./server');

const generateGameName = require('./util/generateGameName');
const getFormattedEntityName = require('./util/getFormattedEntityName');
const getUniqueFormattedEntityName = require('./util/getUniqueFormattedEntityName');

class Scrummy {
  constructor() {
    this.wss = server(config.get('port'));
    this.bucket = {};
    this.setupMessageHandling();
    this.exposedMethods = [
      'signIn',
    ];
  }
  setupMessageHandling() {
    this.wss.on('connection', ws => {
      ws.on('message', message => {
        const data = JSON.parse(message);
        if (this.exposedMethods.includes(data.type)) {
          this[data.type](data, ws);
        } else {
          this.handleInvalidMessage(data, ws);
        }
      });
    });
  }
  shutdown() {
    this.wss.close();
  }
  broadcast(data, clients) {
    clients.forEach(client => client.ws.send(data));
  }
  handleInvalidMessage(data, ws) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `${data.type} is not a message type Scrummy is prepared for!`,
    }));
  }
  signIn(data, ws) {
    const requestedGame = getFormattedEntityName(data.game)
      || generateGameName(Object.keys(this.bucket));
    if (typeof this.bucket[requestedGame] === 'undefined') {
      this.bucket[requestedGame] = {
        clients: [],
        users: [],
      };
    }
    const nickname = getUniqueFormattedEntityName(
      data.nickname,
      this.bucket[requestedGame].users.map(user => user.nickname)
    );
    if (!nickname) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'This username is unavailable; please pick another.',
      }));
      return;
    }
    this.bucket[requestedGame].clients.push({
      nickname,
      ws,
      game: requestedGame,
    });
    this.bucket[requestedGame].users.push({
      nickname,
      game: requestedGame,
    });
    ws.send(JSON.stringify({
      type: 'youSignedIn',
      nickname,
      points: config.get('points'),
      users: this.bucket[requestedGame].users,
      game: requestedGame,
    }));
    this.broadcast(JSON.stringify({
      type: 'someoneSignedIn',
      nickname,
      users: this.bucket[requestedGame].users,
    }), this.bucket[requestedGame].clients);
  }
}

module.exports = Scrummy;
